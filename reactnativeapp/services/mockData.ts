/**
 * Mock Data for the Metropolis Bulk Buy App
 * Realistic sample data for development and demo purposes
 */

import {
    BulkOrder,
    Distribution,
    Mission,
    Pledge,
    Product,
    Store,
    TrendingItem,
    User,
    Wallet
} from '@/types';

// ============================================
// STORES
// ============================================

export const mockStores: Store[] = [
  {
    id: 'store-1',
    name: 'Costco Wholesale',
    type: 'wholesale',
    location: {
      latitude: 41.8268,
      longitude: -71.4025,
      address: '2 Mystic View Rd, Everett, MA',
    },
  },
  {
    id: 'store-2',
    name: "BJ's Wholesale",
    type: 'wholesale',
    location: {
      latitude: 41.8189,
      longitude: -71.3912,
      address: '175 Highland Ave, Seekonk, MA',
    },
  },
  {
    id: 'store-3',
    name: 'Restaurant Depot',
    type: 'wholesale',
    location: {
      latitude: 41.8456,
      longitude: -71.4234,
      address: '55 Providence Hwy, Dedham, MA',
    },
  },
];

// ============================================
// PRODUCTS
// ============================================

export const mockProducts: Product[] = [
  // ⚡ DEMO TRIGGER ITEM - pledging this will activate the order! (FIRST so it's visible)
  {
    id: 'prod-demo',
    name: '🍯 Local Honey',
    category: 'pantry',
    description: 'Raw wildflower honey from local apiaries - DEMO: 1 jar away from bulk!',
    unit: 'jar',
    retailPrice: 12.99,
    bulkPrice: 7.49,
    bulkMinimum: 20,
    store: mockStores[0],
    available: true,
  },
  {
    id: 'prod-1',
    name: 'Jasmine Rice',
    category: 'grains',
    description: 'Premium Thai jasmine rice, long grain',
    unit: 'lb',
    retailPrice: 1.89,
    bulkPrice: 0.79,
    bulkMinimum: 50,
    store: mockStores[0],
    available: true,
  },
  {
    id: 'prod-2',
    name: 'Extra Virgin Olive Oil',
    category: 'pantry',
    description: 'First cold pressed, Mediterranean blend',
    unit: 'oz',
    retailPrice: 0.42,
    bulkPrice: 0.24,
    bulkMinimum: 128,
    store: mockStores[0],
    available: true,
  },
  {
    id: 'prod-3',
    name: 'Organic Eggs',
    category: 'dairy',
    description: 'Cage-free, organic large eggs',
    unit: 'dozen',
    retailPrice: 6.99,
    bulkPrice: 4.49,
    bulkMinimum: 15,
    store: mockStores[1],
    available: true,
  },
  {
    id: 'prod-4',
    name: 'Chicken Breast',
    category: 'meat',
    description: 'Boneless, skinless chicken breast',
    unit: 'lb',
    retailPrice: 4.99,
    bulkPrice: 2.89,
    bulkMinimum: 40,
    store: mockStores[2],
    available: true,
  },
  {
    id: 'prod-5',
    name: 'All-Purpose Flour',
    category: 'pantry',
    description: 'Unbleached all-purpose flour',
    unit: 'lb',
    retailPrice: 0.89,
    bulkPrice: 0.42,
    bulkMinimum: 50,
    store: mockStores[0],
    available: true,
  },
  {
    id: 'prod-6',
    name: 'Canned Black Beans',
    category: 'pantry',
    description: 'Low sodium black beans',
    unit: 'can',
    retailPrice: 1.29,
    bulkPrice: 0.68,
    bulkMinimum: 24,
    store: mockStores[1],
    available: true,
  },
  {
    id: 'prod-7',
    name: 'Paper Towels',
    category: 'household',
    description: '2-ply, select-a-size rolls',
    unit: 'roll',
    retailPrice: 1.99,
    bulkPrice: 0.89,
    bulkMinimum: 30,
    store: mockStores[0],
    available: true,
  },
  {
    id: 'prod-8',
    name: 'Whole Milk',
    category: 'dairy',
    description: 'Grade A whole milk',
    unit: 'gallon',
    retailPrice: 4.29,
    bulkPrice: 3.19,
    bulkMinimum: 12,
    store: mockStores[1],
    available: true,
  },
  {
    id: 'prod-9',
    name: 'Ground Beef 80/20',
    category: 'meat',
    description: 'Fresh ground beef, 80% lean',
    unit: 'lb',
    retailPrice: 5.99,
    bulkPrice: 3.79,
    bulkMinimum: 30,
    store: mockStores[2],
    available: true,
  },
  {
    id: 'prod-10',
    name: 'Bananas',
    category: 'produce',
    description: 'Fresh yellow bananas',
    unit: 'lb',
    retailPrice: 0.69,
    bulkPrice: 0.39,
    bulkMinimum: 40,
    store: mockStores[0],
    available: true,
  },
];

