/**
 * API Service: uses AWS backend (Cognito + DynamoDB) when configured, else mock data
 */

import {
    BulkOrder,
    Cart,
    CartItem,
    Distribution,
    Location,
    Mission,
    Pledge,
    Product,
    TrendingItem,
    User,
    Wallet,
} from '@/types';
import {
    acceptMissionInBackend,
    cancelPledgeInBackend,
    createDistributionInBackend,
    createMissionInBackend,
    createPledgeInBackend,
    createUserProfileInBackend,
    fetchActiveBulkOrdersFromBackend,
    fetchAvailableMissionsFromBackend,
    fetchBulkOrderByIdFromBackend,
    fetchBulkOrderForProductFromBackend,
    fetchBulkOrdersFromBackend,
    fetchDistributionForUserFromBackend,
    fetchDistributionsForMissionFromBackend,
    fetchPledgeByIdFromBackend,
    fetchProductByIdFromBackend,
    fetchProductsFromBackend,
    fetchUserPledgesFromBackend,
    fetchUserProfileByIdFromBackend,
    getCurrentAuthUserFromBackend,
    getOrCreateBulkOrderForProductFromBackend,
    getOrCreateUserProfile as getOrCreateUserProfileFromBackend,
    isBackendConfigured,
    searchProductsFromBackend,
    updateBulkOrderInBackend,
    updateDistributionStatusInBackend,
    updateMissionStatusInBackend,
    updateUserProfileInBackend,
    verifyDistributionPinInBackend,
} from './backend';
import { CustomerPoint, kMeans } from './kmeans';
import {
    currentRunner,
    currentUser,
    DEFAULT_DROP_ZONE,
    mockBulkOrders,
    mockDistributions,
    mockMissions,
    mockPledges,
    mockProducts,
    mockTrendingItems,
    mockUsers,
    mockWallet
} from './mockData';

// Simulate network delay (mock only)
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// ============================================
// MISSION STACKING (Zone Clustering)
// ============================================

/**
 * A stack of missions in the same geographic zone
 * Runners can accept the whole stack for efficiency
 */
export interface MissionStack {
  id: string;
  zoneName: string;
  zoneCenter: Location;
  zoneRadius: number; // in miles
  missions: Mission[];
  totalItems: number;
  totalWeight: number;
  totalEarnings: number;
  totalStores: number;
  estimatedTime: number;
  customerCount: number;
}

/**
 * Calculate haversine distance between two points (in miles)
 */
