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
  {
    id: 'order-1',
    productId: 'prod-1',
    product: mockProducts[0],
    pledges: [],
    totalQuantity: 42,
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
    product: mockProducts[2],
    pledges: [],
    totalQuantity: 12,
    targetQuantity: 15,
    pricePerUnit: 4.69,
    status: 'collecting',
    cutoffTime: '2026-01-31T18:00:00Z',
    createdAt: '2026-01-31T08:00:00Z',
  },
  {
    id: 'order-3',
    productId: 'prod-4',
    product: mockProducts[3],
    pledges: [],
    totalQuantity: 40,
    targetQuantity: 40,
    pricePerUnit: 2.95,
    status: 'assigned',
    cutoffTime: '2026-01-30T18:00:00Z',
    createdAt: '2026-01-30T08:00:00Z',
    executedAt: '2026-01-30T18:05:00Z',
    runnerId: 'user-3',
  },
  {
    id: 'order-4',
    productId: 'prod-5',
    product: mockProducts[4],
    pledges: [],
    totalQuantity: 28,
    targetQuantity: 50,
    pricePerUnit: 0.48,
    status: 'rolled_over',
    cutoffTime: '2026-01-30T18:00:00Z',
    createdAt: '2026-01-29T08:00:00Z',
  },
];

// ============================================
// PLEDGES
// ============================================

export const mockPledges: Pledge[] = [
  {
    id: 'pledge-1',
    userId: 'user-1',
    productId: 'prod-1',
    product: mockProducts[0],
    quantity: 10,
    unitPrice: 0.85,
    totalAmount: 8.50,
    maxAmount: 18.90,
    status: 'locked',
    createdAt: '2026-01-31T09:15:00Z',
    lockedAt: '2026-01-31T09:15:00Z',
    orderId: 'order-1',
  },
  {
    id: 'pledge-2',
    userId: 'user-1',
    productId: 'prod-3',
    product: mockProducts[2],
    quantity: 3,
    unitPrice: 4.69,
    totalAmount: 14.07,
    maxAmount: 20.97,
    status: 'locked',
    createdAt: '2026-01-31T10:30:00Z',
    lockedAt: '2026-01-31T10:30:00Z',
    orderId: 'order-2',
  },
  {
    id: 'pledge-3',
    userId: 'user-1',
    productId: 'prod-4',
    product: mockProducts[3],
    quantity: 5,
    unitPrice: 2.95,
    totalAmount: 14.75,
    maxAmount: 24.95,
    status: 'completed',
    createdAt: '2026-01-30T11:00:00Z',
    lockedAt: '2026-01-30T11:00:00Z',
    completedAt: '2026-01-30T20:30:00Z',
    orderId: 'order-3',
  },
  {
    id: 'pledge-4',
    userId: 'user-1',
    productId: 'prod-5',
    product: mockProducts[4],
    quantity: 8,
    unitPrice: 0.50,
    totalAmount: 4.0,
    maxAmount: 7.12,
    status: 'rollover',
    createdAt: '2026-01-30T08:30:00Z',
    lockedAt: '2026-01-30T08:30:00Z',
    orderId: 'order-4',
  },
];

// ============================================
// MISSIONS
// ============================================

export const mockMissions: Mission[] = [
  {
    id: 'mission-1',
    orders: [mockBulkOrders[2]],
    runnerId: 'user-3',
    status: 'distributing',
    estimatedEarnings: 28.50,
    tips: 12.00,
    totalItems: 40,
    totalWeight: 40,
    stores: [mockStores[2]],
    route: {
      stores: [mockStores[2].location],
      dropZone: {
        latitude: 41.8215,
        longitude: -71.4190,
        address: 'Providence Community Center',
      },
      totalDistance: 8.2,
      estimatedTime: 45,
      optimizedOrder: [0],
    },
    dropZone: {
      latitude: 41.8215,
      longitude: -71.4190,
      address: 'Providence Community Center',
    },
    createdAt: '2026-01-30T18:10:00Z',
    acceptedAt: '2026-01-30T18:15:00Z',
  },
  {
    id: 'mission-2',
    orders: [],
    status: 'available',
    estimatedEarnings: 45.00,
    tips: 0,
    totalItems: 92,
    totalWeight: 85,
    stores: [mockStores[0], mockStores[1]],
    route: {
      stores: [mockStores[0].location, mockStores[1].location],
      dropZone: {
        latitude: 41.8198,
        longitude: -71.4178,
        address: 'College Hill Plaza',
      },
      totalDistance: 15.5,
      estimatedTime: 75,
      optimizedOrder: [0, 1],
    },
    dropZone: {
      latitude: 41.8198,
      longitude: -71.4178,
      address: 'College Hill Plaza',
    },
    createdAt: '2026-01-31T18:10:00Z',
  },
];