// ============================================
// USERS
// ============================================

export const mockUsers: User[] = [
  {
    id: 'user-1',
    name: 'Maria Santos',
    email: 'maria@example.com',
    phone: '(401) 555-0101',
    role: 'customer',
    location: {
      latitude: 41.8236,
      longitude: -71.4222,
      address: '123 Hope St, Providence, RI',
      neighborhood: 'East Side',
    },
    trustScore: 4.8,
    joinedAt: '2025-06-15',
  },
  {
    id: 'user-2',
    name: 'James Chen',
    email: 'james@example.com',
    phone: '(401) 555-0102',
    role: 'customer',
    location: {
      latitude: 41.8198,
      longitude: -71.4178,
      address: '456 Benefit St, Providence, RI',
      neighborhood: 'College Hill',
    },
    trustScore: 4.5,
    joinedAt: '2025-07-22',
  },
  {
    id: 'user-3',
    name: 'Aisha Johnson',
    email: 'aisha@example.com',
    phone: '(401) 555-0103',
    role: 'runner',
    location: {
      latitude: 41.8156,
      longitude: -71.4289,
      address: '789 Broadway, Providence, RI',
      neighborhood: 'Federal Hill',
    },
    trustScore: 4.9,
    joinedAt: '2025-05-10',
  },
];

export const currentUser: User = mockUsers[0];
export const currentRunner: User = mockUsers[2];

// ============================================
// BULK ORDERS
// ============================================

export const mockBulkOrders: BulkOrder[] = [
  // ⚡ DEMO ORDER - empty for testing fresh pledge flow
  {
    id: 'order-demo',
    productId: 'prod-demo',
    product: mockProducts[0], // Local Honey (index 0)
    pledges: [],
    totalQuantity: 0, // Start at 0 - customer will add pledges
    targetQuantity: 20,
    pricePerUnit: 7.99,
    status: 'collecting',
    cutoffTime: '2026-01-31T18:00:00Z',
    createdAt: '2026-01-31T06:00:00Z',
    dropZone: {
      latitude: 41.8236,
      longitude: -71.4222,
      address: 'East Side Community Hub',
    },
  },
  {
    id: 'order-1',
    productId: 'prod-1',
    product: mockProducts[1], // Jasmine Rice (index 1)
    pledges: [],
    totalQuantity: 0, // Start at 0
    targetQuantity: 50,
    pricePerUnit: 0.85,
    status: 'collecting',
    cutoffTime: '2026-01-31T18:00:00Z',
    createdAt: '2026-01-31T08:00:00Z',
    dropZone: {
      latitude: 41.8215,
      longitude: -71.4190,
      address: 'Providence Community Center',
    },
  },
  {
    id: 'order-2',
    productId: 'prod-3',
    product: mockProducts[3], // Organic Eggs (index 3)
    pledges: [],
    totalQuantity: 0, // Start at 0
    targetQuantity: 15,
    pricePerUnit: 4.69,
    status: 'collecting',
    cutoffTime: '2026-01-31T18:00:00Z',
    createdAt: '2026-01-31T08:00:00Z',
  },
];

// ============================================
// PLEDGES
// ============================================

// Start with empty pledges - customer will create their own
export const mockPledges: Pledge[] = [];

// ============================================
// MISSIONS
// ============================================

