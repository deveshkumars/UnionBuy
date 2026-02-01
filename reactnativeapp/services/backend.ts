/**
 * AWS backend service: Cognito + AppSync/DynamoDB
 * Used by api.ts when amplify_outputs.json is present (after `ampx sandbox`).
 */

import { Auth, configureAmplify, getDataClient, isBackendConfigured } from '@/lib/amplify';
import type { BulkOrder, Distribution, Location, Mission, Pledge, Product, RouteInfo, Store, User } from '@/types';

// Use API key client for everything (no auth required)
const getClient = getDataClient;

// Ensure Amplify is configured when this module is used
configureAmplify();

function parseLocation(json: string | null | undefined): Location {
  if (!json) return { latitude: 0, longitude: 0 };
  try {
    const o = JSON.parse(json) as Location;
    return { latitude: o.latitude ?? 0, longitude: o.longitude ?? 0, address: o.address, neighborhood: o.neighborhood };
  } catch {
    return { latitude: 0, longitude: 0 };
  }
}

function parseStore(json: string): Store {
  try {
    const o = JSON.parse(json) as Store;
    return {
      id: o.id ?? '',
      name: o.name ?? '',
      type: o.type ?? 'retail',
      location: o.location ?? { latitude: 0, longitude: 0 },
      logo: o.logo,
    };
  } catch {
    return { id: '', name: '', type: 'retail', location: { latitude: 0, longitude: 0 } };
  }
}

function productFromRecord(r: {
  id: string;
  name: string;
  category: string;
  description?: string | null;
  unit: string;
  retailPrice: number;
  bulkPrice: number;
  bulkMinimum: number;
  storeJson: string;
  available?: boolean | null;
  image?: string | null;
}): Product {
  return {
    id: r.id,
    name: r.name,
    category: r.category as Product['category'],
    description: r.description ?? '',
    unit: r.unit,
    retailPrice: r.retailPrice,
    bulkPrice: r.bulkPrice,
    bulkMinimum: r.bulkMinimum,
    store: parseStore(r.storeJson),
    available: r.available ?? true,
    image: r.image ?? undefined,
  };
}

function parseProductSnapshot(json: string): Product {
  try {
    const snap = JSON.parse(json) as Product;
    if (snap?.id && snap.name) {
      const store = snap.store && typeof snap.store === 'object'
        ? snap.store
        : parseStore(JSON.stringify(snap.store ?? {}));
      return { ...snap, store };
    }
  } catch {
    /* fallback below */
  }
  return productFromRecord({
    id: '',
    name: '',
    category: 'pantry',
    unit: '',
    storeJson: '{}',
    retailPrice: 0,
    bulkPrice: 0,
    bulkMinimum: 0,
  } as never);
}

function pledgeFromRecord(r: {
  id: string;
  userId: string;
  productId: string;
  productSnapshotJson: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  maxAmount: number;
  status: string;
  createdAt: string;
  lockedAt?: string | null;
  completedAt?: string | null;
  orderId?: string | null;
}): Pledge {
  const product = parseProductSnapshot(r.productSnapshotJson || '{}');
  if (product.id !== r.productId) product.id = r.productId;
  return {
    id: r.id,
    userId: r.userId,
    productId: r.productId,
    product,
    quantity: r.quantity,
    unitPrice: r.unitPrice,
    totalAmount: r.totalAmount,
    maxAmount: r.maxAmount,
    status: r.status as Pledge['status'],
    createdAt: r.createdAt,
    lockedAt: r.lockedAt ?? undefined,
    completedAt: r.completedAt ?? undefined,
    orderId: r.orderId ?? undefined,
  };
}

