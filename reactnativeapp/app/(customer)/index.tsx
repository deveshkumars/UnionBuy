/**
 * Market Screen - Customer Home
 * Trading floor style with trending items and bulk buy opportunities
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  MetroCard,
  MetroButton,
  PriceDisplay,
  ProgressBar,
  StatusBadge,
  DataTicker,
  InfoBar,
} from '@/components/metro';
import { MetroColors, FontSizes, Fonts, Spacing, Shadows } from '@/constants/theme';
import { useCart } from '@/context/AppContext';
import { fetchTrendingItems, fetchProducts, searchProducts } from '@/services/api';
import { TrendingItem, Product } from '@/types';

export default function MarketScreen() {
  const router = useRouter();
  const { addToCart, getCartTotal } = useCart();
  
  const [trendingItems, setTrendingItems] = useState<TrendingItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = ['grains', 'pantry', 'dairy', 'meat', 'produce', 'household'];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [trending, allProducts] = await Promise.all([
      fetchTrendingItems(),
      fetchProducts(),
    ]);
    setTrendingItems(trending);
    setProducts(allProducts);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length > 2) {
      const results = await searchProducts(query);
      setProducts(results);
    } else if (query.length === 0) {
      const allProducts = await fetchProducts();
      setProducts(allProducts);
    }
  };

  const filteredProducts = selectedCategory
    ? products.filter((p) => p.category === selectedCategory)
    : products;

  const cartTotals = getCartTotal();

  // Ticker data
  const tickerData = trendingItems.map((item) => ({
    id: item.product.id,
    name: item.product.name,
    value: `$${item.product.bulkPrice.toFixed(2)}`,
    change: item.trending === 'up' ? 12.5 : item.trending === 'down' ? -8.3 : 0,
    suffix: `/${item.product.unit}`,
  }));

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerLabel}>METROPOLIS</Text>
          <Text style={styles.headerTitle}>BULK MARKET</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.timeLabel}>CUTOFF</Text>
          <Text style={styles.timeValue}>18:00</Text>
        </View>
      </View>

      {/* Trending Ticker */}
      <DataTicker items={tickerData} speed={40} height={44} />

      {/* Info Bar */}
      <InfoBar
        items={[
          { label: 'ACTIVE', value: trendingItems.length, highlight: true },
          { label: 'NEIGHBORS', value: 127 },
          { label: 'SAVED', value: '$2.8K' },
        ]}
      />

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <Text style={styles.searchIcon}>⌕</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="SEARCH ITEMS..."
            placeholderTextColor={MetroColors.text.muted}
            value={searchQuery}
            onChangeText={handleSearch}
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <Text style={styles.clearIcon}>✕</Text>
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

      {/* Products List */}
      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        numColumns={1}
        contentContainerStyle={styles.productsContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={MetroColors.accent.cyan}
          />
        }
        renderItem={({ item }) => {
          const trending = trendingItems.find((t) => t.product.id === item.id);
          const progress = trending ? trending.percentToGoal / 100 : 0;
          const savings = ((item.retailPrice - item.bulkPrice) / item.retailPrice) * 100;

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
                    <Text style={styles.productName}>{item.name}</Text>
                    <Text style={styles.productCategory}>
                      {item.category.toUpperCase()} • {item.store.name}
                    </Text>
                  </View>
                  <StatusBadge
                    label={`-${savings.toFixed(0)}%`}
                    variant="success"
                    size="sm"
                  />
                </View>

                <View style={styles.priceRow}>
                  <View style={styles.priceCompare}>
                    <View style={styles.priceItem}>
                      <Text style={styles.priceLabel}>RETAIL</Text>
                      <Text style={styles.retailPrice}>
                        ${item.retailPrice.toFixed(2)}
                      </Text>
                    </View>
                    <Text style={styles.priceArrow}>→</Text>
                    <View style={styles.priceItem}>
                      <Text style={styles.priceLabel}>BULK</Text>
                      <PriceDisplay
                        amount={item.bulkPrice}
                        size="lg"
                        variant="highlight"
                      />
                    </View>
                  </View>
                  <Text style={styles.unitText}>/{item.unit}</Text>
                </View>

                {trending && (
                  <View style={styles.progressSection}>
                    <View style={styles.progressHeader}>
                      <Text style={styles.progressLabel}>
                        {trending.totalQuantity}/{item.bulkMinimum} {item.unit} pledged
                      </Text>
                      <Text style={styles.pledgeCount}>
                        {trending.pledgeCount} neighbors
                      </Text>
                    </View>
                    <ProgressBar progress={progress} height={8} showLabel />
                  </View>
                )}

                <View style={styles.cardActions}>
                  <MetroButton
                    title="VIEW DETAILS"
                    variant="ghost"
                    size="sm"
                    onPress={() => router.push(`/item/${item.id}`)}
                  />
                  <MetroButton
                    title="+ ADD"
                    variant="primary"
                    size="sm"
                    onPress={() => addToCart(item, 1)}
                  />
                </View>
              </MetroCard>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>◇</Text>
            <Text style={styles.emptyText}>NO ITEMS FOUND</Text>
            <Text style={styles.emptySubtext}>Try adjusting your search</Text>
          </View>
        }
      />

      {/* Cart FAB */}
      {cartTotals.items > 0 && (
        <TouchableOpacity style={styles.cartFab} activeOpacity={0.9}>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: MetroColors.border.muted,
  },
  headerLabel: {
    color: MetroColors.text.muted,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.xs,
    letterSpacing: 2,
  },
  headerTitle: {
    color: MetroColors.text.primary,
    fontFamily: Fonts.sans,
    fontSize: FontSizes['2xl'],
    fontWeight: '700',
    letterSpacing: 1,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  timeLabel: {
    color: MetroColors.text.muted,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.xs,
    letterSpacing: 1,
  },
  timeValue: {
    color: MetroColors.accent.orange,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.lg,
    fontWeight: '700',
  },
  searchContainer: {
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MetroColors.background.secondary,
    borderWidth: 1,
    borderColor: MetroColors.border.default,
    borderRadius: 4,
    paddingHorizontal: Spacing[3],
  },
  searchIcon: {
    color: MetroColors.text.muted,
    fontSize: FontSizes.lg,
    marginRight: Spacing[2],
  },
  searchInput: {
    flex: 1,
    color: MetroColors.text.primary,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.sm,
    paddingVertical: Spacing[3],
    letterSpacing: 0.5,
  },
  clearIcon: {
    color: MetroColors.text.muted,
    fontSize: FontSizes.md,
    padding: Spacing[2],
  },
  categoriesContainer: {
    maxHeight: 44,
    borderBottomWidth: 1,
    borderBottomColor: MetroColors.border.muted,
  },
  categoriesContent: {
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
    gap: Spacing[2],
  },
  categoryChip: {
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[1],
    borderWidth: 1,
    borderColor: MetroColors.border.default,
    borderRadius: 2,
    marginRight: Spacing[2],
  },
  categoryChipActive: {
    borderColor: MetroColors.accent.cyan,
    backgroundColor: MetroColors.accent.cyanMuted,
  },
  categoryText: {
    color: MetroColors.text.tertiary,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.xs,
    letterSpacing: 1,
  },
  categoryTextActive: {
    color: MetroColors.accent.cyan,
  },
  productsContainer: {
    padding: Spacing[4],
    paddingBottom: 100,
  },
  productCard: {
    marginBottom: Spacing[3],
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing[3],
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    color: MetroColors.text.primary,
    fontFamily: Fonts.sans,
    fontSize: FontSizes.lg,
    fontWeight: '600',
    marginBottom: 2,
  },
  productCategory: {
    color: MetroColors.text.muted,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.xs,
    letterSpacing: 0.5,
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
    gap: 2,
  },
  priceLabel: {
    color: MetroColors.text.muted,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.xs,
    letterSpacing: 0.5,
  },
  retailPrice: {
    color: MetroColors.text.tertiary,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.lg,
    textDecorationLine: 'line-through',
  },
  priceArrow: {
    color: MetroColors.accent.cyan,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.lg,
  },
  unitText: {
    color: MetroColors.text.muted,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.sm,
    marginLeft: Spacing[1],
  },
  progressSection: {
    marginBottom: Spacing[3],
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing[2],
  },
  progressLabel: {
    color: MetroColors.text.secondary,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.xs,
  },
  pledgeCount: {
    color: MetroColors.text.muted,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.xs,
  },
  cardActions: {
    flexDirection: 'row',
    gap: Spacing[2],
    justifyContent: 'flex-end',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing[16],
  },
  emptyIcon: {
    fontSize: 48,
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
    bottom: 100,
    left: Spacing[4],
    right: Spacing[4],
    backgroundColor: MetroColors.accent.cyan,
    borderRadius: 4,
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

