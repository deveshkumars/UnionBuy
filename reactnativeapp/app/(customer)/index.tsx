/**
 * Market Screen - Customer Home
 * Trading floor style with trending items and bulk buy opportunities
 */

import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    FlatList,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
    DataTicker,
    InfoBar,
    MetroButton,
    MetroCard,
    PriceDisplay,
    ProgressBar,
    StatusBadge,
} from '@/components/metro';
import { Fonts, FontSizes, MetroColors, Shadows, Spacing } from '@/constants/theme';
import { useCart } from '@/context/AppContext';
import { fetchProducts, fetchTrendingItems, searchProducts } from '@/services/api';
import {
    getAllSplittableItems,
    getSplitProgress,
    searchSplittableItems,
    SplittableItem,
} from '@/services/splittableItems';
import { Product, TrendingItem } from '@/types';

export default function MarketScreen() {
  const router = useRouter();
  const { addToCart, getCartTotal } = useCart();
  
  const [trendingItems, setTrendingItems] = useState<TrendingItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [splittableItems, setSplittableItems] = useState<SplittableItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState('');

  const categories = ['grains', 'pantry', 'dairy', 'meat', 'produce', 'household'];

  useEffect(() => {
    loadData();
  }, []);

  // Countdown timer for cutoff
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const cutoff = new Date();
      cutoff.setHours(18, 0, 0, 0);
      
      // If past cutoff today, set to tomorrow
      if (now > cutoff) {
        cutoff.setDate(cutoff.getDate() + 1);
      }
      
      const diff = cutoff.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      setTimeRemaining(`${hours}h ${minutes}m`);
    };
    
    updateCountdown();
    const interval = setInterval(updateCountdown, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    const [trending, allProducts] = await Promise.all([
      fetchTrendingItems(),
      fetchProducts(),
    ]);
    setTrendingItems(trending);
    setProducts(allProducts);
    setSplittableItems(getAllSplittableItems());
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length > 2) {
      const [productResults, splittableResults] = await Promise.all([
        searchProducts(query),
        Promise.resolve(searchSplittableItems(query))
      ]);
      setProducts(productResults);
      setSplittableItems(splittableResults);
    } else if (query.length === 0) {
      const [allProducts, allSplittable] = await Promise.all([
        fetchProducts(),
        Promise.resolve(getAllSplittableItems())
      ]);
      setProducts(allProducts);
      setSplittableItems(allSplittable);
    }
  };

  const filteredProducts = selectedCategory
    ? products.filter((p) => p.category === selectedCategory)
    : products;

  const filteredSplittableItems = selectedCategory
    ? splittableItems.filter((item) => item.category.toLowerCase().includes(selectedCategory.toLowerCase()))
    : splittableItems;

  // Combine both product types into one unified list for Bulk Orders
  // Hard-coded products first (for reliability), then splittable items
  // Add prefix to avoid duplicate key issues
  const allBulkItems: (Product | SplittableItem)[] = [
    ...filteredProducts,
    ...filteredSplittableItems
  ];

  // Create unique keys for the FlatList
  const getItemKey = (item: Product | SplittableItem): string => {
    if ('title' in item) {
      return `split_${item.id}`;
    }
    return `prod_${item.id}`;
  };

  const cartTotals = getCartTotal();

  // Ticker data
  const tickerData = trendingItems
    .slice(0, 10)
    .map((item) => ({
      id: item.product.id,
      name: `[HOT] ${item.product.name}`,
      value: `$${item.product.bulkPrice.toFixed(2)}`,
      change: undefined,
      suffix: `/${item.product.unit}`,
    }));

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.backgroundFX} pointerEvents="none">
        <View style={styles.backgroundGlow} />
        <View style={styles.backgroundGlowSecondary} />
        <View style={styles.backgroundStreak} />
        <View style={styles.backgroundScan} />
      </View>
      <View style={styles.fixedHeader}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerLabel}>UNION BUY</Text>
            <Text style={styles.headerTitle}>Market</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.utilityPill} onPress={() => router.push('/(customer)/cart')}>
              <Text style={styles.utilityIcon}>CRT</Text>
              <Text style={styles.utilityText}>{cartTotals.items}</Text>
            </TouchableOpacity>
            {/* Cutoff timer hidden but logic still runs */}
          </View>
        </View>

        {/* Trending Ticker (simplified text) */}
        <DataTicker items={tickerData} speed={36} height={46} showChange={false} />

        {/* Info Bar */}
        <InfoBar
          items={[
            { label: 'HOT', value: trendingItems.length, highlight: true },
            { label: 'ACTIVE ORDERS', value: allBulkItems.length },
            { label: 'SAVED', value: '$2.8K' },
          ]}
        />

        {/* Search */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputWrapper}>
            <Text style={styles.searchIcon}>FND</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search products..."
              placeholderTextColor={MetroColors.text.tertiary}
              value={searchQuery}
              onChangeText={handleSearch}
              autoCapitalize="none"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => handleSearch('')}>
                <Text style={styles.clearIcon}>X</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Categories */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesContainer}
          contentContainerStyle={styles.categoriesContent}
        >
          <TouchableOpacity
            style={[styles.categoryChip, !selectedCategory && styles.categoryChipActive]}
            onPress={() => setSelectedCategory(null)}
          >
            <Text
              style={[
                styles.categoryText,
                !selectedCategory && styles.categoryTextActive,
              ]}
            >
              ALL
            </Text>
          </TouchableOpacity>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.categoryChip,
                selectedCategory === cat && styles.categoryChipActive,
              ]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === cat && styles.categoryTextActive,
                ]}
              >
                {cat.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Products List */}
      <FlatList
        data={allBulkItems}
        keyExtractor={getItemKey}
        numColumns={1}
        contentContainerStyle={styles.productsContainer}
        ListHeaderComponent={<View style={styles.listSpacer} />}
        initialNumToRender={20}
        maxToRenderPerBatch={20}
        windowSize={10}
        removeClippedSubviews={true}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={MetroColors.accent.cyan}
          />
        }
        renderItem={({ item }) => {
          // Check if this is a splittable item (has title instead of name)
          const isSplittableItem = 'title' in item;

          if (isSplittableItem) {
            const splitItem = item as SplittableItem;
            const progress = getSplitProgress(splitItem.id);
            const splitProgress = progress ? progress.progress : 0;
            const pledgedQuantity = progress ? progress.pledgedQuantity : 0;
            const participantCount = progress ? progress.participantCount : 0;

            // Calculate savings using pre-calculated retail price for consistency
            const estimatedRetail = splitItem.estimatedRetailPricePerUnit || splitItem.price_per_unit * 1.35;
            const savings = ((estimatedRetail - splitItem.price_per_unit) / estimatedRetail) * 100;

            return (
              <TouchableOpacity
                activeOpacity={0.8}
              >
                <MetroCard
                  variant={splitProgress >= 0.8 ? 'active' : 'default'}
                  label={splitProgress >= 1 ? 'READY' : splitProgress >= 0.8 ? 'ALMOST' : undefined}
                  style={styles.productCard}
                >
                  <View style={styles.productHeader}>
                    <View style={styles.productInfo}>
                      <Text style={styles.productName}>{splitItem.title}</Text>
                      <Text style={styles.productCategory}>
                        {splitItem.category.toUpperCase()} • {splitItem.pack_quantity}-PACK SPLIT
                      </Text>
                    </View>
                    <StatusBadge
                      label={`-${savings.toFixed(0)}%`}
                      variant="success"
                      size="md"
                    />
                  </View>

                  <View style={styles.priceRow}>
                    <View style={styles.priceCompare}>
                      <View style={styles.priceItem}>
                        <Text style={styles.priceLabel}>RETAIL</Text>
                        <Text style={styles.retailPrice}>
                          ${(splitItem.price_per_unit * 1.35).toFixed(2)}
                        </Text>
                      </View>
                      <Text style={styles.priceArrow}>{'→'}</Text>
                      <View style={styles.priceItem}>
                        <Text style={styles.priceLabel}>BULK</Text>
                        <PriceDisplay
                          amount={splitItem.price_per_unit}
                          size="lg"
                          variant="highlight"
                        />
                      </View>
                    </View>
                    <Text style={styles.unitText}>/unit</Text>
                  </View>

                  <View style={styles.progressSection}>
                    <View style={styles.progressHeader}>
                      <Text style={styles.progressLabel}>
                        {pledgedQuantity}/{splitItem.pack_quantity} units pledged
                      </Text>
                      <Text style={styles.pledgeCount}>
                        {participantCount} neighbors
                      </Text>
                    </View>
                    <ProgressBar progress={splitProgress} height={10} showLabel />
                  </View>

                  <View style={styles.cardActions}>
                    <MetroButton
                      title="VIEW DETAILS"
                      variant="ghost"
                      size="sm"
                      onPress={() => router.push(`/item/${splitItem.id}`)}
                    />
                    <MetroButton
                      title="+ ADD"
                      variant="primary"
                      size="sm"
                      onPress={() => {
                        // Convert splittable item to Product format for cart
                        const productForCart: Product = {
                          id: splitItem.id,
                          name: splitItem.title,
                          category: splitItem.category.toLowerCase() as any,
                          description: splitItem.description || splitItem.feature,
                          unit: 'unit',
                          retailPrice: splitItem.total_price,
                          bulkPrice: splitItem.price_per_unit,
                          bulkMinimum: splitItem.pack_quantity,
                          store: { id: 'split-store', name: 'Split Order', type: 'wholesale', location: { latitude: 0, longitude: 0 } },
                          available: true,
                        };
                        addToCart(productForCart, 1);
                      }}
                    />
                  </View>
                </MetroCard>
              </TouchableOpacity>
            );
          }

          // Regular bulk order item
          const product = item as Product;
          const trending = trendingItems.find((t) => t.product.id === product.id);
          const progress = trending ? trending.percentToGoal / 100 : 0;
          const totalQuantity = trending ? trending.totalQuantity : 0;
          const pledgeCount = trending ? trending.pledgeCount : 0;
          const savings = ((product.retailPrice - product.bulkPrice) / product.retailPrice) * 100;

          return (
            <TouchableOpacity
              onPress={() => router.push(`/item/${item.id}`)}
              activeOpacity={0.8}
            >
              <MetroCard
                variant={progress >= 0.8 ? 'active' : 'default'}
                label={progress >= 1 ? 'READY' : progress >= 0.8 ? 'ALMOST' : undefined}
                style={styles.productCard}
              >
                <View style={styles.productHeader}>
                  <View style={styles.productInfo}>
                    <Text style={styles.productName}>{product.name}</Text>
                    <Text style={styles.productCategory}>
                      {product.category.toUpperCase()} • {product.store.name}
                    </Text>
                  </View>
                  <StatusBadge
                    label={`-${savings.toFixed(0)}%`}
                    variant="success"
                    size="md"
                  />
                </View>

                <View style={styles.priceRow}>
                  <View style={styles.priceCompare}>
                    <View style={styles.priceItem}>
                      <Text style={styles.priceLabel}>RETAIL</Text>
                      <Text style={styles.retailPrice}>
                        ${product.retailPrice.toFixed(2)}
                      </Text>
                    </View>
                    <Text style={styles.priceArrow}>{'→'}</Text>
                    <View style={styles.priceItem}>
                      <Text style={styles.priceLabel}>BULK</Text>
                      <PriceDisplay
                        amount={product.bulkPrice}
                        size="lg"
                        variant="highlight"
                      />
                    </View>
                  </View>
                  <Text style={styles.unitText}>/unit</Text>
                </View>

                <View style={styles.progressSection}>
                  <View style={styles.progressHeader}>
                    <Text style={styles.progressLabel}>
                      {totalQuantity}/{product.bulkMinimum} {product.unit} pledged
                    </Text>
                    <Text style={styles.pledgeCount}>
                      {pledgeCount} neighbors
                    </Text>
                  </View>
                  <ProgressBar progress={progress} height={10} showLabel />
                </View>

                <View style={styles.cardActions}>
                  <MetroButton
                    title="VIEW DETAILS"
                    variant="ghost"
                    size="sm"
                    onPress={() => router.push(`/item/${product.id}`)}
                  />
                  <MetroButton
                    title="+ ADD"
                    variant="primary"
                    size="sm"
                    onPress={() => addToCart(product, 1)}
                  />
                </View>
              </MetroCard>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>[]</Text>
            <Text style={styles.emptyText}>NO ITEMS FOUND</Text>
            <Text style={styles.emptySubtext}>Try adjusting your search</Text>
          </View>
        }
      />

      {/* Cart FAB */}
      {cartTotals.items > 0 && (
        <TouchableOpacity
          style={styles.cartFab}
          activeOpacity={0.9}
          onPress={() => router.push('/(customer)/cart')}
        >
          <View style={styles.cartFabContent}>
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartTotals.items}</Text>
            </View>
            <Text style={styles.cartFabText}>VIEW CART</Text>
            <Text style={styles.cartFabPrice}>
              ~${cartTotals.estimate.toFixed(2)}
            </Text>
          </View>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MetroColors.background.primary,
  },
  fixedHeader: {
    backgroundColor: MetroColors.background.primary,
    zIndex: 10,
  },
  backgroundFX: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  backgroundGlow: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: MetroColors.accent.cyan,
    opacity: 0.14,
    top: -80,
    right: -90,
  },
  backgroundGlowSecondary: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: MetroColors.accent.purple,
    opacity: 0.12,
    bottom: 140,
    left: -70,
  },
  backgroundStreak: {
    position: 'absolute',
    width: 360,
    height: 120,
    backgroundColor: MetroColors.accent.cyan,
    opacity: 0.06,
    top: 200,
    left: -60,
    transform: [{ rotate: '-8deg' }],
  },
  backgroundScan: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 130,
    height: 2,
    backgroundColor: MetroColors.accent.cyan,
    opacity: 0.14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: MetroColors.border.muted,
    backgroundColor: MetroColors.background.secondary,
  },
  headerLabel: {
    color: MetroColors.accent.cyan,
    fontFamily: Fonts.sans,
    fontSize: FontSizes.xs,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  headerTitle: {
    color: MetroColors.text.primary,
    fontFamily: Fonts.heading,
    fontSize: FontSizes['3xl'],
    fontWeight: '700',
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[1],
  },
  utilityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MetroColors.accent.cyanMuted,
    borderWidth: 1.5,
    borderColor: MetroColors.accent.cyan,
    borderRadius: 16,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[1],
  },
  utilityIcon: {
    fontSize: 10,
    marginRight: 6,
    fontFamily: Fonts.mono,
    letterSpacing: 1,
    color: MetroColors.accent.cyan,
  },
  utilityText: {
    color: MetroColors.accent.cyan,
    fontFamily: Fonts.sans,
    fontSize: FontSizes.md,
    fontWeight: '700',
  },
  cutoffBox: {
    alignItems: 'flex-end',
    marginLeft: Spacing[3],
    backgroundColor: MetroColors.accent.orangeMuted,
    paddingHorizontal: Spacing[2],
    paddingVertical: Spacing[1],
    borderRadius: 12,
    borderWidth: 1,
    borderColor: MetroColors.accent.orange,
  },
  timeLabel: {
    color: MetroColors.accent.orange,
    fontFamily: Fonts.sans,
    fontSize: FontSizes.xs,
    fontWeight: '600',
    letterSpacing: 1,
  },
  timeValue: {
    color: MetroColors.accent.orange,
    fontFamily: Fonts.heading,
    fontSize: FontSizes.lg,
    fontWeight: '800',
  },
  timeRemaining: {
    color: MetroColors.accent.orange,
    fontFamily: Fonts.sans,
    fontSize: FontSizes.xs,
    fontWeight: '600',
    marginTop: 2,
  },
  searchContainer: {
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
    backgroundColor: MetroColors.background.primary,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MetroColors.background.secondary,
    borderWidth: 2,
    borderColor: MetroColors.border.accent,
    borderRadius: 20,
    paddingHorizontal: Spacing[4],
    ...Shadows.cyanGlow,
  },
  searchIcon: {
    color: MetroColors.accent.cyan,
    fontSize: FontSizes.sm,
    marginRight: Spacing[2],
    fontFamily: Fonts.mono,
    letterSpacing: 1,
  },
  searchInput: {
    flex: 1,
    color: MetroColors.text.primary,
    fontFamily: Fonts.sans,
    fontSize: FontSizes.md,
    fontWeight: '500',
    paddingVertical: Spacing[2],
  },
  clearIcon: {
    color: MetroColors.accent.cyan,
    fontSize: FontSizes.md,
    fontWeight: '600',
    padding: Spacing[2],
  },
  categoriesContainer: {
    borderBottomWidth: 1,
    borderBottomColor: MetroColors.border.muted,
    paddingTop: Spacing[1],
    backgroundColor: MetroColors.background.primary,
    paddingBottom: Spacing[1],
  },
  categoriesContent: {
    paddingHorizontal: Spacing[4],
    paddingVertical: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryChip: {
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[1],
    borderWidth: 2,
    borderColor: MetroColors.border.default,
    borderRadius: 20,
    marginRight: Spacing[2],
    backgroundColor: MetroColors.background.secondary,
  },
  categoryChipActive: {
    borderColor: MetroColors.accent.cyan,
    backgroundColor: MetroColors.accent.cyan,
    ...Shadows.cyanGlow,
  },
  categoryText: {
    color: MetroColors.text.secondary,
    fontFamily: Fonts.sans,
    fontSize: FontSizes.md,
    fontWeight: '700',
  },
  categoryTextActive: {
    color: MetroColors.background.secondary,
  },
  productsContainer: {
    padding: Spacing[3],
    paddingBottom: 96,
  },
  listSpacer: {
    height: 2,
  },
  productCard: {
    marginBottom: Spacing[2],
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[3],
    borderWidth: 1,
    borderColor: MetroColors.border.muted,
    backgroundColor: MetroColors.background.secondary,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing[3],
  },
  productInfo: {
    flex: 1,
    marginRight: Spacing[2],
  },
  productName: {
    color: MetroColors.text.primary,
    fontFamily: Fonts.heading,
    fontSize: FontSizes.xl,
    fontWeight: '700',
    marginBottom: 6,
    lineHeight: 28,
  },
  productCategory: {
    color: MetroColors.text.secondary,
    fontFamily: Fonts.body,
    fontSize: FontSizes.md,
    fontWeight: '500',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: Spacing[3],
  },
  priceCompare: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
  },
  priceItem: {
    gap: 4,
  },
  priceLabel: {
    color: MetroColors.text.secondary,
    fontFamily: Fonts.sans,
    fontSize: FontSizes.sm,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  retailPrice: {
    color: MetroColors.text.secondary,
    fontFamily: Fonts.heading,
    fontSize: FontSizes.lg,
    textDecorationLine: 'line-through',
  },
  priceArrow: {
    color: MetroColors.accent.green,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.lg,
    fontWeight: '700',
    letterSpacing: 1,
  },
  unitText: {
    color: MetroColors.text.secondary,
    fontFamily: Fonts.body,
    fontSize: FontSizes.lg,
    marginLeft: Spacing[1],
    fontWeight: '600',
  },
  progressSection: {
    marginBottom: Spacing[4],
    marginTop: Spacing[3],
    paddingTop: Spacing[3],
    borderTopWidth: 1,
    borderTopColor: MetroColors.border.muted,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing[3],
  },
  progressLabel: {
    color: MetroColors.text.primary,
    fontFamily: Fonts.heading,
    fontSize: FontSizes.md,
    fontWeight: '700',
  },
  pledgeCount: {
    color: MetroColors.accent.purple,
    fontFamily: Fonts.heading,
    fontSize: FontSizes.md,
    fontWeight: '700',
  },
  cardActions: {
    flexDirection: 'row',
    gap: Spacing[3],
    justifyContent: 'flex-end',
    marginTop: Spacing[2],
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing[16],
  },
  emptyIcon: {
    fontSize: 32,
    color: MetroColors.text.muted,
    marginBottom: Spacing[4],
  },
  emptyText: {
    color: MetroColors.text.secondary,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.md,
    letterSpacing: 1,
    marginBottom: Spacing[2],
  },
  emptySubtext: {
    color: MetroColors.text.muted,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.sm,
  },
  cartFab: {
    position: 'absolute',
    bottom: 24,
    left: Spacing[4],
    right: Spacing[4],
    backgroundColor: MetroColors.accent.cyan,
    borderRadius: 16,
    ...Shadows.cyanGlow,
  },
  cartFabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[4],
  },
  cartBadge: {
    backgroundColor: MetroColors.background.primary,
    paddingHorizontal: Spacing[2],
    paddingVertical: 2,
    borderRadius: 2,
    marginRight: Spacing[3],
  },
  cartBadgeText: {
    color: MetroColors.accent.cyan,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.sm,
    fontWeight: '700',
  },
  cartFabText: {
    flex: 1,
    color: MetroColors.background.primary,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.sm,
    fontWeight: '700',
    letterSpacing: 1,
  },
  cartFabPrice: {
    color: MetroColors.background.primary,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.md,
    fontWeight: '700',
  },
});
