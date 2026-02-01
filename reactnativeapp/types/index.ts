/**
 * Type definitions for the Metropolis Bulk Buy App
 */

// ============================================
// USER TYPES
// ============================================

export type UserRole = 'customer' | 'runner';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  location: Location;
  trustScore: number;
  joinedAt: string;
  avatar?: string;
}

export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
  neighborhood?: string;
}

// ============================================
// ITEM & PRODUCT TYPES
// ============================================

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  description: string;
  unit: string; // e.g., "lb", "oz", "each", "pack"
  image?: string;
  retailPrice: number; // per unit at regular store
  bulkPrice: number; // per unit when buying bulk
  bulkMinimum: number; // minimum units for bulk pricing
  store: Store;
  available: boolean;
}

export type ProductCategory = 
  | 'grains'
  | 'produce'
  | 'dairy'
  | 'meat'
  | 'pantry'
  | 'household'
  | 'beverages'
  | 'snacks'
  | 'frozen';

export interface Store {
  id: string;
  name: string;
  type: 'wholesale' | 'retail';
  location: Location;
  logo?: string;
}

// ============================================
// ORDER & PLEDGE TYPES
// ============================================

export type PledgeStatus = 'pending' | 'locked' | 'active' | 'completed' | 'cancelled' | 'rollover';

export interface Pledge {
  id: string;
  userId: string;
  productId: string;
  product: Product;
  quantity: number;
  unitPrice: number; // estimated price per unit
  totalAmount: number; // quantity * unitPrice
  maxAmount: number; // authorized hold amount
  status: PledgeStatus;
  createdAt: string;
  lockedAt?: string;
  completedAt?: string;
  orderId?: string;
}

export interface BulkOrder {
  id: string;
  productId: string;
  product: Product;
  pledges: Pledge[];
  totalQuantity: number;
  targetQuantity: number; // bulk minimum
  pricePerUnit: number;
  status: OrderStatus;
  cutoffTime: string;
  createdAt: string;
  executedAt?: string;
  runnerId?: string;
  dropZone?: Location;
}

export type OrderStatus = 
  | 'collecting' // still accepting pledges
  | 'pending_execution' // cutoff passed, waiting for runner
  | 'assigned' // runner accepted
  | 'shopping' // runner is at store
  | 'in_transit' // runner en route to drop zone
  | 'distributing' // at drop zone, handing out items
  | 'completed'
  | 'rolled_over' // didn't meet minimum, moved to next day
  | 'cancelled';

// ============================================
// RUNNER & MISSION TYPES
// ============================================

export interface Mission {
  id: string;
  orders: BulkOrder[];
  runnerId?: string;
  status: MissionStatus;
  estimatedEarnings: number;
  tips: number;
  totalItems: number;
  totalWeight?: number; // in lbs
  stores: Store[];
  route: RouteInfo;
  dropZone: Location;
  createdAt: string;
  acceptedAt?: string;
  completedAt?: string;
}

export type MissionStatus =
  | 'pending'       // Not yet available (waiting for order to trigger)
  | 'available'
  | 'accepted'
  | 'en_route_to_store'
  | 'shopping'
  | 'checkout'
  | 'en_route_to_dropzone'
  | 'distributing'
  | 'completed';

export interface RouteInfo {
  stores: Location[];
  dropZone: Location;
  totalDistance: number; // miles
  estimatedTime: number; // minutes
  optimizedOrder: number[]; // indices of stores in optimal order
}

export interface Distribution {
  id: string;
  missionId: string;
  userId: string;
  user: User;
  items: DistributionItem[];
  qrCode: string;
  status: 'pending' | 'arrived' | 'verified' | 'completed';
  scheduledTime?: string;
  completedAt?: string;
}

export interface DistributionItem {
  productId: string;
  productName: string;
  quantity: number;
  verified: boolean;
}

// ============================================
// WALLET & TRANSACTION TYPES
// ============================================

export interface Wallet {
  userId: string;
  balance: number;
  lockedFunds: number;
  totalSavings: number;
  discountCredits: number;
  transactions: Transaction[];
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  description: string;
  status: 'pending' | 'completed' | 'refunded';
  createdAt: string;
  relatedOrderId?: string;
}

export type TransactionType =
  | 'pledge_hold'
  | 'pledge_capture'
  | 'pledge_release'
  | 'refund'
  | 'discount_applied'
  | 'runner_earnings'
  | 'tip';

// ============================================
// AGENT TYPES
// ============================================

export interface AgentDecision {
  approved: boolean;
  confidence: number; // 0-100
  reasoning: string;
  bulkSavings?: number;
  recommendedQuantity?: number;
}

export interface PriceComparison {
  retailPrice: number;
  bulkPrice: number;
  savings: number;
  savingsPercent: number;
  totalCostRetail: number;
  totalCostBulk: number;
  includingDelivery: number;
}

// ============================================
// TRENDING & ANALYTICS
// ============================================

export interface TrendingItem {
  product: Product;
  pledgeCount: number;
  totalQuantity: number;
  percentToGoal: number;
  savings: number;
  trending: 'up' | 'down' | 'stable';
}

export interface NeighborhoodStats {
  totalUsers: number;
  activeOrders: number;
  totalSavings: number;
  topCategories: ProductCategory[];
  averageTrustScore: number;
}

// ============================================
// CART STATE
// ============================================

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Cart {
  items: CartItem[];
  totalEstimate: number;
  totalSavings: number;
}