// ============================================
// DISTRIBUTIONS
// ============================================

export const mockDistributions: Distribution[] = [
  {
    id: 'dist-1',
    missionId: 'mission-1',
    userId: 'user-1',
    user: mockUsers[0],
    items: [
      { productId: 'prod-4', productName: 'Chicken Breast', quantity: 5, verified: false },
    ],
    qrCode: 'METRO-DIST-001-A7B3',
    status: 'pending',
    scheduledTime: '2026-01-30T19:30:00Z',
  },
  {
    id: 'dist-2',
    missionId: 'mission-1',
    userId: 'user-2',
    user: mockUsers[1],
    items: [
      { productId: 'prod-4', productName: 'Chicken Breast', quantity: 8, verified: false },
    ],
    qrCode: 'METRO-DIST-002-C9D4',
    status: 'pending',
    scheduledTime: '2026-01-30T19:45:00Z',
  },
];

// ============================================
// WALLET & TRANSACTIONS
// ============================================

export const mockWallet: Wallet = {
  userId: 'user-1',
  balance: 124.50,
  lockedFunds: 22.57,
  totalSavings: 89.34,
  discountCredits: 5.00,
  transactions: [
    {
      id: 'txn-1',
      type: 'pledge_hold',
      amount: -8.50,
      description: 'Hold for Jasmine Rice (10 lbs)',
      status: 'pending',
      createdAt: '2026-01-31T09:15:00Z',
      relatedOrderId: 'order-1',
    },
    {
      id: 'txn-2',
      type: 'pledge_hold',
      amount: -14.07,
      description: 'Hold for Organic Eggs (3 dozen)',
      status: 'pending',
      createdAt: '2026-01-31T10:30:00Z',
      relatedOrderId: 'order-2',
    },
    {
      id: 'txn-3',
      type: 'pledge_capture',
      amount: -14.75,
      description: 'Chicken Breast (5 lbs) - Final charge',
      status: 'completed',
      createdAt: '2026-01-30T20:30:00Z',
      relatedOrderId: 'order-3',
    },
    {
      id: 'txn-4',
      type: 'pledge_release',
      amount: 10.20,
      description: 'Released hold - Chicken Breast savings',
      status: 'completed',
      createdAt: '2026-01-30T20:30:00Z',
      relatedOrderId: 'order-3',
    },
    {
      id: 'txn-5',
      type: 'discount_applied',
      amount: 2.50,
      description: 'Community discount credit applied',
      status: 'completed',
      createdAt: '2026-01-28T14:00:00Z',
    },
  ],
};

// ============================================
// TRENDING ITEMS
// ============================================

export const mockTrendingItems: TrendingItem[] = [
  {
    product: mockProducts[0],
    pledgeCount: 8,
    totalQuantity: 42,
    percentToGoal: 84,
    savings: 55.00,
    trending: 'up',
  },
  {
    product: mockProducts[2],
    pledgeCount: 5,
    totalQuantity: 12,
    percentToGoal: 80,
    savings: 37.50,
    trending: 'up',
  },
  {
    product: mockProducts[4],
    pledgeCount: 3,
    totalQuantity: 28,
    percentToGoal: 56,
    savings: 13.16,
    trending: 'stable',
  },
  {
    product: mockProducts[6],
    pledgeCount: 6,
    totalQuantity: 24,
    percentToGoal: 80,
    savings: 26.40,
    trending: 'up',
  },
  {
    product: mockProducts[9],
    pledgeCount: 4,
    totalQuantity: 32,
    percentToGoal: 80,
    savings: 9.60,
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