function bulkOrderFromRecord(r: {
  id: string;
  productId: string;
  productSnapshotJson: string;
  totalQuantity: number;
  targetQuantity: number;
  pricePerUnit: number;
  status: string;
  cutoffTime: string;
  createdAt: string;
  executedAt?: string | null;
  runnerId?: string | null;
  dropZoneJson?: string | null;
}): BulkOrder {
  const product = parseProductSnapshot(r.productSnapshotJson || '{}');
  if (product.id !== r.productId) product.id = r.productId;
  return {
    id: r.id,
    productId: r.productId,
    product,
    pledges: [], // Backend doesn't embed pledges; fetch separately if needed
    totalQuantity: r.totalQuantity,
    targetQuantity: r.targetQuantity,
    pricePerUnit: r.pricePerUnit,
    status: r.status as BulkOrder['status'],
    cutoffTime: r.cutoffTime,
    createdAt: r.createdAt,
    executedAt: r.executedAt ?? undefined,
    runnerId: r.runnerId ?? undefined,
    dropZone: r.dropZoneJson ? parseLocation(r.dropZoneJson) : undefined,
  };
}

// ============================================
// PRODUCTS
// ============================================

export async function fetchProductsFromBackend(): Promise<Product[]> {
  const client = getDataClient();
  const { data } = await client.models.Product.list();
  return data.map((r) => productFromRecord(r as never));
}

export async function fetchProductByIdFromBackend(id: string): Promise<Product | null> {
  const client = getDataClient();
  const { data } = await client.models.Product.get({ id });
  return data ? productFromRecord(data as never) : null;
}

export async function searchProductsFromBackend(query: string): Promise<Product[]> {
  const all = await fetchProductsFromBackend();
  const q = query.toLowerCase();
  return all.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      (p.description && p.description.toLowerCase().includes(q))
  );
}

// ============================================
// PLEDGES (owner = current user)
// ============================================

export async function fetchUserPledgesFromBackend(userId: string): Promise<Pledge[]> {
  const client = getClient();
  const { data } = await client.models.Pledge.list({ filter: { userId: { eq: userId } } });
  return data.map((r) => pledgeFromRecord(r as never));
}

// Default user ID for anonymous access (no login required)
const DEFAULT_USER_ID = 'anonymous-user';

