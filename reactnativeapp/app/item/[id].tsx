/**
 * Item Detail Modal
 * Clean, warm design for product details and pledge actions
 */

import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  ConfidenceBadge,
  MetroButton,
  MetroCard,
  PriceDisplay,
  ProgressBar,
  StatusBadge,
} from '@/components/metro';
import { BorderRadius, Fonts, FontSizes, MetroColors, Shadows, Spacing } from '@/constants/theme';
import { useApp, useCart, usePledges } from '@/context/AppContext';
import { evaluateBulkBuy, getRegionalRetailPrice } from '@/services/agents';
import {
  createPledge,
  fetchBulkOrderForProduct,
  fetchProductById,
} from '@/services/api';
import {
  getSplittableItemById,
  getSplitProgress as getSplittableProgress,
  SplittableItem,
} from '@/services/splittableItems';
import { AgentDecision, BulkOrder, Product } from '@/types';

export default function ItemDetailModal() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { addToCart } = useCart();
  const { addPledge } = usePledges();
  const { user } = useApp();

  const [product, setProduct] = useState<Product | null>(null);
  const [splittableItem, setSplittableItem] = useState<SplittableItem | null>(null);
  const [bulkOrder, setBulkOrder] = useState<BulkOrder | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [agentDecision, setAgentDecision] = useState<AgentDecision | null>(null);
  const [regionalRetailPrice, setRegionalRetailPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [pledging, setPledging] = useState(false);

  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);

    const isSplittable = typeof id === 'string' && id.startsWith('split_');

    if (isSplittable) {
      const splittable = getSplittableItemById(id);
      setSplittableItem(splittable);
      setProduct(null);
      setBulkOrder(null);
    } else {
      const [productData, orderData] = await Promise.all([
        fetchProductById(id),
        fetchBulkOrderForProduct(id),
      ]);

      setProduct(productData);
      setSplittableItem(null);
      setBulkOrder(orderData);
    }

    setLoading(false);
  }, [id]);

  const fetchRegionalPrice = useCallback(async () => {
    if (product) {
      const regionalPrice = await getRegionalRetailPrice({
        productName: product.name,
        category: product.category,
        region: 'Providence, RI',
        bulkUnitPrice: product.bulkPrice,
      });
      setRegionalRetailPrice(regionalPrice.retailUnitPrice);
    } else if (splittableItem) {
      setRegionalRetailPrice(splittableItem.estimatedRetailPricePerUnit || splittableItem.price_per_unit * 1.35);
    }
  }, [product, splittableItem]);

  const runAgentAnalysis = useCallback(async () => {
    if (!product) return;

    const qty = parseInt(quantity) || 1;

    const decision = await evaluateBulkBuy({
      productId: product.id,
      productName: product.name,
      quantity: qty,
      retailPrice: product.retailPrice,
      bulkPrice: product.bulkPrice,
      bulkMinimum: product.bulkMinimum,
      currentPledgedQuantity: bulkOrder?.totalQuantity || 0,
      userLocations: [
        { latitude: 41.8236, longitude: -71.4222 },
        { latitude: 41.8198, longitude: -71.4178 },
        { latitude: 41.8156, longitude: -71.4289 },
      ],
    });

    setAgentDecision(decision);
  }, [product, quantity, bulkOrder?.totalQuantity]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (product || splittableItem) {
      fetchRegionalPrice();
    }
  }, [product, splittableItem, fetchRegionalPrice]);

  useEffect(() => {
    if (product && quantity) {
      runAgentAnalysis();
    }
  }, [product, quantity, runAgentAnalysis]);

  const handlePledge = async () => {
    if (!product) return;
    
    const qty = parseInt(quantity) || 1;
    
    Alert.alert(
      'Confirm Pledge',
      `Pledge ${qty} ${product.unit} of ${product.name}?\n\nEstimated: $${(product.bulkPrice * qty * 1.1).toFixed(2)}\nMax Hold: $${(product.retailPrice * qty).toFixed(2)}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Pledge',
          onPress: async () => {
            setPledging(true);
            const result = await createPledge(product.id, qty, user.id);
            setPledging(false);
            
            if (result.success && result.pledge) {
              addPledge(result.pledge);
              
              if ((result as any).triggered) {
                Alert.alert(
                  '🎉 Bulk Order Activated!',
                  `Your pledge pushed this order over the threshold!\n\n✅ Order is now active\n🚗 A runner can now pick it up\n📦 Check Pledges tab to track\n\nYou'll be notified when it's ready!`,
                  [{ text: 'Awesome!', onPress: () => router.back() }]
                );
              } else {
                Alert.alert(
                  'Pledge Created',
                  'Your funds have been locked. Check the Pledges tab for status.',
                  [{ text: 'OK', onPress: () => router.back() }]
                );
              }
            } else {
              Alert.alert('Error', result.error || 'Failed to create pledge');
            }
          },
        },
      ]
    );
  };

  if (loading || (!product && !splittableItem)) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const qty = parseInt(quantity) || 1;

  // Splittable item UI
  if (splittableItem) {
    const splitProgress = getSplittableProgress(splittableItem.id);
    const progress = splitProgress
      ? (splitProgress.pledgedQuantity + qty) / splittableItem.pack_quantity
      : qty / splittableItem.pack_quantity;

    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerLabel}>{splittableItem.category} · Split Order</Text>
            <Text style={styles.headerTitle}>{splittableItem.title}</Text>
            <Text style={styles.headerSubtitle}>{splittableItem.pack_quantity}-Pack Split</Text>
          </View>
          <MetroButton
            title="✕"
            variant="ghost"
            size="sm"
            onPress={() => router.back()}
          />
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          {/* Price Comparison Card */}
          <MetroCard variant="active" style={styles.priceCard}>
            <Text style={styles.sectionLabel}>Pricing</Text>

            <View style={styles.priceComparison}>
              <View style={styles.priceColumn}>
                <Text style={styles.priceType}>Retail</Text>
                <PriceDisplay
                  amount={regionalRetailPrice || splittableItem.price_per_unit * 1.35}
                  size="xl"
                  variant="muted"
                />
                <Text style={styles.unitPrice}>Regional avg/unit</Text>
              </View>

              <View style={styles.vsContainer}>
                <Ionicons name="arrow-forward" size={24} color={MetroColors.accent.green} />
              </View>

              <View style={styles.priceColumn}>
                <Text style={styles.priceType}>Bulk</Text>
                <PriceDisplay
                  amount={splittableItem.price_per_unit}
                  size="xl"
                  variant="highlight"
                />
                <Text style={styles.unitPrice}>Per unit</Text>
              </View>
            </View>

            <View style={styles.savingsBox}>
              <Text style={styles.savingsLabel}>Your Savings Per Unit</Text>
              <View style={styles.savingsRow}>
                <Text style={styles.savingsAmount}>
                  ${((regionalRetailPrice || splittableItem.price_per_unit * 1.35) - splittableItem.price_per_unit).toFixed(2)}
                </Text>
                <StatusBadge
                  label={`${((((regionalRetailPrice || splittableItem.price_per_unit * 1.35) - splittableItem.price_per_unit) / (regionalRetailPrice || splittableItem.price_per_unit * 1.35)) * 100).toFixed(0)}% off`}
                  variant="success"
                  size="sm"
                />
              </View>
            </View>
          </MetroCard>

          {/* Description */}
          <MetroCard style={styles.progressCard}>
            <Text style={styles.sectionLabel}>About</Text>
            <Text style={styles.descriptionText}>{splittableItem.description}</Text>
            {splittableItem.feature && (
              <View style={styles.featureRow}>
                <Text style={styles.featureLabel}>Features</Text>
                <Text style={styles.featureValue}>{splittableItem.feature}</Text>
              </View>
            )}
            {splittableItem.rating && (
              <View style={styles.featureRow}>
                <Text style={styles.featureLabel}>Rating</Text>
                <Text style={styles.featureValue}>{splittableItem.rating}</Text>
              </View>
            )}
          </MetroCard>

          {/* Split Progress */}
          <MetroCard style={styles.progressCard}>
            <Text style={styles.sectionLabel}>Split Progress</Text>

            <View style={styles.progressStats}>
              <View style={styles.progressStat}>
                <Text style={styles.progressStatValue}>
                  {(splitProgress?.pledgedQuantity || 0) + qty}
                </Text>
                <Text style={styles.progressStatLabel}>Pledged</Text>
              </View>
              <View style={styles.progressStat}>
                <Text style={styles.progressStatValue}>{splittableItem.pack_quantity}</Text>
                <Text style={styles.progressStatLabel}>Needed</Text>
              </View>
              <View style={styles.progressStat}>
                <Text style={[
                  styles.progressStatValue,
                  { color: progress >= 1 ? MetroColors.accent.green : MetroColors.accent.cyan }
                ]}>
                  {Math.round(progress * 100)}%
                </Text>
                <Text style={styles.progressStatLabel}>Complete</Text>
              </View>
            </View>

            <ProgressBar progress={Math.min(progress, 1)} height={10} showLabel />

            <Text style={styles.progressNote}>
              {progress >= 1
                ? 'Split complete! Order will execute at cutoff.'
                : `Need ${Math.ceil(splittableItem.pack_quantity - (splitProgress?.pledgedQuantity || 0) - qty)} more units to complete split.`
              }
            </Text>

            {splitProgress && splitProgress.participantCount > 0 && (
              <View style={styles.neighborRow}>
                <Ionicons name="people" size={16} color={MetroColors.accent.purple} />
                <Text style={styles.neighborText}>
                  {splitProgress.participantCount} neighbors already joined
                </Text>
              </View>
            )}
          </MetroCard>

          {/* Quantity Selector */}
          <MetroCard style={styles.quantityCard}>
            <Text style={styles.sectionLabel}>Select Quantity</Text>

            <View style={styles.quantityRow}>
              <MetroButton
                title="−"
                variant="secondary"
                size="md"
                onPress={() => setQuantity(String(Math.max(1, qty - 1)))}
              />
              <View style={styles.quantityInputContainer}>
                <TextInput
                  style={styles.quantityInput}
                  value={quantity}
                  onChangeText={setQuantity}
                  keyboardType="number-pad"
                  selectTextOnFocus
                />
                <Text style={styles.quantityUnit}>units</Text>
              </View>
              <MetroButton
                title="+"
                variant="secondary"
                size="md"
                onPress={() => setQuantity(String(Math.min(qty + 1, splittableItem.pack_quantity)))}
              />
            </View>
          </MetroCard>

          {/* Cost Summary */}
          <MetroCard variant="active" style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Unit Price</Text>
              <PriceDisplay
                amount={splittableItem.price_per_unit}
                size="md"
                variant="highlight"
              />
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Quantity</Text>
              <Text style={styles.summaryValue}>{qty} units</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Cost</Text>
              <PriceDisplay
                amount={splittableItem.price_per_unit * qty}
                size="lg"
                variant="highlight"
              />
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Delivery Fee (Est.)</Text>
              <Text style={styles.summaryValue}>~$2.50</Text>
            </View>
          </MetroCard>
        </ScrollView>

        {/* Bottom Actions */}
        <View style={styles.bottomActions}>
          <MetroButton
            title="Add to Cart"
            variant="primary"
            size="lg"
            onPress={() => {
              const productForCart: Product = {
                id: splittableItem.id,
                name: splittableItem.title,
                category: splittableItem.category.toLowerCase() as any,
                description: splittableItem.description || splittableItem.feature,
                unit: 'unit',
                retailPrice: splittableItem.total_price,
                bulkPrice: splittableItem.price_per_unit,
                bulkMinimum: splittableItem.pack_quantity,
                store: { id: 'split-store', name: 'Split Order', type: 'wholesale', location: { latitude: 0, longitude: 0 } },
                available: true,
              };
              addToCart(productForCart, qty);
              Alert.alert('Added to Cart', `${qty} ${qty === 1 ? 'unit' : 'units'} of ${splittableItem.title}`);
              router.back();
            }}
            style={styles.pledgeButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  // Regular product flow
  if (!product) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Item not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const progress = bulkOrder
    ? (bulkOrder.totalQuantity + qty) / product.bulkMinimum
    : qty / product.bulkMinimum;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerLabel}>{product.category}</Text>
          <Text style={styles.headerTitle}>{product.name}</Text>
          <Text style={styles.headerSubtitle}>{product.store.name}</Text>
        </View>
        <MetroButton
          title="✕"
          variant="ghost"
          size="sm"
          onPress={() => router.back()}
        />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Price Comparison Card */}
        <MetroCard variant="active" style={styles.priceCard}>
          <Text style={styles.sectionLabel}>Price Analysis</Text>

          <View style={styles.priceComparison}>
            <View style={styles.priceColumn}>
              <Text style={styles.priceType}>Retail</Text>
              <PriceDisplay
                amount={regionalRetailPrice || product.retailPrice}
                size="xl"
                variant="muted"
              />
              <Text style={styles.unitPrice}>Regional avg/{product.unit}</Text>
            </View>

            <View style={styles.vsContainer}>
              <Ionicons name="arrow-forward" size={24} color={MetroColors.accent.green} />
            </View>

            <View style={styles.priceColumn}>
              <Text style={styles.priceType}>Bulk</Text>
              <PriceDisplay
                amount={product.bulkPrice}
                size="xl"
                variant="highlight"
              />
              <Text style={styles.unitPrice}>Per {product.unit}</Text>
            </View>
          </View>

          {regionalRetailPrice && (
            <View style={styles.savingsBox}>
              <Text style={styles.savingsLabel}>Your Savings Per Unit</Text>
              <View style={styles.savingsRow}>
                <Text style={styles.savingsAmount}>
                  ${(regionalRetailPrice - product.bulkPrice).toFixed(2)}
                </Text>
                <StatusBadge
                  label={`${(((regionalRetailPrice - product.bulkPrice) / regionalRetailPrice) * 100).toFixed(0)}% off`}
                  variant="success"
                  size="sm"
                />
              </View>
            </View>
          )}
        </MetroCard>

        {/* Agent Decision Card */}
        {agentDecision && (
          <MetroCard
            variant={agentDecision.approved ? 'success' : 'warning'}
            style={styles.agentCard}
          >
            <View style={styles.agentHeader}>
              <Text style={styles.sectionLabel}>AI Analysis</Text>
              <ConfidenceBadge score={agentDecision.confidence} />
            </View>
            
            <View style={styles.agentDecision}>
              <Ionicons 
                name={agentDecision.approved ? "checkmark-circle" : "alert-circle"} 
                size={20} 
                color={agentDecision.approved ? MetroColors.accent.green : MetroColors.accent.orange} 
              />
              <Text style={[
                styles.decisionText,
                { color: agentDecision.approved ? MetroColors.accent.green : MetroColors.accent.orange }
              ]}>
                {agentDecision.approved ? 'Bulk Buy Approved' : 'Review Recommended'}
              </Text>
            </View>
            
            <Text style={styles.descriptionText}>{agentDecision.reasoning}</Text>
            
            {agentDecision.bulkSavings && (
              <View style={styles.agentStat}>
                <Text style={styles.agentStatLabel}>Estimated Bulk Savings</Text>
                <Text style={styles.agentStatValue}>
                  ${agentDecision.bulkSavings.toFixed(2)}
                </Text>
              </View>
            )}
          </MetroCard>
        )}

        {/* Bulk Progress */}
        <MetroCard style={styles.progressCard}>
          <Text style={styles.sectionLabel}>Bulk Order Progress</Text>
          
          <View style={styles.progressStats}>
            <View style={styles.progressStat}>
              <Text style={styles.progressStatValue}>
                {(bulkOrder?.totalQuantity || 0) + qty}
              </Text>
              <Text style={styles.progressStatLabel}>Pledged</Text>
            </View>
            <View style={styles.progressStat}>
              <Text style={styles.progressStatValue}>{product.bulkMinimum}</Text>
              <Text style={styles.progressStatLabel}>Needed</Text>
            </View>
            <View style={styles.progressStat}>
              <Text style={[
                styles.progressStatValue,
                { color: progress >= 1 ? MetroColors.accent.green : MetroColors.accent.cyan }
              ]}>
                {Math.round(progress * 100)}%
              </Text>
              <Text style={styles.progressStatLabel}>Complete</Text>
            </View>
          </View>
          
          <ProgressBar progress={Math.min(progress, 1)} height={10} showLabel />
          
          <Text style={styles.progressNote}>
            {progress >= 1
              ? 'Bulk minimum reached! Order will execute at cutoff.'
              : `Need ${Math.ceil(product.bulkMinimum - (bulkOrder?.totalQuantity || 0) - qty)} more ${product.unit} to reach bulk pricing.`
            }
          </Text>
        </MetroCard>

        {/* Quantity Selector */}
        <MetroCard style={styles.quantityCard}>
          <Text style={styles.sectionLabel}>Select Quantity</Text>
          
          <View style={styles.quantityRow}>
            <MetroButton
              title="−"
              variant="secondary"
              size="md"
              onPress={() => setQuantity(String(Math.max(1, qty - 1)))}
            />
            <View style={styles.quantityInputContainer}>
              <TextInput
                style={styles.quantityInput}
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="number-pad"
                selectTextOnFocus
              />
              <Text style={styles.quantityUnit}>{product.unit}</Text>
            </View>
            <MetroButton
              title="+"
              variant="secondary"
              size="md"
              onPress={() => setQuantity(String(qty + 1))}
            />
          </View>
        </MetroCard>

        {/* Cost Summary */}
        <MetroCard variant="active" style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Estimated Cost</Text>
            <PriceDisplay
              amount={product.bulkPrice * qty * 1.1}
              size="lg"
              variant="highlight"
            />
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Max Hold (Authorization)</Text>
            <PriceDisplay
              amount={product.retailPrice * qty}
              size="md"
              variant="muted"
            />
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery Fee (Est.)</Text>
            <Text style={styles.summaryValue}>~$2.50</Text>
          </View>
        </MetroCard>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <MetroButton
          title="Add to Cart"
          variant="secondary"
          size="lg"
          onPress={() => {
            addToCart(product, qty);
            Alert.alert('Added to Cart', `${qty} ${product.unit} of ${product.name}`);
          }}
          style={styles.cartButton}
        />
        <MetroButton
          title={pledging ? 'Pledging...' : 'Pledge Now'}
          variant="primary"
          size="lg"
          loading={pledging}
          onPress={handlePledge}
          style={styles.pledgeButton}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MetroColors.background.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: MetroColors.text.muted,
    fontFamily: Fonts.body,
    fontSize: FontSizes.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    backgroundColor: MetroColors.background.secondary,
    ...Shadows.sm,
  },
  headerContent: {
    flex: 1,
  },
  headerLabel: {
    color: MetroColors.accent.cyan,
    fontFamily: Fonts.body,
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
  headerTitle: {
    color: MetroColors.text.primary,
    fontFamily: Fonts.heading,
    fontSize: FontSizes['2xl'],
    fontWeight: '700',
    letterSpacing: -0.5,
    marginVertical: 4,
  },
  headerSubtitle: {
    color: MetroColors.text.tertiary,
    fontFamily: Fonts.body,
    fontSize: FontSizes.sm,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing[4],
    paddingBottom: Spacing[10],
  },
  sectionLabel: {
    color: MetroColors.text.tertiary,
    fontFamily: Fonts.body,
    fontSize: FontSizes.sm,
    fontWeight: '600',
    marginBottom: Spacing[3],
  },
  priceCard: {
    marginBottom: Spacing[3],
  },
  priceComparison: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing[4],
  },
  priceColumn: {
    flex: 1,
    alignItems: 'center',
  },
  priceType: {
    color: MetroColors.text.muted,
    fontFamily: Fonts.body,
    fontSize: FontSizes.xs,
    fontWeight: '500',
    marginBottom: Spacing[1],
  },
  unitPrice: {
    color: MetroColors.text.muted,
    fontFamily: Fonts.body,
    fontSize: FontSizes.xs,
    marginTop: Spacing[1],
  },
  vsContainer: {
    alignItems: 'center',
    paddingHorizontal: Spacing[3],
  },
  savingsBox: {
    backgroundColor: MetroColors.accent.greenMuted,
    padding: Spacing[4],
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  savingsLabel: {
    color: MetroColors.accent.green,
    fontFamily: Fonts.body,
    fontSize: FontSizes.sm,
    fontWeight: '500',
    marginBottom: Spacing[1],
  },
  savingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
  },
  savingsAmount: {
    color: MetroColors.accent.green,
    fontFamily: Fonts.body,
    fontSize: FontSizes['3xl'],
    fontWeight: '700',
  },
  agentCard: {
    marginBottom: Spacing[3],
  },
  agentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing[3],
  },
  agentDecision: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing[3],
    gap: Spacing[2],
  },
  decisionText: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  descriptionText: {
    color: MetroColors.text.secondary,
    fontFamily: Fonts.body,
    fontSize: FontSizes.sm,
    lineHeight: 20,
    marginBottom: Spacing[3],
  },
  featureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing[3],
    borderTopWidth: 1,
    borderTopColor: MetroColors.border.default,
    marginTop: Spacing[2],
  },
  featureLabel: {
    color: MetroColors.text.tertiary,
    fontFamily: Fonts.body,
    fontSize: FontSizes.sm,
    fontWeight: '500',
  },
  featureValue: {
    color: MetroColors.text.secondary,
    fontFamily: Fonts.body,
    fontSize: FontSizes.sm,
    fontWeight: '500',
  },
  agentStat: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing[3],
    borderTopWidth: 1,
    borderTopColor: MetroColors.border.default,
  },
  agentStatLabel: {
    color: MetroColors.text.tertiary,
    fontFamily: Fonts.body,
    fontSize: FontSizes.sm,
    fontWeight: '500',
  },
  agentStatValue: {
    color: MetroColors.accent.green,
    fontFamily: Fonts.body,
    fontSize: FontSizes.xl,
    fontWeight: '700',
  },
  progressCard: {
    marginBottom: Spacing[3],
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing[3],
  },
  progressStat: {
    alignItems: 'center',
  },
  progressStatValue: {
    color: MetroColors.text.primary,
    fontFamily: Fonts.body,
    fontSize: FontSizes.xl,
    fontWeight: '700',
  },
  progressStatLabel: {
    color: MetroColors.text.tertiary,
    fontFamily: Fonts.body,
    fontSize: FontSizes.xs,
    fontWeight: '500',
  },
  progressNote: {
    color: MetroColors.text.secondary,
    fontFamily: Fonts.body,
    fontSize: FontSizes.sm,
    marginTop: Spacing[3],
    textAlign: 'center',
  },
  neighborRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
    marginTop: Spacing[2],
  },
  neighborText: {
    color: MetroColors.accent.purple,
    fontFamily: Fonts.body,
    fontSize: FontSizes.sm,
    fontWeight: '500',
  },
  quantityCard: {
    marginBottom: Spacing[3],
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[3],
  },
  quantityInputContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: MetroColors.background.tertiary,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
    borderRadius: BorderRadius.md,
  },
  quantityInput: {
    color: MetroColors.accent.cyan,
    fontFamily: Fonts.body,
    fontSize: FontSizes.xl,
    fontWeight: '700',
    minWidth: 60,
    textAlign: 'center',
  },
  quantityUnit: {
    color: MetroColors.text.muted,
    fontFamily: Fonts.body,
    fontSize: FontSizes.sm,
    marginLeft: Spacing[1],
  },
  summaryCard: {
    marginBottom: Spacing[3],
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing[2],
  },
  summaryLabel: {
    color: MetroColors.text.secondary,
    fontFamily: Fonts.body,
    fontSize: FontSizes.sm,
    fontWeight: '500',
  },
  summaryValue: {
    color: MetroColors.text.primary,
    fontFamily: Fonts.body,
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: MetroColors.border.default,
    marginVertical: Spacing[3],
  },
  bottomActions: {
    flexDirection: 'row',
    padding: Spacing[4],
    paddingBottom: Spacing[6],
    borderTopWidth: 1,
    borderTopColor: MetroColors.border.default,
    backgroundColor: MetroColors.background.secondary,
    gap: Spacing[3],
  },
  cartButton: {
    flex: 1,
  },
  pledgeButton: {
    flex: 2,
  },
});
