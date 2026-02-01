/**
 * Market Screen - Customer Home
 * Clean, warm design with bulk buy opportunities
 */

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
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
import { UBLogo } from '@/components/UBLogo';
import { BorderRadius, Fonts, FontSizes, MetroColors, Shadows, Spacing } from '@/constants/theme';
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
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState("");

  const categories = [
    "grains",
    "pantry",
    "dairy",
    "meat",
    "produce",
    "household",
  ];

  useEffect(() => {
    loadData();
  }, []);

  // Countdown timer for cutoff
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const cutoff = new Date();
      cutoff.setHours(18, 0, 0, 0);

      if (now > cutoff) {
        cutoff.setDate(cutoff.getDate() + 1);
      }

      const diff = cutoff.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      setTimeRemaining(`${hours}h ${minutes}m`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);

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
        Promise.resolve(searchSplittableItems(query)),
      ]);
      setProducts(productResults);
      setSplittableItems(splittableResults);
    } else if (query.length === 0) {
      const [allProducts, allSplittable] = await Promise.all([
        fetchProducts(),
        Promise.resolve(getAllSplittableItems()),
      ]);
      setProducts(allProducts);
      setSplittableItems(allSplittable);
    }
  };

  const filteredProducts = selectedCategory
    ? products.filter((p) => p.category === selectedCategory)
    : products;

  const filteredSplittableItems = selectedCategory
    ? splittableItems.filter((item) =>
        item.category.toLowerCase().includes(selectedCategory.toLowerCase()),
      )
    : splittableItems;

  // Combine both product types into one unified list for Bulk Orders
  // Hard-coded products first (for reliability), then splittable items
  // Add prefix to avoid duplicate key issues
  const allBulkItems: (Product | SplittableItem)[] = [
    ...filteredProducts,
    ...filteredSplittableItems,
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
  const tickerData = trendingItems.slice(0, 10).map((item) => ({
    id: item.product.id,
    name: `🔥 ${item.product.name}`,
    value: `$${item.product.bulkPrice.toFixed(2)}`,
    change: undefined,
    suffix: `/${item.product.unit}`,
  }));

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.fixedHeader}>
        {/* Header */}
        <View style={styles.header}>
          <UBLogo size="lg" variant="navy" source={require('@/assets/images/logo.png')} />
          <View style={styles.headerRight}>
            <TouchableOpacity 
              style={styles.headerIconButton}
              onPress={() => router.push("/(customer)/wallet")}
            >
              <Ionicons
                name="wallet-outline"
                size={24}
                color={MetroColors.text.primary}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerIconButton}
              onPress={() => router.push("/(customer)/cart")}
            >
              <Ionicons
                name="cart-outline"
                size={24}
                color={MetroColors.text.primary}
              />
              {cartTotals.items > 0 && (
                <View style={styles.cartBadgeSmall}>
                  <Text style={styles.cartBadgeSmallText}>{cartTotals.items}</Text>
                </View>
              )}
            </TouchableOpacity>
            <View style={styles.cutoffBox}>
              <Text style={styles.timeLabel}>Cutoff</Text>
              <Text style={styles.timeValue}>6:00 PM</Text>
              {timeRemaining && (
                <Text style={styles.timeRemaining}>{timeRemaining}</Text>
              )}
            </View>
          </View>
        </View>

        {/* Trending Ticker */}
        <DataTicker
          items={tickerData}
          speed={36}
          height={44}
          showChange={false}
        />

        {/* Info Bar */}
        <InfoBar
          items={[
            { label: "Hot", value: trendingItems.length, highlight: true },
            { label: "Active", value: allBulkItems.length },
            { label: "Saved", value: "$2.8K" },
          ]}
        />

        {/* Search */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputWrapper}>
            <Ionicons
              name="search"
              size={20}
              color={MetroColors.text.muted}
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search products..."
              placeholderTextColor={MetroColors.text.muted}
              value={searchQuery}
              onChangeText={handleSearch}
              autoCapitalize="none"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => handleSearch("")}>
                <Ionicons name="close-circle" size={20} color={MetroColors.text.muted} />
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
            style={[
              styles.categoryChip,
              !selectedCategory && styles.categoryChipActive,
            ]}
            onPress={() => setSelectedCategory(null)}
          >
            <Text
              style={[
                styles.categoryText,
                !selectedCategory && styles.categoryTextActive,
              ]}
            >
              All
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
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
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
          const isSplittableItem = "title" in item;

          if (isSplittableItem) {
            const splitItem = item as SplittableItem;
            const progress = getSplitProgress(splitItem.id);
            const splitProgress = progress ? progress.progress : 0;
            const pledgedQuantity = progress ? progress.pledgedQuantity : 0;
            const participantCount = progress ? progress.participantCount : 0;

            const estimatedRetail =
              splitItem.estimatedRetailPricePerUnit ||
              splitItem.price_per_unit * 1.35;
            const savings =
              ((estimatedRetail - splitItem.price_per_unit) / estimatedRetail) *
              100;

            return (
              <TouchableOpacity activeOpacity={0.8}>
                <MetroCard
                  variant={splitProgress >= 0.8 ? "active" : "default"}
                  label={
                    splitProgress >= 1
                      ? "Ready"
                      : splitProgress >= 0.8
                      ? "Almost"
                      : undefined
                  }
                  style={styles.productCard}
                  showCorners={false}
                >
                  <View style={styles.productHeader}>
                    <View style={styles.productInfo}>
                      <Text style={styles.productName}>{splitItem.title}</Text>
                      <Text style={styles.productCategory}>
                        {splitItem.category} · {splitItem.pack_quantity}-Pack Split
                      </Text>
                    </View>
                    <StatusBadge
                      label={`${savings.toFixed(0)}% off`}
                      variant="success"
                      size="sm"
                    />
                  </View>

                  <View style={styles.priceRow}>
                    <View style={styles.priceCompare}>
                      <View style={styles.priceItem}>
                        <Text style={styles.priceLabel}>Retail</Text>
                        <Text style={styles.retailPrice}>
                          ${(splitItem.price_per_unit * 1.35).toFixed(2)}
                        </Text>
                      </View>
                      <Ionicons name="arrow-forward" size={16} color={MetroColors.accent.green} />
                      <View style={styles.priceItem}>
                        <Text style={styles.priceLabel}>Bulk</Text>
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
                    <ProgressBar
                      progress={splitProgress}
                      height={8}
                      showLabel
                    />
                  </View>

                  <View style={styles.cardActions}>
                    <MetroButton
                      title="Details"
                      variant="ghost"
                      size="sm"
                      onPress={() => router.push(`/item/${splitItem.id}`)}
                    />
                    <MetroButton
                      title="Add"
                      variant="primary"
                      size="sm"
                      onPress={() => {
                        const productForCart: Product = {
                          id: splitItem.id,
                          name: splitItem.title,
                          category: splitItem.category.toLowerCase() as any,
                          description:
                            splitItem.description || splitItem.feature,
                          unit: "unit",
                          retailPrice: splitItem.total_price,
                          bulkPrice: splitItem.price_per_unit,
                          bulkMinimum: splitItem.pack_quantity,
                          store: {
                            id: "split-store",
                            name: "Split Order",
                            type: "wholesale",
                            location: { latitude: 0, longitude: 0 },
                          },
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
          const trending = trendingItems.find(
            (t) => t.product.id === product.id,
          );
          const progress = trending ? trending.percentToGoal / 100 : 0;
          const totalQuantity = trending ? trending.totalQuantity : 0;
          const pledgeCount = trending ? trending.pledgeCount : 0;
          const savings =
            ((product.retailPrice - product.bulkPrice) / product.retailPrice) *
            100;

          return (
            <TouchableOpacity
              onPress={() => router.push(`/item/${item.id}`)}
              activeOpacity={0.8}
            >
              <MetroCard
                variant={progress >= 0.8 ? "active" : "default"}
                label={
                  progress >= 1
                    ? "Ready"
                    : progress >= 0.8
                    ? "Almost"
                    : undefined
                }
                style={styles.productCard}
                showCorners={false}
              >
                <View style={styles.productHeader}>
                  <View style={styles.productInfo}>
                    <Text style={styles.productName}>{product.name}</Text>
                    <Text style={styles.productCategory}>
                      {product.category} · {product.store.name}
                    </Text>
                  </View>
                  <StatusBadge
                    label={`${savings.toFixed(0)}% off`}
                    variant="success"
                    size="sm"
                  />
                </View>

                <View style={styles.priceRow}>
                  <View style={styles.priceCompare}>
                    <View style={styles.priceItem}>
                      <Text style={styles.priceLabel}>Retail</Text>
                      <Text style={styles.retailPrice}>
                        ${product.retailPrice.toFixed(2)}
                      </Text>
                    </View>
                    <Ionicons name="arrow-forward" size={16} color={MetroColors.accent.green} />
                    <View style={styles.priceItem}>
                      <Text style={styles.priceLabel}>Bulk</Text>
                      <PriceDisplay
                        amount={product.bulkPrice}
                        size="lg"
                        variant="highlight"
                      />
                    </View>
                  </View>
                  <Text style={styles.unitText}>/{product.unit}</Text>
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
                  <ProgressBar progress={progress} height={8} showLabel />
                </View>

                <View style={styles.cardActions}>
                  <MetroButton
                    title="Details"
                    variant="ghost"
                    size="sm"
                    onPress={() => router.push(`/item/${product.id}`)}
                  />
                  <MetroButton
                    title="Add"
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
            <Ionicons name="basket-outline" size={48} color={MetroColors.text.muted} />
            <Text style={styles.emptyText}>No items found</Text>
            <Text style={styles.emptySubtext}>Try adjusting your search</Text>
          </View>
        }
      />

      {/* Cart FAB */}
      {cartTotals.items > 0 && (
        <TouchableOpacity
          style={styles.cartFab}
          activeOpacity={0.9}
          onPress={() => router.push("/(customer)/cart")}
        >
          <View style={styles.cartFabContent}>
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartTotals.items}</Text>
            </View>
            <Text style={styles.cartFabText}>View Cart</Text>
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    backgroundColor: MetroColors.background.secondary,
    ...Shadows.sm,
  },
  headerLabel: {
    color: MetroColors.accent.cyan,
    fontFamily: Fonts.body,
    fontSize: FontSizes.sm,
    fontWeight: "600",
  },
  headerTitle: {
    color: MetroColors.text.primary,
    fontFamily: Fonts.heading,
    fontSize: FontSizes['3xl'],
    fontWeight: "700",
    letterSpacing: -0.5,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing[2],
  },
  headerIconButton: {
    padding: Spacing[2],
    position: 'relative',
  },
  cartBadgeSmall: {
    position: 'absolute',
    top: 2,
    right: 0,
    backgroundColor: MetroColors.accent.cyan,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  cartBadgeSmallText: {
    color: MetroColors.text.inverse,
    fontFamily: Fonts.body,
    fontSize: 10,
    fontWeight: '700',
  },
  cutoffBox: {
    alignItems: "flex-end",
    marginLeft: Spacing[2],
    backgroundColor: MetroColors.background.tertiary,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
    borderRadius: BorderRadius.md,
  },
  timeLabel: {
    color: MetroColors.accent.navy,
    fontFamily: Fonts.body,
    fontSize: FontSizes.xs,
    fontWeight: "500",
  },
  timeValue: {
    color: MetroColors.accent.navy,
    fontFamily: Fonts.body,
    fontSize: FontSizes.md,
    fontWeight: "700",
  },
  timeRemaining: {
    color: MetroColors.accent.navy,
    fontFamily: Fonts.body,
    fontSize: FontSizes.xs,
    fontWeight: "500",
    marginTop: 2,
  },
  searchContainer: {
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    backgroundColor: MetroColors.background.primary,
  },
  searchInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: MetroColors.background.secondary,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing[4],
    ...Shadows.sm,
  },
  searchIcon: {
    marginRight: Spacing[2],
  },
  searchInput: {
    flex: 1,
    color: MetroColors.text.primary,
    fontFamily: Fonts.body,
    fontSize: FontSizes.md,
    paddingVertical: Spacing[3],
  },
  categoriesContainer: {
    paddingVertical: Spacing[2],
    backgroundColor: MetroColors.background.primary,
  },
  categoriesContent: {
    paddingHorizontal: Spacing[4],
    gap: Spacing[2],
  },
  categoryChip: {
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
    borderRadius: BorderRadius.full,
    marginRight: Spacing[2],
    backgroundColor: MetroColors.background.secondary,
    ...Shadows.sm,
  },
  categoryChipActive: {
    backgroundColor: MetroColors.accent.cyan,
  },
  categoryText: {
    color: MetroColors.text.secondary,
    fontFamily: Fonts.body,
    fontSize: FontSizes.sm,
    fontWeight: "500",
  },
  categoryTextActive: {
    color: MetroColors.text.inverse,
  },
  productsContainer: {
    padding: Spacing[4],
    paddingBottom: 100,
  },
  listSpacer: {
    height: 4,
  },
  productCard: {
    marginBottom: Spacing[3],
  },
  productHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing[3],
  },
  productInfo: {
    flex: 1,
    marginRight: Spacing[2],
  },
  productName: {
    color: MetroColors.text.primary,
    fontFamily: Fonts.heading,
    fontSize: FontSizes.lg,
    fontWeight: "600",
    marginBottom: 4,
    lineHeight: 24,
  },
  productCategory: {
    color: MetroColors.text.tertiary,
    fontFamily: Fonts.body,
    fontSize: FontSizes.sm,
    fontWeight: "500",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: Spacing[3],
  },
  priceCompare: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing[3],
  },
  priceItem: {
    gap: 2,
  },
  priceLabel: {
    color: MetroColors.text.tertiary,
    fontFamily: Fonts.body,
    fontSize: FontSizes.xs,
    fontWeight: "500",
  },
  retailPrice: {
    color: MetroColors.text.muted,
    fontFamily: Fonts.body,
    fontSize: FontSizes.md,
    textDecorationLine: "line-through",
  },
  unitText: {
    color: MetroColors.text.tertiary,
    fontFamily: Fonts.body,
    fontSize: FontSizes.sm,
    marginLeft: Spacing[1],
  },
  progressSection: {
    marginBottom: Spacing[3],
    paddingTop: Spacing[3],
    borderTopWidth: 1,
    borderTopColor: MetroColors.border.default,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing[2],
  },
  progressLabel: {
    color: MetroColors.text.secondary,
    fontFamily: Fonts.body,
    fontSize: FontSizes.sm,
    fontWeight: "500",
  },
  pledgeCount: {
    color: MetroColors.accent.purple,
    fontFamily: Fonts.body,
    fontSize: FontSizes.sm,
    fontWeight: "600",
  },
  cardActions: {
    flexDirection: "row",
    gap: Spacing[2],
    justifyContent: "flex-end",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: Spacing[16],
  },
  emptyText: {
    color: MetroColors.text.secondary,
    fontFamily: Fonts.body,
    fontSize: FontSizes.lg,
    fontWeight: "600",
    marginTop: Spacing[3],
    marginBottom: Spacing[1],
  },
  emptySubtext: {
    color: MetroColors.text.muted,
    fontFamily: Fonts.body,
    fontSize: FontSizes.sm,
  },
  cartFab: {
    position: "absolute",
    bottom: 24,
    left: Spacing[4],
    right: Spacing[4],
    backgroundColor: MetroColors.accent.cyan,
    borderRadius: BorderRadius.full,
    ...Shadows.lg,
  },
  cartFabContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing[4],
    paddingHorizontal: Spacing[5],
  },
  cartBadge: {
    backgroundColor: MetroColors.background.secondary,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[1],
    borderRadius: BorderRadius.full,
    marginRight: Spacing[3],
  },
  cartBadgeText: {
    color: MetroColors.accent.cyan,
    fontFamily: Fonts.body,
    fontSize: FontSizes.sm,
    fontWeight: "700",
  },
  cartFabText: {
    flex: 1,
    color: MetroColors.text.inverse,
    fontFamily: Fonts.body,
    fontSize: FontSizes.md,
    fontWeight: "600",
  },
  cartFabPrice: {
    color: MetroColors.text.inverse,
    fontFamily: Fonts.body,
    fontSize: FontSizes.md,
    fontWeight: "700",
  },
});