// Default drop zone location for Providence, RI (used for geofencing)
export const DEFAULT_DROP_ZONE = {
  latitude: 41.8236,
  longitude: -71.4222,
  address: 'East Side Community Hub',
  neighborhood: 'East Side',
};

// Start empty - missions are created when bulk orders hit minimum
export const mockMissions: Mission[] = [];

// ============================================
// DISTRIBUTIONS
// ============================================

// Start empty - will be populated when orders are triggered and distributed
export const mockDistributions: Distribution[] = [];

// ============================================
// WALLET & TRANSACTIONS
// ============================================

export const mockWallet: Wallet = {
  userId: 'user-1',
  balance: 150.00, // Fresh starting balance
  lockedFunds: 0, // No locked funds initially
  totalSavings: 0, // No savings yet
  discountCredits: 5.00,
  transactions: [
    {
      id: 'txn-1',
      type: 'deposit',
      amount: 150.00,
      description: 'Initial wallet funding',
      status: 'completed',
      createdAt: '2026-01-31T08:00:00Z',
    },
  ],
};

// ============================================
// TRENDING ITEMS
// ============================================

export const mockTrendingItems: TrendingItem[] = [
  // Fresh products - all starting at 0 pledges for demo
  {
    product: mockProducts[0], // Local Honey (index 0)
    pledgeCount: 0,
    totalQuantity: 0,
    percentToGoal: 0,
    savings: 0,
    trending: 'up',
  },
  {
    product: mockProducts[1], // Jasmine Rice (index 1)
    pledgeCount: 0,
    totalQuantity: 0,
    percentToGoal: 0,
    savings: 0,
    trending: 'up',
  },
  {
    product: mockProducts[3], // Organic Eggs (index 3)
    pledgeCount: 0,
    totalQuantity: 0,
    percentToGoal: 0,
    savings: 0,
    trending: 'up',
  },
  {
    product: mockProducts[5], // All-Purpose Flour (index 5)
    pledgeCount: 0,
    totalQuantity: 0,
    percentToGoal: 0,
    savings: 0,
    trending: 'stable',
  },
  {
    product: mockProducts[7], // Paper Towels (index 7)
    pledgeCount: 0,
    totalQuantity: 0,
    percentToGoal: 0,
    savings: 0,
    trending: 'up',
  },
  {
    product: mockProducts[10], // Bananas (index 10)
    pledgeCount: 0,
    totalQuantity: 0,
    percentToGoal: 0,
    savings: 0,
    trending: 'down',
  },
];

// ============================================
// NEIGHBORHOOD STATS
// ============================================

export const mockNeighborhoodStats = {
  totalUsers: 127,
  activeOrders: 5,
  totalSavings: 2847.50,
  topCategories: ['grains', 'pantry', 'dairy'] as const,
  averageTrustScore: 4.6,
};

// ============================================
// RESET ALL MOCK DATA (for testing)
// ============================================

/**
 * Resets all in-memory mock data to initial state.
 * Call this when you want a clean slate for testing.
 */
export function resetAllMockData(): void {
  console.log('[MockData] 🔄 Resetting all mock data to initial state...');
  
  // Reset bulk orders to 0 quantity and collecting status
  mockBulkOrders.forEach((order) => {
    order.totalQuantity = 0;
    order.status = 'collecting';
    order.pledges = [];
    order.executedAt = undefined;
    order.runnerId = undefined;
  });
  
  // Clear all pledges
  mockPledges.length = 0;
  
  // Clear all missions
  mockMissions.length = 0;
  
  // Clear all distributions
  mockDistributions.length = 0;
  
  // Reset wallet
  mockWallet.balance = 150.00;
  mockWallet.lockedFunds = 0;
  mockWallet.totalSavings = 0;
  mockWallet.transactions = [
    {
      id: 'txn-1',
      type: 'deposit',
      amount: 150.00,
      description: 'Initial wallet funding',
      status: 'completed',
      createdAt: new Date().toISOString(),
    },
  ];
  
  // Reset trending items to 0
  mockTrendingItems.forEach((item) => {
    item.pledgeCount = 0;
    item.totalQuantity = 0;
    item.percentToGoal = 0;
    item.savings = 0;
  });
  
  console.log('[MockData] ✅ All mock data reset complete!');
}
