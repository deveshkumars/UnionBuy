/**
 * Splittable Items Service
 * Manages multi-pack items that can be split among customers
 */

export interface SplittableItem {
  id: string;
  title: string;
  category: string;
  total_price: number;
  pack_quantity: number;
  price_per_unit: number;
  rating: string;
  feature: string;
  description: string;
  // Calculated retail price (for consistent savings display)
  estimatedRetailPricePerUnit?: number;
}

/**
 * Calculate deterministic retail price based on product name
 * Same logic as agents.ts getRegionalRetailPrice for consistency
 */
function calculateRetailPrice(productName: string, category: string, bulkPrice: number): number {
  // Generate deterministic variation based on product name hash
  let hash = 0;
  for (let i = 0; i < productName.length; i++) {
    hash = ((hash << 5) - hash) + productName.charCodeAt(i);
    hash = hash & hash;
  }
  const deterministicSeed = Math.abs(hash % 100) / 100;

  // Category-specific markup ranges
  let minMarkup = 0.35;
  let maxMarkup = 0.85;

  const categoryLower = category.toLowerCase();
  if (categoryLower.includes('meat')) {
    minMarkup = 0.40;
    maxMarkup = 0.90;
  } else if (categoryLower.includes('dairy')) {
    minMarkup = 0.35;
    maxMarkup = 0.75;
  } else if (categoryLower.includes('produce')) {
    minMarkup = 0.50;
    maxMarkup = 1.00;
  } else if (categoryLower.includes('bakery') || categoryLower.includes('dessert')) {
    minMarkup = 0.45;
    maxMarkup = 0.95;
  } else if (categoryLower.includes('pantry')) {
    minMarkup = 0.40;
    maxMarkup = 0.80;
  } else if (categoryLower.includes('household')) {
    minMarkup = 0.30;
    maxMarkup = 0.70;
  }

  const markupPercent = minMarkup + (deterministicSeed * (maxMarkup - minMarkup));
  const retailPrice = bulkPrice * (1 + markupPercent);

  return Math.round(retailPrice * 100) / 100;
}

// Use require for better cross-platform compatibility (web + mobile)
// eslint-disable-next-line @typescript-eslint/no-var-requires
const splittableData = require('../assets/data/splittable_items.json');

// Ensure data is always an array (handle both default exports and direct exports)
const rawData = Array.isArray(splittableData)
  ? splittableData
  : splittableData.default || [];

// Augment each item with calculated retail price
const normalizedData = rawData.map((item: SplittableItem) => ({
  ...item,
  estimatedRetailPricePerUnit: calculateRetailPrice(item.title, item.category, item.price_per_unit),
}));

export interface SplitProgress {
  itemId: string;
  totalQuantity: number;
  pledgedQuantity: number;
  progress: number; // 0-1
  participantCount: number;
}

// In-memory storage for split progress
const splitProgressMap = new Map<string, SplitProgress>();

// Initialize some sample progress data
function initializeSampleProgress() {
  const allItems = normalizedData as SplittableItem[];

  allItems.forEach((item) => {
    const pledgedQuantity = 0; // Start at 0
    const participantCount = 0; // Start at 0

    splitProgressMap.set(item.id, {
      itemId: item.id,
      totalQuantity: item.pack_quantity,
      pledgedQuantity,
      progress: pledgedQuantity / item.pack_quantity,
      participantCount,
    });
  });
}

// Initialize on load
initializeSampleProgress();

/**
 * Get all splittable items
 */
export function getAllSplittableItems(): SplittableItem[] {
  return normalizedData as SplittableItem[];
}

/**
 * Search splittable items by query
 */
