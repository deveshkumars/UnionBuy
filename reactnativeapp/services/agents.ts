/**
 * Mock Agent Functions
 * Simulated AI agent decision-making for bulk purchases
 */

import { AgentDecision, PriceComparison, Product, Location } from '@/types';

// Simulate agent processing delay
const agentDelay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// ============================================
// AGENT #1: Bulk Buy Decision
// ============================================

interface BulkBuyInput {
  productId: string;
  productName: string;
  quantity: number;
  retailPrice: number;
  bulkPrice: number;
  bulkMinimum: number;
  currentPledgedQuantity: number;
  userLocations: Location[];
}

/**
 * Agent #1: Determines if a bulk buy makes sense
 * - Checks if bulk pricing is actually cheaper
 * - Verifies users are geographically close enough
 * - Confirms there's enough demand
 */
export async function evaluateBulkBuy(input: BulkBuyInput): Promise<AgentDecision> {
  await agentDelay(1200); // Simulate AI processing

  const {
    productName,
    quantity,
    retailPrice,
    bulkPrice,
    bulkMinimum,
    currentPledgedQuantity,
    userLocations,
  } = input;

  // Calculate savings
  const savingsPerUnit = retailPrice - bulkPrice;
  const savingsPercent = (savingsPerUnit / retailPrice) * 100;
  const totalSavings = savingsPerUnit * quantity;

  // Check geographic spread (simplified - in reality would use clustering)
  const avgLat = userLocations.reduce((sum, loc) => sum + loc.latitude, 0) / userLocations.length;
  const avgLng = userLocations.reduce((sum, loc) => sum + loc.longitude, 0) / userLocations.length;
  
  const maxDistance = userLocations.reduce((max, loc) => {
    const dist = Math.sqrt(
      Math.pow(loc.latitude - avgLat, 2) + Math.pow(loc.longitude - avgLng, 2)
    );
    return Math.max(max, dist);
  }, 0);

  // Convert to approximate miles (very rough)
  const maxDistanceMiles = maxDistance * 69;

  // Decision logic
  const isPriceWorthIt = savingsPercent >= 20; // At least 20% savings
  const isCloseEnough = maxDistanceMiles <= 5; // Within 5 miles
  const hasEnoughDemand = currentPledgedQuantity + quantity >= bulkMinimum * 0.6; // 60% of minimum

  const approved = isPriceWorthIt && isCloseEnough && hasEnoughDemand;

  // Calculate confidence
  let confidence = 50;
  if (savingsPercent >= 40) confidence += 20;
  else if (savingsPercent >= 30) confidence += 15;
  else if (savingsPercent >= 20) confidence += 10;

  if (maxDistanceMiles <= 2) confidence += 20;
  else if (maxDistanceMiles <= 4) confidence += 10;

  if (currentPledgedQuantity + quantity >= bulkMinimum) confidence += 15;
  else if (hasEnoughDemand) confidence += 8;

  confidence = Math.min(confidence, 98);

  // Generate reasoning
  let reasoning = '';
  if (approved) {
    reasoning = `APPROVED: ${productName} bulk purchase is viable. `;
    reasoning += `Savings of ${savingsPercent.toFixed(1)}% ($${totalSavings.toFixed(2)} total). `;
    reasoning += `Users within ${maxDistanceMiles.toFixed(1)} mile radius. `;
    reasoning += `${((currentPledgedQuantity + quantity) / bulkMinimum * 100).toFixed(0)}% of bulk minimum reached.`;
  } else {
    reasoning = `NOT APPROVED: `;
    if (!isPriceWorthIt) {
      reasoning += `Savings of ${savingsPercent.toFixed(1)}% below 20% threshold. `;
    }
    if (!isCloseEnough) {
      reasoning += `Users spread over ${maxDistanceMiles.toFixed(1)} miles exceeds 5 mile limit. `;
    }
    if (!hasEnoughDemand) {
      reasoning += `Only ${((currentPledgedQuantity + quantity) / bulkMinimum * 100).toFixed(0)}% of bulk minimum - need more pledges. `;
    }
  }

  return {
    approved,
    confidence,
    reasoning,
    bulkSavings: totalSavings,
    recommendedQuantity: approved ? quantity : Math.ceil(bulkMinimum * 0.4),
  };
}

// ============================================
// AGENT #2: Price Comparison
// ============================================

interface PriceInput {
  productName: string;
  quantity: number;
}

/**
 * Agent #2: Compares retail vs bulk prices
 * Returns detailed price breakdown
 */
export async function comparePrices(
  product: Product,
  quantity: number,
  deliveryCostEstimate: number = 2.50
): Promise<PriceComparison> {
  await agentDelay(800);

  const totalCostRetail = product.retailPrice * quantity;
  const totalCostBulk = product.bulkPrice * quantity;
  const savings = totalCostRetail - totalCostBulk;
  const savingsPercent = (savings / totalCostRetail) * 100;
  const includingDelivery = totalCostBulk + deliveryCostEstimate;

  return {
    retailPrice: product.retailPrice,
    bulkPrice: product.bulkPrice,
    savings,
    savingsPercent,
    totalCostRetail,
    totalCostBulk,
    includingDelivery,
  };
}

// ============================================
// AGENT #3: Security & Location Verification
// ============================================