function haversineDistance(loc1: Location, loc2: Location): number {
  const R = 3959; // Earth's radius in miles
  const dLat = ((loc2.latitude - loc1.latitude) * Math.PI) / 180;
  const dLon = ((loc2.longitude - loc1.longitude) * Math.PI) / 180;
  const lat1 = (loc1.latitude * Math.PI) / 180;
  const lat2 = (loc2.latitude * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Cluster missions by drop zone proximity using K-means
 * @param missions - Array of missions to cluster
 * @param maxZoneRadius - Maximum radius in miles for a zone (default 1 mile)
 * @returns Array of MissionStacks grouped by zone
 */
export function clusterMissionsByZone(
  missions: Mission[],
  maxZoneRadius: number = 1.0
): MissionStack[] {
  if (missions.length === 0) return [];

  // Convert missions to customer points for clustering
  const points: CustomerPoint[] = missions.map((m) => ({
    location: m.dropZone,
    weight: m.totalItems,
  }));

  // Determine optimal number of clusters
  // Start with 1 and increase until all points are within maxZoneRadius
  let optimalK = 1;
  for (let k = 1; k <= Math.min(5, missions.length); k++) {
    const result = kMeans(points, k, 50);
    
    // Check if all missions are within acceptable radius of their centroid
    let allWithinRange = true;
    for (let i = 0; i < missions.length; i++) {
      const dist = haversineDistance(missions[i].dropZone, result.centroids[result.clusters[i]]);
      if (dist > maxZoneRadius) {
        allWithinRange = false;
        break;
      }
    }
    
    if (allWithinRange) {
      optimalK = k;
      break;
    }
    optimalK = k;
  }

  // Run final clustering with optimal K
  const result = kMeans(points, optimalK, 50);

  // Group missions by cluster
  const stacks: MissionStack[] = [];
  for (let clusterIdx = 0; clusterIdx < result.centroids.length; clusterIdx++) {
    const clusterMissions = missions.filter((_, i) => result.clusters[i] === clusterIdx);
    
    if (clusterMissions.length === 0) continue;

    // Calculate max distance from centroid for zone radius
    let maxDist = 0;
    for (const m of clusterMissions) {
      const dist = haversineDistance(m.dropZone, result.centroids[clusterIdx]);
      maxDist = Math.max(maxDist, dist);
    }

    // Determine zone name from missions' neighborhoods
    const neighborhoods = clusterMissions
      .map((m) => (m.dropZone as any).neighborhood || 'Zone')
      .filter((n, i, arr) => arr.indexOf(n) === i);
    const zoneName = neighborhoods[0] || `Zone ${clusterIdx + 1}`;

    // Calculate totals
    const totalItems = clusterMissions.reduce((sum, m) => sum + m.totalItems, 0);
    const totalWeight = clusterMissions.reduce((sum, m) => sum + (m.totalWeight || 0), 0);
    const totalEarnings = clusterMissions.reduce((sum, m) => sum + m.estimatedEarnings, 0);
    const estimatedTime = clusterMissions.reduce((sum, m) => sum + m.route.estimatedTime, 0);
    
    // Get unique stores
    const storeIds = new Set<string>();
    clusterMissions.forEach((m) => m.stores.forEach((s) => storeIds.add(s.id)));

    stacks.push({
      id: `stack-${clusterIdx}-${Date.now()}`,
      zoneName,
      zoneCenter: result.centroids[clusterIdx],
      zoneRadius: Math.max(0.1, maxDist), // Minimum 0.1 mile radius for display
      missions: clusterMissions,
      totalItems,
      totalWeight,
      totalEarnings,
      totalStores: storeIds.size,
      estimatedTime,
      customerCount: clusterMissions.length, // Each mission = 1 customer group
    });
  }

  // Sort stacks by earnings (highest first)
  stacks.sort((a, b) => b.totalEarnings - a.totalEarnings);

  return stacks;
}

/**
 * Fetch available missions grouped by zone
 */
export async function fetchStackedMissions(): Promise<MissionStack[]> {
  const missions = await fetchAvailableMissions();
  return clusterMissionsByZone(missions);
}

// ============================================
// PRODUCTS API
// ============================================

export async function fetchProducts(): Promise<Product[]> {
  if (isBackendConfigured()) return fetchProductsFromBackend();
  await delay(500);
  return mockProducts;
}

export async function fetchProductById(id: string): Promise<Product | null> {
  if (isBackendConfigured()) return fetchProductByIdFromBackend(id);
  await delay(300);
  return mockProducts.find((p) => p.id === id) || null;
}

export async function searchProducts(query: string): Promise<Product[]> {
  if (isBackendConfigured()) return searchProductsFromBackend(query);
  await delay(400);
  const lowerQuery = query.toLowerCase();
  return mockProducts.filter(
    (p) =>
      p.name.toLowerCase().includes(lowerQuery) ||
      p.category.toLowerCase().includes(lowerQuery) ||
      p.description.toLowerCase().includes(lowerQuery)
  );
}

export async function fetchProductsByCategory(category: string): Promise<Product[]> {
  if (isBackendConfigured()) {
    const all = await fetchProductsFromBackend();
    return all.filter((p) => p.category === category);
  }
  await delay(400);
  return mockProducts.filter((p) => p.category === category);
}

// ============================================
// BULK ORDERS API
// ============================================

export async function fetchBulkOrders(): Promise<BulkOrder[]> {
  if (isBackendConfigured()) return fetchBulkOrdersFromBackend();
  await delay(500);
  return mockBulkOrders;
}

export async function fetchActiveBulkOrders(): Promise<BulkOrder[]> {
  if (isBackendConfigured()) return fetchActiveBulkOrdersFromBackend();
  await delay(400);
  return mockBulkOrders.filter((o) => o.status === 'collecting');
}

export async function fetchBulkOrderById(id: string): Promise<BulkOrder | null> {
  if (isBackendConfigured()) return fetchBulkOrderByIdFromBackend(id);
  await delay(300);
  return mockBulkOrders.find((o) => o.id === id) || null;
}

export async function fetchBulkOrderForProduct(productId: string): Promise<BulkOrder | null> {
  if (isBackendConfigured()) return fetchBulkOrderForProductFromBackend(productId, 'collecting');
  await delay(300);
  return mockBulkOrders.find((o) => o.productId === productId && o.status === 'collecting') || null;
}

// Fetch bulk order for product regardless of status (for pledges page progress tracking)
export async function fetchBulkOrderForProductAnyStatus(productId: string): Promise<BulkOrder | null> {
  if (isBackendConfigured()) return fetchBulkOrderForProductFromBackend(productId);
  await delay(300);
  // Return most recent order for this product, prioritizing active statuses
  const orders = mockBulkOrders.filter((o) => o.productId === productId);
  // Prefer active orders over rolled_over/cancelled
  const activeOrder = orders.find(o => ['collecting', 'assigned', 'shopping', 'in_transit', 'distributing'].includes(o.status));
  return activeOrder || orders[0] || null;
}

// Get or create a bulk order for a product (used when creating pledges)
export async function getOrCreateBulkOrderForProduct(
  product: Product,
  cutoffHoursFromNow: number = 24
): Promise<{ bulkOrder: BulkOrder | null; created: boolean; error?: string }> {
  if (isBackendConfigured()) {
    return getOrCreateBulkOrderForProductFromBackend(product, cutoffHoursFromNow);
  }
  
  // Mock implementation
  await delay(300);
  let bulkOrder = mockBulkOrders.find(o => o.productId === product.id && o.status === 'collecting');
  
  if (bulkOrder) {
    return { bulkOrder, created: false };
  }
  
  // Create a new mock bulk order
  const cutoffTime = new Date(Date.now() + cutoffHoursFromNow * 60 * 60 * 1000).toISOString();
  bulkOrder = {
    id: `order-${Date.now()}`,
    productId: product.id,
    product,
    pledges: [],
    totalQuantity: 0,
    targetQuantity: product.bulkMinimum,
    pricePerUnit: product.bulkPrice,
    status: 'collecting',
    cutoffTime,
    createdAt: new Date().toISOString(),
  };
  mockBulkOrders.push(bulkOrder);
  return { bulkOrder, created: true };
}

// Update a bulk order's quantity and status
export async function updateBulkOrder(
  orderId: string,
  updates: {
    totalQuantity?: number;
    status?: BulkOrder['status'];
    runnerId?: string;
    executedAt?: string;
  }
): Promise<{ success: boolean; bulkOrder?: BulkOrder; error?: string }> {
  if (isBackendConfigured()) {
    return updateBulkOrderInBackend(orderId, updates);
  }
  
  // Mock implementation
  await delay(300);
  const order = mockBulkOrders.find(o => o.id === orderId);
  if (!order) {
    return { success: false, error: 'Bulk order not found' };
  }
  
  if (updates.totalQuantity !== undefined) order.totalQuantity = updates.totalQuantity;
  if (updates.status !== undefined) order.status = updates.status;
  if (updates.runnerId !== undefined) order.runnerId = updates.runnerId;
  if (updates.executedAt !== undefined) order.executedAt = updates.executedAt;
  
  return { success: true, bulkOrder: order };
}

// ============================================
// PLEDGES API
// ============================================

export async function fetchUserPledges(userId: string): Promise<Pledge[]> {
  console.log('[fetchUserPledges] Fetching pledges for user:', userId);
  
  if (isBackendConfigured()) {
    console.log('[fetchUserPledges] 🔥 Using DynamoDB backend');
    return fetchUserPledgesFromBackend(userId);
  }
  
  console.log('[fetchUserPledges] 📦 Using MOCK data');
  await delay(400);
  const userPledges = mockPledges.filter((p) => p.userId === userId);
  console.log('[fetchUserPledges] Found', userPledges.length, 'pledges:');
  userPledges.forEach(p => console.log(`  - ${p.id}: ${p.status}`));
  return userPledges;
}

export async function fetchActivePledges(userId: string): Promise<Pledge[]> {
  const pledges = isBackendConfigured()
    ? await fetchUserPledgesFromBackend(userId)
    : mockPledges.filter((p) => p.userId === userId);
  return pledges.filter((p) => ['pending', 'locked', 'active'].includes(p.status));
}

export async function fetchPledgeById(pledgeId: string): Promise<Pledge | null> {
  if (isBackendConfigured()) return fetchPledgeByIdFromBackend(pledgeId);
  await delay(300);
  return mockPledges.find((p) => p.id === pledgeId) || null;
}

export async function createPledge(
  productId: string,
  quantity: number,
  userId?: string
): Promise<{ success: boolean; pledge?: Pledge; error?: string; triggered?: boolean }> {
  // Use provided userId or fall back to currentUser.id
  const effectiveUserId = userId || currentUser.id;
  console.log('[createPledge] Backend configured:', isBackendConfigured(), 'userId:', effectiveUserId);
  
  if (isBackendConfigured()) {
    console.log('[createPledge] 🔥 Using DynamoDB backend');
    
    // 1. Get the product
    const product = await fetchProductById(productId);
    if (!product) return { success: false, error: 'Product not found' };
    
    // 2. Get or create a bulk order for this product
    const { bulkOrder, created: orderCreated, error: orderError } = await getOrCreateBulkOrderForProduct(product);
    if (!bulkOrder) {
      return { success: false, error: orderError || 'Failed to get/create bulk order' };
    }
    console.log('[createPledge] Bulk order:', bulkOrder.id, 'created:', orderCreated, 'current qty:', bulkOrder.totalQuantity);
    
    // 3. Check available slots (NEW LOGIC)
    const availableSlots = product.bulkMinimum - bulkOrder.totalQuantity;
    if (quantity > availableSlots) {
      return { 
        success: false, 
        error: `Only ${availableSlots} units available. Requested ${quantity}.` 
      };
    }
    
    // 4. Calculate pricing
    const unitPrice = bulkOrder.pricePerUnit;
    const totalAmount = unitPrice * quantity;
    const maxAmount = product.retailPrice * quantity;
    
    // 5. Create the pledge (full success)
    const pledgeResult = await createPledgeInBackend(productId, product, quantity, unitPrice, totalAmount, maxAmount, effectiveUserId);
    if (!pledgeResult.success) {
      return pledgeResult;
    }
    
    // 6. Update bulk order quantity
    const newTotal = bulkOrder.totalQuantity + quantity;
    const willTrigger = newTotal >= product.bulkMinimum;
    
    const orderUpdates: { totalQuantity: number; status?: BulkOrder['status']; executedAt?: string; runnerId?: string } = {
      totalQuantity: newTotal,
    };
    
    // If bulk minimum reached, activate the order and create a mission
    if (willTrigger && bulkOrder.status === 'collecting') {
      console.log('[createPledge] ⚡ BULK MINIMUM REACHED! Activating order...');
      orderUpdates.status = 'pending_execution';
      orderUpdates.executedAt = new Date().toISOString();
      
      // Create a mission for runners to pick up
      const updatedBulkOrder = { ...bulkOrder, totalQuantity: newTotal };
      const missionResult = await createMissionInBackend(updatedBulkOrder, product);
      if (missionResult.success && missionResult.mission) {
        console.log('[createPledge] ✅ Mission created:', missionResult.mission.id);
      } else {
        console.warn('[createPledge] Failed to create mission:', missionResult.error);
      }
    }
    
    const updateResult = await updateBulkOrderInBackend(bulkOrder.id, orderUpdates);
    if (!updateResult.success) {
      console.warn('[createPledge] Failed to update bulk order:', updateResult.error);
    } else {
      console.log('[createPledge] ✅ Bulk order updated. New qty:', newTotal, 'Status:', updateResult.bulkOrder?.status);
    }
    
    return { ...pledgeResult, triggered: willTrigger };
  }

  // Fall back to mock data
  console.log('[createPledge] 📦 Using MOCK data (not saving to DynamoDB)');
  await delay(800);
  const product = mockProducts.find((p) => p.id === productId);
  if (!product) return { success: false, error: 'Product not found' };
  const bulkOrder = mockBulkOrders.find((o) => o.productId === productId && o.status === 'collecting');
  
  // Check available slots (NEW LOGIC)
  const currentQuantity = bulkOrder?.totalQuantity || 0;
  const availableSlots = product.bulkMinimum - currentQuantity;
  if (quantity > availableSlots) {
    return { 
      success: false, 
      error: `Only ${availableSlots} units available. Requested ${quantity}.` 
    };
  }
  
  const unitPrice = bulkOrder?.pricePerUnit || product.bulkPrice * 1.1;
  const totalAmount = unitPrice * quantity;
  const maxAmount = product.retailPrice * quantity;
  
  // Check if this pledge will trigger the bulk order (meet the minimum)
  const newTotal = currentQuantity + quantity;
  const willTrigger = bulkOrder && newTotal >= product.bulkMinimum;
  
  const newPledge: Pledge = {
    id: `pledge-${Date.now()}`,
    userId: effectiveUserId,
    productId,
    product,
    quantity,
    unitPrice,
    totalAmount,
    maxAmount,
    status: willTrigger ? 'active' : 'locked',
    createdAt: new Date().toISOString(),
    lockedAt: new Date().toISOString(),
    orderId: bulkOrder?.id,
  };
  mockPledges.push(newPledge);
  
  // ⚡ DEMO TRIGGER LOGIC: If this pledge pushes the order over the minimum, activate everything!
  if (willTrigger && bulkOrder) {
    console.log('[createPledge] ⚡ BULK MINIMUM REACHED! Triggering order activation...');
    
    // 1. Update bulk order status
    bulkOrder.totalQuantity = newTotal;
    bulkOrder.status = 'pending_execution';
    bulkOrder.executedAt = new Date().toISOString();
    console.log('[createPledge] ✅ Bulk order activated:', bulkOrder.id);
    
    // 2. Update all pledges for this order to 'active'
    mockPledges.forEach(p => {
      if (p.productId === productId && ['pending', 'locked'].includes(p.status)) {
        p.status = 'active';
      }
    });
    
    // 3. Create a new mission for this order
    const store = product.store;
    // Use default Providence, RI drop zone for geofencing/clustering
    const dropZone = bulkOrder.dropZone || DEFAULT_DROP_ZONE;
    
    const missionId = `mission-${Date.now()}`;
    const newMission: Mission = {
      id: missionId,
      orders: [bulkOrder],
      status: 'available',
      estimatedEarnings: 10.00 + (newTotal * 0.25), // Base pay + per-item bonus
      tips: 0,
      totalItems: newTotal,
      totalWeight: newTotal * 0.5,
      stores: [store],
      route: {
        stores: [store.location],
        dropZone,
        totalDistance: 5.0,
        estimatedTime: 30,
        optimizedOrder: [0],
      },
      dropZone,
      createdAt: new Date().toISOString(),
    };
    mockMissions.push(newMission);
    console.log('[createPledge] ✅ Mission created:', newMission.id);
    
    // 4. Create a distribution for this user with 4-digit PIN
    const pickupPin = Math.floor(1000 + Math.random() * 9000).toString();
    const newDistribution: Distribution = {
      id: `dist-${Date.now()}`,
      missionId,
      userId: effectiveUserId,
      user: mockUsers.find(u => u.id === effectiveUserId) || mockUsers[0],
      items: [
        { productId, productName: product.name, quantity, verified: false },
      ],
      pickupPin,
      status: 'pending' as const,
      scheduledTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
    };
    mockDistributions.push(newDistribution);
    console.log('[createPledge] ✅ Distribution created:', newDistribution.id, 'PIN:', newDistribution.pickupPin);
    
    // 5. Update trending item
    const trendingItem = mockTrendingItems.find(t => t.product.id === productId);
    if (trendingItem) {
      trendingItem.totalQuantity = newTotal;
      trendingItem.percentToGoal = 100;
    }
    
    console.log('[createPledge] 🎉 ORDER FULLY ACTIVATED! Runner can now see it.');
  } else if (bulkOrder) {
    // Just update the total quantity without triggering
    bulkOrder.totalQuantity = newTotal;
  }
  
  console.log('[createPledge] ✅ Created new mock pledge:', newPledge.id, 'status:', newPledge.status);
  console.log('[createPledge] Total mock pledges now:', mockPledges.length);
  return { success: true, pledge: newPledge, triggered: willTrigger };
}

export async function cancelPledge(pledgeId: string): Promise<{ success: boolean; error?: string }> {
  console.log('[cancelPledge] Attempting to cancel pledge:', pledgeId);
  
  if (isBackendConfigured()) {
    console.log('[cancelPledge] 🔥 Using DynamoDB backend');
    // cancelPledgeInBackend now handles updating the bulk order quantity too
    const result = await cancelPledgeInBackend(pledgeId);
    return { success: result.success, error: result.error };
  }
  
  console.log('[cancelPledge] 📦 Using MOCK data');
  await delay(600);
  const pledge = mockPledges.find((p) => p.id === pledgeId);
  console.log('[cancelPledge] Found pledge:', pledge?.id, 'status:', pledge?.status);
  
  if (!pledge) {
    console.log('[cancelPledge] ❌ Pledge not found!');
    return { success: false, error: 'Pledge not found' };
  }
  if (!['pending', 'locked'].includes(pledge.status)) {
    console.log('[cancelPledge] ❌ Cannot cancel - status is:', pledge.status);
    return { success: false, error: 'Cannot cancel pledge in current status' };
  }
  
  // Update bulk order quantity
  const bulkOrder = mockBulkOrders.find(o => o.productId === pledge.productId && o.status === 'collecting');
  if (bulkOrder) {
    bulkOrder.totalQuantity = Math.max(0, bulkOrder.totalQuantity - pledge.quantity);
    console.log('[cancelPledge] Updated bulk order quantity:', bulkOrder.totalQuantity);
  }
  
  pledge.status = 'cancelled';
  console.log('[cancelPledge] ✅ Successfully cancelled. New status:', pledge.status);
  return { success: true };
}

export async function repledgePledge(
  pledgeId: string,
  userId?: string
): Promise<{ success: boolean; pledge?: Pledge; error?: string }> {
  console.log('[repledgePledge] Re-pledging rollover pledge:', pledgeId);
  const effectiveUserId = userId || currentUser.id;
  
  await delay(600);
  
  const oldPledge = mockPledges.find((p) => p.id === pledgeId);
  if (!oldPledge) {
    return { success: false, error: 'Pledge not found' };
  }
  
  if (oldPledge.status !== 'rollover') {
    return { success: false, error: 'Can only re-pledge rollover items' };
  }
  
  // Find or create a current bulk order for this product
  let bulkOrder = mockBulkOrders.find(
    (o) => o.productId === oldPledge.productId && o.status === 'collecting'
  );
  
  // If no collecting order exists, we could create one or return error
  // For now, we'll just create a new pledge with locked status
  const product = oldPledge.product;
  const unitPrice = bulkOrder?.pricePerUnit || product.bulkPrice * 1.1;
  const totalAmount = unitPrice * oldPledge.quantity;
  const maxAmount = product.retailPrice * oldPledge.quantity;
  
  // Mark old pledge as cancelled
  oldPledge.status = 'cancelled';
  
  // Create new pledge for current batch
  const newPledge: Pledge = {
    id: `pledge-${Date.now()}`,
    userId: effectiveUserId,
    productId: oldPledge.productId,
    product,
    quantity: oldPledge.quantity,
    unitPrice,
    totalAmount,
    maxAmount,
    status: 'locked',
    createdAt: new Date().toISOString(),
    lockedAt: new Date().toISOString(),
    orderId: bulkOrder?.id,
  };
  
  mockPledges.push(newPledge);
  
  // Update bulk order if exists
  if (bulkOrder) {
    bulkOrder.totalQuantity += oldPledge.quantity;
  }
  
  console.log('[repledgePledge] ✅ Created new pledge from rollover:', newPledge.id);
  return { success: true, pledge: newPledge };
}

// ============================================
// TRENDING API
// ============================================

export async function fetchTrendingItems(): Promise<TrendingItem[]> {
  await delay(400);
  return mockTrendingItems;
}

// ============================================
// WALLET API
// ============================================

export async function fetchWallet(userId: string): Promise<Wallet> {
  await delay(400);
  return mockWallet;
}

// ============================================
// MISSION API (Runner)
// ============================================

export async function fetchAvailableMissions(): Promise<Mission[]> {
  if (isBackendConfigured()) {
    return fetchAvailableMissionsFromBackend();
  }
  await delay(500);
  return mockMissions.filter((m) => m.status === 'available');
}

export async function fetchActiveMission(runnerId: string): Promise<Mission | null> {
  await delay(400);
  return (
    mockMissions.find(
      (m) =>
        m.runnerId === runnerId &&
        !['completed', 'available'].includes(m.status)
    ) || null
  );
}

export async function acceptMission(
  missionId: string,
  runnerId?: string
): Promise<{ success: boolean; mission?: Mission; error?: string }> {
  const effectiveRunnerId = runnerId || currentRunner.id;
  
  if (isBackendConfigured()) {
    return acceptMissionInBackend(missionId, effectiveRunnerId);
  }
  
  await delay(800);
  
  const mission = mockMissions.find((m) => m.id === missionId);
  if (!mission) {
    return { success: false, error: 'Mission not found' };
  }

  if (mission.status !== 'available') {
    return { success: false, error: 'Mission no longer available' };
  }

  mission.status = 'accepted';
  mission.runnerId = effectiveRunnerId;
  mission.acceptedAt = new Date().toISOString();
  
  // Generate distributions with PINs for all customers in this mission
  console.log('[acceptMission] Creating distributions for mission:', missionId);
  
  // Get all product IDs from this mission's orders
  const orderProductIds = mission.orders.map(order => order.productId);
  
  // Find all active pledges for these products
  const relevantPledges = mockPledges.filter(
    pledge => orderProductIds.includes(pledge.productId) && 
              ['locked', 'active', 'pending'].includes(pledge.status)
  );
  
  // Group pledges by userId
  const pledgesByUser = new Map<string, typeof relevantPledges>();
  relevantPledges.forEach(pledge => {
    const existing = pledgesByUser.get(pledge.userId) || [];
    existing.push(pledge);
    pledgesByUser.set(pledge.userId, existing);
  });
  
  // Create a distribution for each user with their items and a fresh PIN
  pledgesByUser.forEach((userPledges, userId) => {
    // Check if distribution already exists for this user and mission
    const existingDist = mockDistributions.find(
      d => d.missionId === missionId && d.userId === userId
    );
    
    if (existingDist) {
      // Update existing distribution with a fresh PIN
      existingDist.pickupPin = generatePickupPin();
      console.log('[acceptMission] Updated PIN for existing distribution:', existingDist.id, 'PIN:', existingDist.pickupPin);
    } else {
      // Create new distribution
      const pickupPin = generatePickupPin();
      const items = userPledges.map(pledge => ({
        productId: pledge.productId,
        productName: pledge.product.name,
        quantity: pledge.quantity,
        verified: false,
      }));
      
      const newDistribution: Distribution = {
        id: `dist-${Date.now()}-${userId}`,
        missionId,
        userId,
        user: mockUsers.find(u => u.id === userId) || mockUsers[0],
        items,
        pickupPin,
        status: 'pending',
        scheduledTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
      };
      
      mockDistributions.push(newDistribution);
      console.log('[acceptMission] Created distribution:', newDistribution.id, 'PIN:', pickupPin, 'Items:', items.length);
    }
    
    // Update pledge statuses to 'active'
    userPledges.forEach(pledge => {
      if (pledge.status !== 'completed') {
        pledge.status = 'active';
      }
    });
  });
  
  console.log('[acceptMission] ✅ Mission accepted, distributions created for', pledgesByUser.size, 'users');
  
  return { success: true, mission };
}

export async function updateMissionStatus(
  missionId: string,
  status: Mission['status']
): Promise<{ success: boolean; error?: string }> {
  if (isBackendConfigured()) {
    return updateMissionStatusInBackend(missionId, status);
  }
  
  await delay(500);
  
  const mission = mockMissions.find((m) => m.id === missionId);
  if (!mission) {
    return { success: false, error: 'Mission not found' };
  }

  mission.status = status;
  if (status === 'completed') {
    mission.completedAt = new Date().toISOString();
    
    // Mark all related pledges as completed and update wallet
    mission.orders.forEach((order) => {
      // Mark all pledges for this order's product as completed
      mockPledges.forEach((pledge) => {
        if (pledge.productId === order.productId && pledge.status === 'active') {
          pledge.status = 'completed';
          pledge.completedAt = new Date().toISOString();
          console.log('[updateMissionStatus] ✅ Pledge completed:', pledge.id);
        }
      });
      
      // Update the bulk order status to completed
      const bulkOrder = mockBulkOrders.find((bo) => bo.id === order.id);
      if (bulkOrder) {
        bulkOrder.status = 'completed';
        console.log('[updateMissionStatus] ✅ Bulk order completed:', bulkOrder.id);
      }
    });
    
    // Release locked funds to available balance in wallet
    // In a real app, this would calculate actual charges vs. max hold
    if (mockWallet.lockedAmount > 0) {
      const refund = mockWallet.lockedAmount * 0.1; // Refund 10% as savings
      mockWallet.availableBalance += refund;
      mockWallet.lockedAmount = 0;
      console.log('[updateMissionStatus] ✅ Wallet updated: +$' + refund.toFixed(2) + ' refunded');
    }
  }
  
  return { success: true };
}

// ============================================
// DISTRIBUTION API (Runner)
// ============================================

// Generate random 4-digit PIN for pickup verification
export function generatePickupPin(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

export async function fetchDistributions(missionId: string): Promise<Distribution[]> {
  if (isBackendConfigured()) {
    return fetchDistributionsForMissionFromBackend(missionId);
  }
  await delay(400);
  return mockDistributions.filter((d) => d.missionId === missionId);
}

export async function fetchUserDistribution(userId: string): Promise<Distribution | null> {
  if (isBackendConfigured()) {
    return fetchDistributionForUserFromBackend(userId);
  }
  await delay(400);
  // Find active distribution for user (not completed)
  return mockDistributions.find((d) => d.userId === userId && d.status !== 'completed') || null;
}

export async function verifyDistributionPin(
  distributionId: string,
  pin: string
): Promise<{ success: boolean; distribution?: Distribution; error?: string }> {
  if (isBackendConfigured()) {
    const result = await verifyDistributionPinInBackend(distributionId, pin);
    if (result.success) {
      // Fetch updated distribution
      const distributions = await fetchDistributionsForMissionFromBackend('');
      const distribution = distributions.find(d => d.id === distributionId);
      return { success: true, distribution };
    }
    return result;
  }
  
  await delay(600);
  
  const distribution = mockDistributions.find((d) => d.id === distributionId);
  if (!distribution) {
    return { success: false, error: 'Distribution not found' };
  }

  if (distribution.pickupPin !== pin) {
    return { success: false, error: 'Invalid PIN' };
  }

  distribution.status = 'verified';
  return { success: true, distribution };
}

export async function completeDistribution(
  distributionId: string
): Promise<{ success: boolean; error?: string }> {
  if (isBackendConfigured()) {
    return updateDistributionStatusInBackend(distributionId, 'completed');
  }
  
  await delay(500);
  
  const distribution = mockDistributions.find((d) => d.id === distributionId);
  if (!distribution) {
    return { success: false, error: 'Distribution not found' };
  }

  distribution.status = 'completed';
  distribution.completedAt = new Date().toISOString();
  distribution.items.forEach((item) => {
    item.verified = true;
  });
  
  return { success: true };
}

export async function createDistribution(
  missionId: string,
  userId: string,
  items: Distribution['items'],
  scheduledTime?: string
): Promise<{ success: boolean; distribution?: Distribution; error?: string }> {
  const pickupPin = generatePickupPin();
  
  if (isBackendConfigured()) {
    return createDistributionInBackend(missionId, userId, items, pickupPin, scheduledTime);
  }
  
  await delay(500);
  
  const user = mockUsers.find(u => u.id === userId) || mockUsers[0];
  const newDistribution: Distribution = {
    id: `dist-${Date.now()}`,
    missionId,
    userId,
    user,
    items,
    pickupPin,
    status: 'pending',
    scheduledTime,
  };
  
  mockDistributions.push(newDistribution);
  return { success: true, distribution: newDistribution };
}

// ============================================
// USER API
// ============================================

export async function fetchCurrentUser(): Promise<User> {
  if (isBackendConfigured()) {
    try {
      const user = await getCurrentAuthUserFromBackend();
      if (user) return user;
    } catch {
      /* not found — fall back to mock */
    }
  }
  await delay(300);
  return currentUser;
}

export async function fetchUserProfile(userId: string): Promise<User | null> {
  if (isBackendConfigured()) {
    return fetchUserProfileByIdFromBackend(userId);
  }
  await delay(300);
  return currentUser;
}

export async function createUserProfile(
  userData: Omit<User, 'id'>
): Promise<{ success: boolean; user?: User; error?: string }> {
  if (isBackendConfigured()) {
    return createUserProfileInBackend(userData);
  }
  await delay(400);
  // Mock: just return the user data with a generated ID
  return {
    success: true,
    user: { ...userData, id: `user-${Date.now()}` },
  };
}

export async function updateUserProfile(
  userId: string,
  updates: Partial<Omit<User, 'id'>>
): Promise<{ success: boolean; user?: User; error?: string }> {
  if (isBackendConfigured()) {
    return updateUserProfileInBackend(userId, updates);
  }
  await delay(400);
  // Mock: merge updates with current user
  return {
    success: true,
    user: { ...currentUser, ...updates },
  };
}

export async function getOrCreateUserProfile(
  defaultData?: Partial<Omit<User, 'id'>>
): Promise<{ user: User | null; created: boolean; error?: string }> {
  if (isBackendConfigured()) {
    return getOrCreateUserProfileFromBackend(defaultData);
  }
  await delay(300);
  // Mock: return the current user as if it already exists
  return { user: currentUser, created: false };
}

export async function updateUserRole(role: 'customer' | 'runner'): Promise<{ success: boolean }> {
  if (isBackendConfigured()) {
    try {
      const user = await getCurrentAuthUserFromBackend();
      if (user) {
        return updateUserProfileInBackend(user.id, { role });
      }
    } catch {
      /* error — fall back to mock */
    }
  }
  await delay(400);
  return { success: true };
}

// ============================================
// CART HELPERS (Local state, not API)
// ============================================

export function calculateCartTotals(items: CartItem[]): Cart {
  let totalEstimate = 0;
  let totalSavings = 0;

  items.forEach((item) => {
    const bulkTotal = item.product.bulkPrice * item.quantity;
    const retailTotal = item.product.retailPrice * item.quantity;
    totalEstimate += bulkTotal * 1.1; // Add 10% for overhead
    totalSavings += retailTotal - bulkTotal;
  });

  return {
    items,
    totalEstimate,
    totalSavings,
  };
}