export async function createPledgeInBackend(
  productId: string,
  product: Product,
  quantity: number,
  unitPrice: number,
  totalAmount: number,
  maxAmount: number,
  userId: string = DEFAULT_USER_ID
): Promise<{ success: boolean; pledge?: Pledge; error?: string }> {
  try {
    const client = getClient();
    const { data: created, errors } = await client.models.Pledge.create({
      userId,
      productId,
      productSnapshotJson: JSON.stringify(product),
      quantity,
      unitPrice,
      totalAmount,
      maxAmount,
      status: 'locked',
    });
    if (errors?.length) return { success: false, error: errors[0].message };
    if (!created) return { success: false, error: 'Create failed' };
    const pledge = pledgeFromRecord({ ...created, createdAt: created.createdAt ?? new Date().toISOString() } as never);
    return { success: true, pledge };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

export async function fetchPledgeByIdFromBackend(pledgeId: string): Promise<Pledge | null> {
  try {
    const client = getClient();
    const { data } = await client.models.Pledge.get({ id: pledgeId });
    return data ? pledgeFromRecord({ ...data, createdAt: data.createdAt ?? new Date().toISOString() } as never) : null;
  } catch {
    return null;
  }
}

export async function cancelPledgeInBackend(pledgeId: string): Promise<{ success: boolean; pledge?: Pledge; error?: string }> {
  try {
    const client = getClient();
    const { data: existing } = await client.models.Pledge.get({ id: pledgeId });
    if (!existing || !['pending', 'locked'].includes(existing.status as string))
      return { success: false, error: 'Cannot cancel' };
    
    // Update pledge status to cancelled
    await client.models.Pledge.update({ id: pledgeId, status: 'cancelled' });
    
    // Update bulk order quantity (subtract cancelled pledge quantity)
    const bulkOrder = await fetchBulkOrderForProductFromBackend(existing.productId, 'collecting');
    if (bulkOrder) {
      const newTotal = Math.max(0, bulkOrder.totalQuantity - existing.quantity);
      await updateBulkOrderInBackend(bulkOrder.id, { totalQuantity: newTotal });
      console.log('[cancelPledgeInBackend] Updated bulk order qty:', newTotal);
    }
    
    const pledge = pledgeFromRecord({ ...existing, status: 'cancelled', createdAt: existing.createdAt ?? new Date().toISOString() } as never);
    return { success: true, pledge };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

// ============================================
// BULK ORDERS
// ============================================

export async function fetchBulkOrdersFromBackend(): Promise<BulkOrder[]> {
  const client = getDataClient();
  const { data } = await client.models.BulkOrder.list();
  return data.map((r) => bulkOrderFromRecord(r as never));
}

export async function fetchActiveBulkOrdersFromBackend(): Promise<BulkOrder[]> {
  const all = await fetchBulkOrdersFromBackend();
  return all.filter((o) => o.status === 'collecting');
}

export async function fetchBulkOrderByIdFromBackend(id: string): Promise<BulkOrder | null> {
  try {
    const client = getClient();
    const { data } = await client.models.BulkOrder.get({ id });
    return data ? bulkOrderFromRecord(data as never) : null;
  } catch {
    return null;
  }
}

export async function fetchBulkOrderForProductFromBackend(productId: string, status?: string): Promise<BulkOrder | null> {
  try {
    const client = getClient();
    const filter: Record<string, unknown> = { productId: { eq: productId } };
    if (status) {
      filter.status = { eq: status };
    }
    const { data } = await client.models.BulkOrder.list({ filter });
    if (data.length === 0) return null;
    // If no specific status, prioritize 'collecting' orders
    if (!status) {
      const collecting = data.find(o => o.status === 'collecting');
      if (collecting) return bulkOrderFromRecord(collecting as never);
    }
    return bulkOrderFromRecord(data[0] as never);
  } catch {
    return null;
  }
}

export async function createBulkOrderInBackend(
  product: Product,
  cutoffTime: string
): Promise<{ success: boolean; bulkOrder?: BulkOrder; error?: string }> {
  try {
    const client = getClient();
    const { data: created, errors } = await client.models.BulkOrder.create({
      productId: product.id,
      productSnapshotJson: JSON.stringify(product),
      totalQuantity: 0,
      targetQuantity: product.bulkMinimum,
      pricePerUnit: product.bulkPrice,
      status: 'collecting',
      cutoffTime,
    });
    if (errors?.length) return { success: false, error: errors[0].message };
    if (!created) return { success: false, error: 'Create failed' };
    return { success: true, bulkOrder: bulkOrderFromRecord({ ...created, createdAt: created.createdAt ?? new Date().toISOString() } as never) };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

export async function updateBulkOrderInBackend(
  orderId: string,
  updates: {
    totalQuantity?: number;
    status?: BulkOrder['status'];
    runnerId?: string;
    executedAt?: string;
    dropZoneJson?: string;
  }
): Promise<{ success: boolean; bulkOrder?: BulkOrder; error?: string }> {
  try {
    const client = getClient();
    const updateData: Record<string, unknown> = { id: orderId };
    if (updates.totalQuantity !== undefined) updateData.totalQuantity = updates.totalQuantity;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.runnerId !== undefined) updateData.runnerId = updates.runnerId;
    if (updates.executedAt !== undefined) updateData.executedAt = updates.executedAt;
    if (updates.dropZoneJson !== undefined) updateData.dropZoneJson = updates.dropZoneJson;
    
    const { data: updated, errors } = await client.models.BulkOrder.update(updateData as never);
    if (errors?.length) return { success: false, error: errors[0].message };
    if (!updated) return { success: false, error: 'Update failed' };
    return { success: true, bulkOrder: bulkOrderFromRecord(updated as never) };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

export async function getOrCreateBulkOrderForProductFromBackend(
  product: Product,
  cutoffHoursFromNow: number = 24
): Promise<{ bulkOrder: BulkOrder | null; created: boolean; error?: string }> {
  try {
    // First try to find an existing collecting order for this product
    const existing = await fetchBulkOrderForProductFromBackend(product.id, 'collecting');
    if (existing) {
      return { bulkOrder: existing, created: false };
    }
    
    // No existing order, create a new one
    const cutoffTime = new Date(Date.now() + cutoffHoursFromNow * 60 * 60 * 1000).toISOString();
    const result = await createBulkOrderInBackend(product, cutoffTime);
    if (result.success && result.bulkOrder) {
      return { bulkOrder: result.bulkOrder, created: true };
    }
    return { bulkOrder: null, created: false, error: result.error };
  } catch (e) {
    return { bulkOrder: null, created: false, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

// ============================================
// MISSIONS
// ============================================

function parseStoresJson(json: string): Store[] {
  try {
    const stores = JSON.parse(json) as Store[];
    return stores.map(s => ({
      id: s.id ?? '',
      name: s.name ?? '',
      type: s.type ?? 'retail',
      location: s.location ?? { latitude: 0, longitude: 0 },
      logo: s.logo,
    }));
  } catch {
    return [];
  }
}

function parseRouteJson(json: string): RouteInfo {
  try {
    const route = JSON.parse(json) as RouteInfo;
    return {
      stores: route.stores ?? [],
      dropZone: route.dropZone ?? { latitude: 0, longitude: 0 },
      totalDistance: route.totalDistance ?? 0,
      estimatedTime: route.estimatedTime ?? 0,
      optimizedOrder: route.optimizedOrder ?? [],
    };
  } catch {
    return {
      stores: [],
      dropZone: { latitude: 0, longitude: 0 },
      totalDistance: 0,
      estimatedTime: 0,
      optimizedOrder: [],
    };
  }
}

function missionFromRecord(r: {
  id: string;
  runnerId?: string | null;
  status: string;
  estimatedEarnings: number;
  tips?: number | null;
  totalItems: number;
  totalWeight?: number | null;
  storesJson: string;
  routeJson: string;
  dropZoneJson: string;
  createdAt: string;
  acceptedAt?: string | null;
  completedAt?: string | null;
}): Mission {
  return {
    id: r.id,
    orders: [], // Orders are fetched separately if needed
    runnerId: r.runnerId ?? undefined,
    status: r.status as Mission['status'],
    estimatedEarnings: r.estimatedEarnings,
    tips: r.tips ?? 0,
    totalItems: r.totalItems,
    totalWeight: r.totalWeight ?? undefined,
    stores: parseStoresJson(r.storesJson),
    route: parseRouteJson(r.routeJson),
    dropZone: parseLocation(r.dropZoneJson),
    createdAt: r.createdAt,
    acceptedAt: r.acceptedAt ?? undefined,
    completedAt: r.completedAt ?? undefined,
  };
}

export async function fetchAvailableMissionsFromBackend(): Promise<Mission[]> {
  try {
    const client = getClient();
    if (!client.models.Mission) {
      console.warn('[fetchAvailableMissionsFromBackend] Mission model not available - redeploy sandbox with `npx ampx sandbox`');
      return [];
    }
    const { data } = await client.models.Mission.list({ filter: { status: { eq: 'available' } } });
    return data.map((r) => missionFromRecord(r as never));
  } catch (e) {
    console.error('[fetchAvailableMissionsFromBackend] Error:', e instanceof Error ? e.message : e);
    return [];
  }
}

export async function fetchMissionByIdFromBackend(missionId: string): Promise<Mission | null> {
  try {
    const client = getClient();
    const { data } = await client.models.Mission.get({ id: missionId });
    return data ? missionFromRecord(data as never) : null;
  } catch {
    return null;
  }
}

export async function acceptMissionInBackend(
  missionId: string,
  runnerId: string
): Promise<{ success: boolean; mission?: Mission; error?: string }> {
  try {
    const client = getClient();
    const { data: existing } = await client.models.Mission.get({ id: missionId });
    if (!existing || existing.status !== 'available') {
      return { success: false, error: 'Mission not available' };
    }
    const { data: updated, errors } = await client.models.Mission.update({
      id: missionId,
      runnerId,
      status: 'accepted',
      acceptedAt: new Date().toISOString(),
    });
    if (errors?.length) return { success: false, error: errors[0].message };
    if (!updated) return { success: false, error: 'Update failed' };
    return { success: true, mission: missionFromRecord(updated as never) };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

export async function updateMissionStatusInBackend(
  missionId: string,
  status: Mission['status']
): Promise<{ success: boolean; error?: string }> {
  try {
    const client = getClient();
    if (!client.models.Mission) {
      console.error('[updateMissionStatusInBackend] Mission model not available');
      return { success: false, error: 'Mission model not available' };
    }
    
    console.log('[updateMissionStatusInBackend] Updating mission:', missionId, 'to status:', status);
    const updateData: Record<string, unknown> = { id: missionId, status };
    if (status === 'completed') {
      updateData.completedAt = new Date().toISOString();
    }
    const { errors } = await client.models.Mission.update(updateData as never);
    if (errors?.length) {
      console.error('[updateMissionStatusInBackend] Error:', errors[0].message);
      return { success: false, error: errors[0].message };
    }
    console.log('[updateMissionStatusInBackend] ✅ Status updated successfully');
    return { success: true };
  } catch (e) {
    console.error('[updateMissionStatusInBackend] Exception:', e);
    return { success: false, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

/**
 * Create a new mission when a bulk order is ready to be executed
 */
export async function createMissionInBackend(
  bulkOrder: BulkOrder,
  product: Product
): Promise<{ success: boolean; mission?: Mission; error?: string }> {
  try {
    const client = getClient();
    
    // Check if Mission model is available (needs sandbox redeployment if not)
    if (!client.models.Mission) {
      console.error('[createMissionInBackend] Mission model not available - redeploy sandbox with `npx ampx sandbox`');
      return { success: false, error: 'Mission model not available - please redeploy the Amplify sandbox' };
    }
    
    // Build route info from the store
    const store = product.store;
    const dropZone: Location = bulkOrder.dropZone || {
      latitude: store.location.latitude + 0.01, // Nearby drop zone
      longitude: store.location.longitude + 0.01,
      address: 'Community Drop Zone',
    };
    
    const routeInfo: RouteInfo = {
      stores: [store.location],
      dropZone,
      totalDistance: 5.0, // Estimated distance
      estimatedTime: 30, // Estimated 30 minutes
      optimizedOrder: [0],
    };
    
    // Calculate estimated earnings (base pay + per-item bonus)
    const basePay = 10.00;
    const perItemBonus = 0.25;
    const estimatedEarnings = basePay + (bulkOrder.totalQuantity * perItemBonus);
    
    const { data: created, errors } = await client.models.Mission.create({
      status: 'available',
      estimatedEarnings,
      tips: 0,
      totalItems: bulkOrder.totalQuantity,
      totalWeight: bulkOrder.totalQuantity * 0.5, // Rough estimate
      storesJson: JSON.stringify([store]),
      routeJson: JSON.stringify(routeInfo),
      dropZoneJson: JSON.stringify(dropZone),
    });
    
    if (errors?.length) return { success: false, error: errors[0].message };
    if (!created) return { success: false, error: 'Failed to create mission' };
    
    console.log('[createMissionInBackend] ✅ Mission created:', created.id);
    return { success: true, mission: missionFromRecord(created as never) };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

// ============================================
// DISTRIBUTIONS
// ============================================

function parseDistributionItems(json: string): Distribution['items'] {
  try {
    return JSON.parse(json) as Distribution['items'];
  } catch {
    return [];
  }
}

function distributionFromRecord(r: {
  id: string;
  missionId: string;
  userId: string;
  itemsJson: string;
  pickupPin: string;
  status: string;
  createdAt: string;
  scheduledTime?: string | null;
  completedAt?: string | null;
}): Omit<Distribution, 'user'> & { visitorUserId: string } {
  return {
    id: r.id,
    missionId: r.missionId,
    userId: r.userId,
    visitorUserId: r.userId, // For fetching user separately
    items: parseDistributionItems(r.itemsJson),
    pickupPin: r.pickupPin,
    status: r.status as Distribution['status'],
    scheduledTime: r.scheduledTime ?? undefined,
    completedAt: r.completedAt ?? undefined,
  };
}

export async function fetchDistributionsForMissionFromBackend(missionId: string): Promise<Distribution[]> {
  try {
    const client = getClient();
    const { data } = await client.models.Distribution.list({ filter: { missionId: { eq: missionId } } });
    // Note: We don't have the full User object here, would need to fetch separately
    return data.map((r) => {
      const dist = distributionFromRecord(r as never);
      return {
        ...dist,
        user: { id: dist.userId, name: 'Customer', email: '', phone: '', role: 'customer' as const, location: { latitude: 0, longitude: 0 }, trustScore: 5, joinedAt: '' },
      } as Distribution;
    });
  } catch {
    return [];
  }
}

export async function fetchDistributionForUserFromBackend(userId: string): Promise<Distribution | null> {
  try {
    const client = getClient();
    const { data } = await client.models.Distribution.list({ 
      filter: { 
        userId: { eq: userId },
        status: { ne: 'completed' } // Get active distribution
      } 
    });
    if (data.length === 0) return null;
    const dist = distributionFromRecord(data[0] as never);
    return {
      ...dist,
      user: { id: dist.userId, name: 'Customer', email: '', phone: '', role: 'customer' as const, location: { latitude: 0, longitude: 0 }, trustScore: 5, joinedAt: '' },
    } as Distribution;
  } catch {
    return null;
  }
}

export async function verifyDistributionPinInBackend(
  distributionId: string,
  pin: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const client = getClient();
    const { data: existing } = await client.models.Distribution.get({ id: distributionId });
    if (!existing) return { success: false, error: 'Distribution not found' };
    if (existing.pickupPin !== pin) return { success: false, error: 'Invalid PIN' };
    
    const { errors } = await client.models.Distribution.update({
      id: distributionId,
      status: 'verified',
    });
    if (errors?.length) return { success: false, error: errors[0].message };
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

export async function updateDistributionStatusInBackend(
  distributionId: string,
  status: Distribution['status']
): Promise<{ success: boolean; error?: string }> {
  try {
    const client = getClient();
    const updateData: Record<string, unknown> = { id: distributionId, status };
    if (status === 'completed') {
      updateData.completedAt = new Date().toISOString();
    }
    const { errors } = await client.models.Distribution.update(updateData as never);
    if (errors?.length) return { success: false, error: errors[0].message };
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

export async function createDistributionInBackend(
  missionId: string,
  userId: string,
  items: Distribution['items'],
  pickupPin: string,
  scheduledTime?: string
): Promise<{ success: boolean; distribution?: Distribution; error?: string }> {
  try {
    const client = getClient();
    const { data: created, errors } = await client.models.Distribution.create({
      missionId,
      userId,
      itemsJson: JSON.stringify(items),
      pickupPin,
      status: 'pending',
      scheduledTime: scheduledTime || null,
    });
    if (errors?.length) return { success: false, error: errors[0].message };
    if (!created) return { success: false, error: 'Create failed' };
    const dist = distributionFromRecord({ ...created, createdAt: created.createdAt ?? new Date().toISOString() } as never);
    return {
      success: true,
      distribution: {
        ...dist,
        user: { id: dist.userId, name: 'Customer', email: '', phone: '', role: 'customer' as const, location: { latitude: 0, longitude: 0 }, trustScore: 5, joinedAt: '' },
      } as Distribution,
    };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

// ============================================
// AUTH & USER PROFILE
// ============================================

function userFromProfileRecord(profile: {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: string;
  locationJson?: string | null;
  trustScore?: number | null;
  joinedAt: string;
  avatar?: string | null;
}): User {
  const loc = profile.locationJson ? parseLocation(profile.locationJson) : { latitude: 0, longitude: 0 };
  return {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    phone: profile.phone ?? '',
    role: (profile.role as User['role']) ?? 'customer',
    location: loc,
    trustScore: profile.trustScore ?? 5,
    joinedAt: profile.joinedAt,
    avatar: profile.avatar ?? undefined,
  };
}

export async function getCurrentAuthUserFromBackend(): Promise<User | null> {
  try {
    const client = getClient();
    // Try to get a profile with the default anonymous user ID first
    const { data: profile } = await client.models.UserProfile.get({ id: DEFAULT_USER_ID });
    if (profile) {
      return userFromProfileRecord(profile as never);
    }
    // Return a default anonymous user
    return {
      id: DEFAULT_USER_ID,
      name: 'Guest User',
      email: 'guest@example.com',
      phone: '',
      role: 'customer',
      location: { latitude: 0, longitude: 0 },
      trustScore: 5,
      joinedAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

/**
 * Create a new UserProfile in DynamoDB
 */
export async function createUserProfileInBackend(
  userData: Omit<User, 'id'>
): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    const client = getClient();
    const { data: created, errors } = await client.models.UserProfile.create({
      name: userData.name,
      email: userData.email,
      phone: userData.phone || null,
      role: userData.role,
      locationJson: JSON.stringify(userData.location),
      trustScore: userData.trustScore ?? 5,
      joinedAt: userData.joinedAt || new Date().toISOString(),
      avatar: userData.avatar || null,
    });
    if (errors?.length) return { success: false, error: errors[0].message };
    if (!created) return { success: false, error: 'Create failed' };
    return { success: true, user: userFromProfileRecord(created as never) };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

/**
 * Update an existing UserProfile in DynamoDB
 */
export async function updateUserProfileInBackend(
  userId: string,
  updates: Partial<Omit<User, 'id'>>
): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    const client = getClient();
    
    // Build the update object with only provided fields
    const updateData: Record<string, unknown> = { id: userId };
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.email !== undefined) updateData.email = updates.email;
    if (updates.phone !== undefined) updateData.phone = updates.phone || null;
    if (updates.role !== undefined) updateData.role = updates.role;
    if (updates.location !== undefined) updateData.locationJson = JSON.stringify(updates.location);
    if (updates.trustScore !== undefined) updateData.trustScore = updates.trustScore;
    if (updates.avatar !== undefined) updateData.avatar = updates.avatar || null;
    
    const { data: updated, errors } = await client.models.UserProfile.update(updateData as never);
    if (errors?.length) return { success: false, error: errors[0].message };
    if (!updated) return { success: false, error: 'Update failed' };
    return { success: true, user: userFromProfileRecord(updated as never) };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

/**
 * Fetch a UserProfile by ID from DynamoDB
 */
export async function fetchUserProfileByIdFromBackend(userId: string): Promise<User | null> {
  try {
    const client = getClient();
    const { data } = await client.models.UserProfile.get({ id: userId });
    return data ? userFromProfileRecord(data as never) : null;
  } catch {
    return null;
  }
}

/**
 * Get the current user's profile, creating one if it doesn't exist
 * No auth required - uses anonymous user by default
 */
export async function getOrCreateUserProfile(
  defaultData?: Partial<Omit<User, 'id'>>
): Promise<{ user: User | null; created: boolean; error?: string }> {
  try {
    const client = getClient();
    
    // Try to fetch existing profile for anonymous user
    const { data: existingProfile } = await client.models.UserProfile.get({ id: DEFAULT_USER_ID });
    
    if (existingProfile) {
      return { user: userFromProfileRecord(existingProfile as never), created: false };
    }
    
    // No profile exists, create one for anonymous user
    const name = defaultData?.name || 'Guest User';
    const email = defaultData?.email || 'guest@example.com';
    
    const { data: created, errors } = await client.models.UserProfile.create({
      name,
      email,
      phone: defaultData?.phone || null,
      role: defaultData?.role || 'customer',
      locationJson: defaultData?.location ? JSON.stringify(defaultData.location) : JSON.stringify({ latitude: 0, longitude: 0 }),
      trustScore: defaultData?.trustScore ?? 5,
      joinedAt: new Date().toISOString(),
      avatar: defaultData?.avatar || null,
    });
    
    if (errors?.length) {
      return { user: null, created: false, error: errors[0].message };
    }
    
    if (!created) {
      return { user: null, created: false, error: 'Failed to create profile' };
    }
    
    return { user: userFromProfileRecord(created as never), created: true };
  } catch (e) {
    return { user: null, created: false, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}

export async function signInBackend(email: string, password: string): Promise<{ success: boolean; error?: string }> {
  try {
    await Auth.signIn({ username: email, password });
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Sign in failed' };
  }
}

export async function signUpBackend(
  email: string,
  password: string,
  name: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await Auth.signUp({
      username: email,
      password,
      options: { userAttributes: { email, name } },
    });
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Sign up failed' };
  }
}

export async function signOutBackend(): Promise<void> {
  await Auth.signOut();
}

/**
 * Check if a user is currently signed in
 */
export async function isUserAuthenticated(): Promise<boolean> {
  try {
    await Auth.getCurrentUser();
    return true;
  } catch {
    return false;
  }
}

export { isBackendConfigured };