interface SecurityCheckInput {
  userId: string;
  userLocation: Location;
  dropZoneLocation: Location;
  trustScore: number;
}

interface SecurityCheckResult {
  approved: boolean;
  riskLevel: 'low' | 'medium' | 'high';
  reasons: string[];
  recommendedActions: string[];
}

/**
 * Agent #3: Security and location verification
 */
export async function performSecurityCheck(
  input: SecurityCheckInput
): Promise<SecurityCheckResult> {
  await agentDelay(600);

  const { userLocation, dropZoneLocation, trustScore } = input;

  // Calculate distance to drop zone
  const distanceToDropZone = Math.sqrt(
    Math.pow(userLocation.latitude - dropZoneLocation.latitude, 2) +
    Math.pow(userLocation.longitude - dropZoneLocation.longitude, 2)
  ) * 69; // Approximate miles

  const reasons: string[] = [];
  const recommendedActions: string[] = [];
  let riskScore = 0;

  // Check trust score
  if (trustScore >= 4.5) {
    reasons.push('High trust score (4.5+)');
  } else if (trustScore >= 3.5) {
    reasons.push('Moderate trust score');
    riskScore += 1;
  } else {
    reasons.push('Low trust score - additional verification recommended');
    riskScore += 2;
    recommendedActions.push('Request ID verification');
  }

  // Check distance
  if (distanceToDropZone <= 3) {
    reasons.push('Within optimal pickup range');
  } else if (distanceToDropZone <= 7) {
    reasons.push('Moderate distance to drop zone');
    riskScore += 1;
  } else {
    reasons.push('Far from drop zone - may indicate address mismatch');
    riskScore += 2;
    recommendedActions.push('Verify delivery address');
  }

  // Determine risk level
  let riskLevel: 'low' | 'medium' | 'high';
  if (riskScore <= 1) {
    riskLevel = 'low';
  } else if (riskScore <= 3) {
    riskLevel = 'medium';
  } else {
    riskLevel = 'high';
  }

  const approved = riskLevel !== 'high';

  if (!approved) {
    recommendedActions.push('Manual review required before proceeding');
  }

  return {
    approved,
    riskLevel,
    reasons,
    recommendedActions,
  };
}

// ============================================
// DROP ZONE CALCULATION
// ============================================

interface DropZoneInput {
  userLocations: { location: Location; quantity: number }[];
}

interface DropZoneResult {
  location: Location;
  averageDistance: number;
  maxDistance: number;
  accessibilityScore: number;
}

/**
 * Calculate optimal drop zone using K-means clustering algorithm
 * Finds the geographic centroid that minimizes total travel distance for all customers
 */
export async function calculateDropZone(input: DropZoneInput): Promise<DropZoneResult> {
  await agentDelay(500);

  const { userLocations } = input;

  // Use K-means to find optimal drop zone
  const { findOptimalDropZone } = await import('./kmeans');

  const customers = userLocations.map(({ location, quantity }) => ({
    location,
    weight: quantity,
  }));

  const result = findOptimalDropZone(customers);

  // Accessibility score (higher is better, max 100)
  // Penalize if max distance is too far (>2 miles starts reducing score)
  const accessibilityScore = Math.max(0, Math.min(100, 100 - (result.maxDistance - 1) * 25));

  return {
    location: result.location,
    averageDistance: result.averageDistance,
    maxDistance: result.maxDistance,
    accessibilityScore,
  };
}

// ============================================
// ROUTE OPTIMIZATION
// ============================================

interface RouteInput {
  stores: Location[];
  dropZone: Location;
  startLocation: Location;
}

interface RouteResult {
  optimizedOrder: number[];
  totalDistance: number;
  estimatedTime: number; // minutes
}

/**
 * Simple route optimization (nearest neighbor algorithm)
 * In production, would use AWS Location Service
 */
export async function optimizeRoute(input: RouteInput): Promise<RouteResult> {
  await agentDelay(700);

  const { stores, dropZone, startLocation } = input;
  
  if (stores.length === 0) {
    return { optimizedOrder: [], totalDistance: 0, estimatedTime: 0 };
  }

  const calculateDistance = (a: Location, b: Location) =>
    Math.sqrt(Math.pow(a.latitude - b.latitude, 2) + Math.pow(a.longitude - b.longitude, 2)) * 69;

  // Simple nearest neighbor
  const visited = new Set<number>();
  const optimizedOrder: number[] = [];
  let currentLocation = startLocation;
  let totalDistance = 0;

  while (visited.size < stores.length) {
    let nearestIndex = -1;
    let nearestDistance = Infinity;

    stores.forEach((store, index) => {
      if (!visited.has(index)) {
        const distance = calculateDistance(currentLocation, store);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = index;
        }
      }
    });

    if (nearestIndex >= 0) {
      visited.add(nearestIndex);
      optimizedOrder.push(nearestIndex);
      totalDistance += nearestDistance;
      currentLocation = stores[nearestIndex];
    }
  }

  // Add distance to drop zone
  totalDistance += calculateDistance(currentLocation, dropZone);

  // Estimate time (avg 25 mph in city + 15 min per store)
  const estimatedTime = Math.round((totalDistance / 25) * 60 + stores.length * 15);

  return {
    optimizedOrder,
    totalDistance: Math.round(totalDistance * 10) / 10,
    estimatedTime,
  };
}