export function searchSplittableItems(query: string): SplittableItem[] {
  if (!query || query.trim().length === 0) {
    return getAllSplittableItems();
  }

  const lowerQuery = query.toLowerCase();
  return (normalizedData as SplittableItem[]).filter(item =>
    item.title.toLowerCase().includes(lowerQuery) ||
    item.category.toLowerCase().includes(lowerQuery) ||
    item.feature.toLowerCase().includes(lowerQuery) ||
    item.description.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Get splittable items by category
 */
export function getSplittableItemsByCategory(category: string): SplittableItem[] {
  return (normalizedData as SplittableItem[]).filter(
    item => item.category.toLowerCase() === category.toLowerCase()
  );
}

/**
 * Get splittable items by pack size
 */
export function getSplittableItemsByPackSize(minPack: number, maxPack?: number): SplittableItem[] {
  return (normalizedData as SplittableItem[]).filter(item => {
    if (maxPack) {
      return item.pack_quantity >= minPack && item.pack_quantity <= maxPack;
    }
    return item.pack_quantity >= minPack;
  });
}

/**
 * Get a single splittable item by ID
 */
export function getSplittableItemById(id: string): SplittableItem | null {
  return (normalizedData as SplittableItem[]).find(item => item.id === id) || null;
}

/**
 * Get split progress for an item
 */
export function getSplitProgress(itemId: string): SplitProgress | null {
  return splitProgressMap.get(itemId) || null;
}

/**
 * Get all items with active splits
 */
export function getItemsWithActiveSplits(): Array<SplittableItem & { progress: SplitProgress }> {
  const items: Array<SplittableItem & { progress: SplitProgress }> = [];

  splitProgressMap.forEach((progress, itemId) => {
    const item = (normalizedData as SplittableItem[]).find(i => i.id === itemId);
    if (item) {
      items.push({ ...item, progress });
    }
  });

  return items;
}

/**
 * Update split progress for an item
 */
export function updateSplitProgress(
  itemId: string,
  pledgedQuantity: number,
  participantCount: number
): SplitProgress {
  const item = (normalizedData as SplittableItem[]).find(i => i.id === itemId);

  if (!item) {
    throw new Error(`Item not found: ${itemId}`);
  }

  const progress: SplitProgress = {
    itemId,
    totalQuantity: item.pack_quantity,
    pledgedQuantity,
    progress: pledgedQuantity / item.pack_quantity,
    participantCount,
  };

  splitProgressMap.set(itemId, progress);
  return progress;
}

/**
 * Join a split (add to pledged quantity)
 * Returns error if requested quantity exceeds available slots
 */
export function joinSplit(itemId: string, quantity: number = 1): { success: boolean; progress?: SplitProgress; error?: string } {
  let progress = splitProgressMap.get(itemId);
  const item = (normalizedData as SplittableItem[]).find(i => i.id === itemId);

  if (!item) {
    return { success: false, error: `Item not found: ${itemId}` };
  }

  if (!progress) {
    progress = {
      itemId,
      totalQuantity: item.pack_quantity,
      pledgedQuantity: 0,
      progress: 0,
      participantCount: 0,
    };
  }

  // Check available slots
  const availableSlots = progress.totalQuantity - progress.pledgedQuantity;
  if (quantity > availableSlots) {
    return { 
      success: false, 
      error: `Only ${availableSlots} units available. Requested ${quantity}.` 
    };
  }

  // Full success - add the full quantity
  progress.pledgedQuantity += quantity;
  progress.participantCount += 1;
  progress.progress = progress.pledgedQuantity / progress.totalQuantity;

  splitProgressMap.set(itemId, progress);
  return { success: true, progress };
}

/**
 * Get statistics about splittable items
 */
export function getSplittableStats() {
  const allItems = getAllSplittableItems();

  const categories = new Set(allItems.map(i => i.category));
  const packSizes = allItems.map(i => i.pack_quantity);
  const avgPackSize = packSizes.reduce((a, b) => a + b, 0) / packSizes.length;
  const maxPackSize = Math.max(...packSizes);
  const minPackSize = Math.min(...packSizes);

  return {
    totalItems: allItems.length,
    categories: categories.size,
    avgPackSize: Math.round(avgPackSize),
    maxPackSize,
    minPackSize,
    activeSplits: splitProgressMap.size,
  };
}
