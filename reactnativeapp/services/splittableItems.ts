/**
 * Splittable Items Service
 * Manages multi-pack items that can be split among customers
 */

// Use require for better cross-platform compatibility (web + mobile)
// eslint-disable-next-line @typescript-eslint/no-var-requires
const splittableData = require('../assets/data/splittable_items.json');

// Ensure data is always an array (handle both default exports and direct exports)
const normalizedData = Array.isArray(splittableData)
  ? splittableData
  : splittableData.default || [];

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
}

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
 */
export function joinSplit(itemId: string, quantity: number = 1): SplitProgress {
  let progress = splitProgressMap.get(itemId);
  const item = (normalizedData as SplittableItem[]).find(i => i.id === itemId);

  if (!item) {
    throw new Error(`Item not found: ${itemId}`);
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

  progress.pledgedQuantity = Math.min(
    progress.pledgedQuantity + quantity,
    progress.totalQuantity
  );
  progress.participantCount += 1;
  progress.progress = progress.pledgedQuantity / progress.totalQuantity;

  splitProgressMap.set(itemId, progress);
  return progress;
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
