/**
 * API Service: uses AWS backend (Cognito + DynamoDB) when configured, else mock data
 */

import {
    BulkOrder,
    Cart,
    CartItem,
    Distribution,
    Mission,
    Pledge,
    Product,
    TrendingItem,
    User,
    Wallet,
} from '@/types';
import {
    cancelPledgeInBackend,
    createPledgeInBackend,
    createUserProfileInBackend,
    fetchActiveBulkOrdersFromBackend,
    fetchBulkOrdersFromBackend,
    fetchProductByIdFromBackend,
    fetchProductsFromBackend,
    fetchUserPledgesFromBackend,
    fetchUserProfileByIdFromBackend,
    getCurrentAuthUserFromBackend,
    getOrCreateUserProfile as getOrCreateUserProfileFromBackend,
    isBackendConfigured,
    searchProductsFromBackend,
    updateUserProfileInBackend,
} from './backend';
import {
    currentRunner,
    currentUser,
    mockBulkOrders,
    mockDistributions,
    mockMissions,
    mockPledges,
    mockProducts,
    mockStores,
    mockTrendingItems,
    mockUsers,
    mockWallet,
} from './mockData';

// Simulate network delay (mock only)
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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
  await delay(300);
  return mockBulkOrders.find((o) => o.id === id) || null;
}

export async function fetchBulkOrderForProduct(productId: string): Promise<BulkOrder | null> {
  await delay(300);
  return mockBulkOrders.find((o) => o.productId === productId && o.status === 'collecting') || null;
}

// Fetch bulk order for product regardless of status (for pledges page progress tracking)
export async function fetchBulkOrderForProductAnyStatus(productId: string): Promise<BulkOrder | null> {
  await delay(300);
  // Return most recent order for this product, prioritizing active statuses
  const orders = mockBulkOrders.filter((o) => o.productId === productId);
  // Prefer active orders over rolled_over/cancelled
  const activeOrder = orders.find(o => ['collecting', 'assigned', 'shopping', 'in_transit', 'distributing'].includes(o.status));
  return activeOrder || orders[0] || null;
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
    const product = await fetchProductById(productId);
    if (!product) return { success: false, error: 'Product not found' };
    const bulkOrder = await fetchBulkOrderForProduct(productId);
    const unitPrice = bulkOrder?.pricePerUnit ?? product.bulkPrice * 1.1;
    const totalAmount = unitPrice * quantity;
    const maxAmount = product.retailPrice * quantity;
    return createPledgeInBackend(productId, product, quantity, unitPrice, totalAmount, maxAmount, effectiveUserId);
  }

  // Fall back to mock data
  console.log('[createPledge] 📦 Using MOCK data (not saving to DynamoDB)');
  await delay(800);
  const product = mockProducts.find((p) => p.id === productId);
  if (!product) return { success: false, error: 'Product not found' };
  const bulkOrder = mockBulkOrders.find((o) => o.productId === productId && o.status === 'collecting');
  const unitPrice = bulkOrder?.pricePerUnit || product.bulkPrice * 1.1;
  const totalAmount = unitPrice * quantity;
  const maxAmount = product.retailPrice * quantity;
  
  // Check if this pledge will trigger the bulk order (meet the minimum)
  const newTotal = (bulkOrder?.totalQuantity || 0) + quantity;
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
    bulkOrder.status = 'assigned';
    bulkOrder.executedAt = new Date().toISOString();
    bulkOrder.runnerId = 'user-3'; // Aisha the runner
    console.log('[createPledge] ✅ Bulk order activated:', bulkOrder.id);
    
    // 2. Update all pledges for this order to 'active'
    mockPledges.forEach(p => {
      if (p.productId === productId && ['pending', 'locked'].includes(p.status)) {
        p.status = 'active';
      }
    });
    
    // 3. Find and activate the demo mission (or create one)
    const demoMission = mockMissions.find(m => m.id === 'mission-demo');
    if (demoMission) {
      demoMission.status = 'available';
      demoMission.orders = [bulkOrder];
      demoMission.totalItems = newTotal;
      console.log('[createPledge] ✅ Mission activated:', demoMission.id);
    }
    
    // 4. Create a distribution for this user
    const newDistribution = {
      id: `dist-demo-${Date.now()}`,
      missionId: 'mission-demo',
      userId: effectiveUserId,
      user: mockUsers.find(u => u.id === effectiveUserId) || mockUsers[0],
      items: [
        { productId, productName: product.name, quantity, verified: false },
      ],
      qrCode: `METRO-${productId.toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      status: 'pending' as const,
      scheduledTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
    };
    mockDistributions.push(newDistribution);
    console.log('[createPledge] ✅ Distribution created:', newDistribution.id, 'QR:', newDistribution.qrCode);
    
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
    return cancelPledgeInBackend(pledgeId);
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
  
  pledge.status = 'cancelled';
  console.log('[cancelPledge] ✅ Successfully cancelled. New status:', pledge.status);
  return { success: true };
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
  missionId: string
): Promise<{ success: boolean; mission?: Mission; error?: string }> {
  await delay(800);
  
  const mission = mockMissions.find((m) => m.id === missionId);
  if (!mission) {
    return { success: false, error: 'Mission not found' };
  }

  if (mission.status !== 'available') {
    return { success: false, error: 'Mission no longer available' };
  }

  mission.status = 'accepted';
  mission.runnerId = currentRunner.id;
  mission.acceptedAt = new Date().toISOString();
  
  return { success: true, mission };
}

export async function updateMissionStatus(
  missionId: string,
  status: Mission['status']
): Promise<{ success: boolean; error?: string }> {
  await delay(500);
  
  const mission = mockMissions.find((m) => m.id === missionId);
  if (!mission) {
    return { success: false, error: 'Mission not found' };
  }

  mission.status = status;
  if (status === 'completed') {
    mission.completedAt = new Date().toISOString();
  }
  
  return { success: true };
}

// ============================================
// DISTRIBUTION API (Runner)
// ============================================

export async function fetchDistributions(missionId: string): Promise<Distribution[]> {
  await delay(400);
  return mockDistributions.filter((d) => d.missionId === missionId);
}

export async function verifyDistribution(
  distributionId: string,
  qrCode: string
): Promise<{ success: boolean; distribution?: Distribution; error?: string }> {
  await delay(600);
  
  const distribution = mockDistributions.find((d) => d.id === distributionId);
  if (!distribution) {
    return { success: false, error: 'Distribution not found' };
  }

  if (distribution.qrCode !== qrCode) {
    return { success: false, error: 'Invalid QR code' };
  }

  distribution.status = 'verified';
  return { success: true, distribution };
}

export async function completeDistribution(
  distributionId: string
): Promise<{ success: boolean; error?: string }> {
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
