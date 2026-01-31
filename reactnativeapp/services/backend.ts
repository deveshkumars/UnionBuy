/**
 * AWS backend service: Cognito + AppSync/DynamoDB
 * Used by api.ts when amplify_outputs.json is present (after `ampx sandbox`).
 */

import { Auth, configureAmplify, getDataClient, isBackendConfigured } from '@/lib/amplify';
import type { BulkOrder, Location, Pledge, Product, Store, User } from '@/types';

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

export async function cancelPledgeInBackend(pledgeId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const client = getClient();
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
