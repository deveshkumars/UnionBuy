/**
 * K-Means Clustering Algorithm
 * Used to find optimal drop-off locations based on customer positions
 */

import { Location } from '@/types';

export interface CustomerPoint {
  location: Location;
  weight?: number; // Optional weight (e.g., order quantity)
}

export interface KMeansResult {
  centroids: Location[];
  clusters: number[]; // Index of assigned centroid for each point
  iterations: number;
  totalDistance: number;
  averageDistancePerCustomer: number;
}

/**
 * Calculate Haversine distance between two points (in miles)
 * More accurate than Euclidean for geographic coordinates
 */
function haversineDistance(loc1: Location, loc2: Location): number {
  const R = 3959; // Earth's radius in miles
  const dLat = toRad(loc2.latitude - loc1.latitude);
  const dLon = toRad(loc2.longitude - loc1.longitude);
  const lat1 = toRad(loc1.latitude);
  const lat2 = toRad(loc2.latitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * K-Means clustering algorithm
 * @param points - Array of customer locations with optional weights
 * @param k - Number of clusters (use 1 for single optimal drop-off point)
 * @param maxIterations - Maximum iterations before stopping
 * @returns KMeansResult with centroids and cluster assignments
 */
export function kMeans(
  points: CustomerPoint[],
  k: number = 1,
  maxIterations: number = 100
): KMeansResult {
  if (points.length === 0) {
    return {
      centroids: [],
      clusters: [],
      iterations: 0,
      totalDistance: 0,
      averageDistancePerCustomer: 0,
    };
  }

  if (points.length <= k) {
    // Each point is its own centroid
    return {
      centroids: points.map(p => p.location),
      clusters: points.map((_, i) => i),
      iterations: 1,
      totalDistance: 0,
      averageDistancePerCustomer: 0,
    };
  }

  // Initialize centroids using k-means++ for better starting positions
  let centroids = initializeCentroidsKMeansPlusPlus(points, k);
  let clusters: number[] = new Array(points.length).fill(0);
  let iterations = 0;
  let changed = true;

  while (changed && iterations < maxIterations) {
    changed = false;
    iterations++;

    // Assignment step: assign each point to nearest centroid
    for (let i = 0; i < points.length; i++) {
      let minDist = Infinity;
      let minCluster = 0;

      for (let j = 0; j < centroids.length; j++) {
        const dist = haversineDistance(points[i].location, centroids[j]);
        if (dist < minDist) {
          minDist = dist;
          minCluster = j;
        }
      }

      if (clusters[i] !== minCluster) {
        clusters[i] = minCluster;
        changed = true;
      }
    }

    // Update step: recalculate centroids as weighted mean of assigned points
    const newCentroids: Location[] = [];
    for (let j = 0; j < k; j++) {
      let sumLat = 0;
      let sumLng = 0;
      let totalWeight = 0;

      for (let i = 0; i < points.length; i++) {
        if (clusters[i] === j) {
          const weight = points[i].weight || 1;
          sumLat += points[i].location.latitude * weight;
          sumLng += points[i].location.longitude * weight;
          totalWeight += weight;
        }
      }

      if (totalWeight > 0) {
        newCentroids.push({
          latitude: sumLat / totalWeight,
          longitude: sumLng / totalWeight,
        });
      } else {
        // Keep old centroid if no points assigned
        newCentroids.push(centroids[j]);
      }
    }

    centroids = newCentroids;
  }

  // Calculate total distance
  let totalDistance = 0;
  for (let i = 0; i < points.length; i++) {
    const weight = points[i].weight || 1;
    totalDistance += haversineDistance(points[i].location, centroids[clusters[i]]) * weight;
  }

  const totalWeight = points.reduce((sum, p) => sum + (p.weight || 1), 0);

  return {
    centroids,
    clusters,
    iterations,
    totalDistance,
    averageDistancePerCustomer: totalDistance / totalWeight,
  };
}

/**
 * K-means++ initialization for better starting centroids
 */
function initializeCentroidsKMeansPlusPlus(
  points: CustomerPoint[],
  k: number
): Location[] {
  const centroids: Location[] = [];

  // Choose first centroid randomly
  const firstIndex = Math.floor(Math.random() * points.length);
  centroids.push({ ...points[firstIndex].location });

  // Choose remaining centroids with probability proportional to distance squared
  for (let i = 1; i < k; i++) {
    const distances: number[] = [];
    let totalDistSq = 0;

    for (const point of points) {
      // Find minimum distance to existing centroids
      let minDist = Infinity;
      for (const centroid of centroids) {
        const dist = haversineDistance(point.location, centroid);
        minDist = Math.min(minDist, dist);
      }
      const distSq = minDist * minDist;
      distances.push(distSq);
      totalDistSq += distSq;
    }

    // Choose next centroid with probability proportional to distance squared
    let random = Math.random() * totalDistSq;
    let selectedIndex = 0;
    for (let j = 0; j < distances.length; j++) {
      random -= distances[j];
      if (random <= 0) {
        selectedIndex = j;
        break;
      }
    }

    centroids.push({ ...points[selectedIndex].location });
  }

  return centroids;
}

/**
 * Find the single optimal drop-off point for all customers
 * This is K-means with K=1, which converges to the weighted centroid
 */
export function findOptimalDropZone(customers: CustomerPoint[]): {
  location: Location;
  totalDistance: number;
  averageDistance: number;
  maxDistance: number;
} {
  const result = kMeans(customers, 1, 50);

  if (result.centroids.length === 0) {
    return {
      location: { latitude: 0, longitude: 0 },
      totalDistance: 0,
      averageDistance: 0,
      maxDistance: 0,
    };
  }

  const centroid = result.centroids[0];

  // Calculate max distance
  let maxDistance = 0;
  for (const customer of customers) {
    const dist = haversineDistance(customer.location, centroid);
    maxDistance = Math.max(maxDistance, dist);
  }

  return {
    location: centroid,
    totalDistance: result.totalDistance,
    averageDistance: result.averageDistancePerCustomer,
    maxDistance,
  };
}

/**
 * Find multiple optimal drop-off points if customers are spread out
 * Useful for splitting large orders into multiple delivery zones
 */
export function findMultipleDropZones(
  customers: CustomerPoint[],
  maxZones: number = 3,
  maxDistancePerZone: number = 2 // miles
): {
  zones: Location[];
  assignments: number[];
  averageDistances: number[];
} {
  // Try increasing K until all customers are within maxDistancePerZone
  for (let k = 1; k <= Math.min(maxZones, customers.length); k++) {
    const result = kMeans(customers, k, 50);

    // Check if all customers are within acceptable distance
    let allWithinRange = true;
    for (let i = 0; i < customers.length; i++) {
      const dist = haversineDistance(
        customers[i].location,
        result.centroids[result.clusters[i]]
      );
      if (dist > maxDistancePerZone) {
        allWithinRange = false;
        break;
      }
    }

    if (allWithinRange || k === maxZones) {
      // Calculate average distance per zone
      const avgDistances: number[] = new Array(k).fill(0);
      const zoneCounts: number[] = new Array(k).fill(0);

      for (let i = 0; i < customers.length; i++) {
        const cluster = result.clusters[i];
        const dist = haversineDistance(customers[i].location, result.centroids[cluster]);
        avgDistances[cluster] += dist;
        zoneCounts[cluster]++;
      }

      for (let j = 0; j < k; j++) {
        if (zoneCounts[j] > 0) {
          avgDistances[j] /= zoneCounts[j];
        }
      }

      return {
        zones: result.centroids,
        assignments: result.clusters,
        averageDistances: avgDistances,
      };
    }
  }

  // Shouldn't reach here, but return single zone as fallback
  const result = kMeans(customers, 1, 50);
  return {
    zones: result.centroids,
    assignments: result.clusters,
    averageDistances: [result.averageDistancePerCustomer],
  };
}
