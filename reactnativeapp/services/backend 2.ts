/**
 * AWS backend service: Cognito + AppSync/DynamoDB
 * Used by api.ts when amplify_outputs.json is present (after `ampx sandbox`).
 */

import type { Product, Pledge, BulkOrder, User, Location, Store } from '@/types';
import { configureAmplify, isBackendConfigured, getDataClient, Auth } from '@/lib/amplify';

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
  const client = getDataClient();
  const { data } = await client.models.Pledge.list({ filter: { userId: { eq: userId } } });
  return data.map((r) => pledgeFromRecord(r as never));
}

export async function createPledgeInBackend(
  productId: string,
  product: Product,
  quantity: number,
  unitPrice: number,
  totalAmount: number,
  maxAmount: number
): Promise<{ success: boolean; pledge?: Pledge; error?: string }> {
  try {
    const session = await Auth.fetchAuthSession();
    const userId = session.userSub ?? (await Auth.getCurrentUser()).userId;
    const client = getDataClient();
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

export async function cancelPledgeInBackend(pledgeId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const client = getDataClient();
    const { data: existing } = await client.models.Pledge.get({ id: pledgeId });
    if (!existing || !['pending', 'locked'].includes(existing.status as string))
      return { success: false, error: 'Cannot cancel' };
    await client.models.Pledge.update({ id: pledgeId, status: 'cancelled' });
    return { success: true };
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

// ============================================
// AUTH & USER PROFILE
// ============================================

export async function getCurrentAuthUserFromBackend(): Promise<User | null> {
  try {
    const cognitoUser = await Auth.getCurrentUser();
    const client = getDataClient();
    const { data: profiles } = await client.models.UserProfile.list();
    const profile = profiles?.[0];
    if (!profile) {
      return {
        id: cognitoUser.userId,
        name: cognitoUser.username ?? cognitoUser.userId,
        email: (cognitoUser.signInDetails?.loginId as string) ?? '',
        phone: '',
        role: 'customer',
        location: { latitude: 0, longitude: 0 },
        trustScore: 5,
        joinedAt: new Date().toISOString(),
      };
    }
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
  } catch {
    return null;
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

export { isBackendConfigured };
