/**
 * Mock API Service
 * Simulated API calls with realistic delays for development
 */

import {
  Product,
  BulkOrder,
  Pledge,
  Mission,
  Wallet,
  TrendingItem,
  User,
  Distribution,
  Cart,
  CartItem,
} from '@/types';
import {
  mockProducts,
  mockBulkOrders,
  mockPledges,
  mockMissions,
  mockWallet,
  mockTrendingItems,
  mockDistributions,
  currentUser,
  currentRunner,
} from './mockData';

// Simulate network delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// ============================================
// PRODUCTS API
// ============================================

export async function fetchProducts(): Promise<Product[]> {
  await delay(500);
  return mockProducts;
}

export async function fetchProductById(id: string): Promise<Product | null> {
  await delay(300);
  return mockProducts.find((p) => p.id === id) || null;
}

export async function searchProducts(query: string): Promise<Product[]> {
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
  await delay(400);
  return mockProducts.filter((p) => p.category === category);
}

// ============================================
// BULK ORDERS API
// ============================================

export async function fetchBulkOrders(): Promise<BulkOrder[]> {
  await delay(500);
  return mockBulkOrders;
}

export async function fetchActiveBulkOrders(): Promise<BulkOrder[]> {
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

// ============================================
// PLEDGES API
// ============================================

export async function fetchUserPledges(userId: string): Promise<Pledge[]> {
  await delay(400);
  return mockPledges.filter((p) => p.userId === userId);
}

export async function fetchActivePledges(userId: string): Promise<Pledge[]> {
  await delay(400);
  return mockPledges.filter(
    (p) => p.userId === userId && ['pending', 'locked', 'active'].includes(p.status)
  );
}

export async function createPledge(
  productId: string,
  quantity: number
): Promise<{ success: boolean; pledge?: Pledge; error?: string }> {
  await delay(800);
  
  const product = mockProducts.find((p) => p.id === productId);
  if (!product) {
    return { success: false, error: 'Product not found' };
  }

  const bulkOrder = mockBulkOrders.find(
    (o) => o.productId === productId && o.status === 'collecting'
  );

  const unitPrice = bulkOrder?.pricePerUnit || product.bulkPrice * 1.1;
  const totalAmount = unitPrice * quantity;
  const maxAmount = product.retailPrice * quantity;

  const newPledge: Pledge = {
    id: `pledge-${Date.now()}`,
    userId: currentUser.id,
    productId,
    product,
    quantity,
    unitPrice,
    totalAmount,
    maxAmount,
    status: 'locked',
    createdAt: new Date().toISOString(),
    lockedAt: new Date().toISOString(),
  };

  // In a real app, this would be saved to the backend
  mockPledges.push(newPledge);
  
  return { success: true, pledge: newPledge };
}

export async function cancelPledge(
  pledgeId: string
): Promise<{ success: boolean; error?: string }> {
  await delay(600);
  
  const pledge = mockPledges.find((p) => p.id === pledgeId);
  if (!pledge) {
    return { success: false, error: 'Pledge not found' };
  }

  if (!['pending', 'locked'].includes(pledge.status)) {
    return { success: false, error: 'Cannot cancel pledge in current status' };
  }

  pledge.status = 'cancelled';
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
  await delay(300);
  return currentUser;
}

export async function updateUserRole(role: 'customer' | 'runner'): Promise<{ success: boolean }> {
  await delay(400);
  // In real app, this would update the user's role
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

