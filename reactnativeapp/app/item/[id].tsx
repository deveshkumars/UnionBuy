/**
 * Item Detail Modal
 * Product details with agent comparison, confidence score, and pledge actions
 */

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
import { Fonts, FontSizes, MetroColors, Spacing } from '@/constants/theme';
import { useApp, useCart, usePledges } from '@/context/AppContext';
import { comparePrices, evaluateBulkBuy } from '@/services/agents';
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
import { AgentDecision, BulkOrder, PriceComparison, Product } from '@/types';

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
  const [priceComparison, setPriceComparison] = useState<PriceComparison | null>(null);
  const [agentDecision, setAgentDecision] = useState<AgentDecision | null>(null);
  const [loading, setLoading] = useState(true);
  const [pledging, setPledging] = useState(false);

  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);

    // Check if this is a splittable item (ID starts with "split_")
    const isSplittable = typeof id === 'string' && id.startsWith('split_');

    if (isSplittable) {
      // Load splittable item
      const splittable = getSplittableItemById(id);
      setSplittableItem(splittable);
      setProduct(null);
      setBulkOrder(null);
    } else {
      // Load regular product
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

  const runAgentAnalysis = useCallback(async () => {
    if (!product) return;
    
    const qty = parseInt(quantity) || 1;
    
    const [comparison, decision] = await Promise.all([
      comparePrices(product, qty),
      evaluateBulkBuy({
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
      }),
    ]);
    
    setPriceComparison(comparison);
    setAgentDecision(decision);
  }, [product, quantity, bulkOrder?.totalQuantity]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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
              
              // ⚡ Check if this pledge triggered the bulk order!
              if ((result as any).triggered) {
                Alert.alert(
                  '🎉 BULK ORDER ACTIVATED!',
                  `Your pledge pushed this order over the threshold!\n\n` +
                  `✅ Order is now ACTIVE\n` +
                  `🚗 A runner can now pick it up\n` +
                  `📦 Check Pledges tab to see your order "In Action"\n\n` +
                  `You'll be notified when it's ready for pickup!`,
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
          <Text style={styles.loadingText}>LOADING...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const qty = parseInt(quantity) || 1;

  // If this is a splittable item, render different UI
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
            <Text style={styles.headerLabel}>{splittableItem.category.toUpperCase()} • SPLIT ORDER</Text>
            <Text style={styles.headerTitle}>{splittableItem.title}</Text>
            <Text style={styles.headerSubtitle}>{splittableItem.pack_quantity}-Pack Split</Text>
          </View>
          <MetroButton
            title="X"
            variant="ghost"
            size="sm"
            onPress={() => router.back()}
          />
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          {/* Price Comparison Card */}
          <MetroCard variant="active" style={styles.priceCard}>
            <Text style={styles.sectionLabel}>PRICING</Text>

            <View style={styles.priceComparison}>
              <View style={styles.priceColumn}>
                <Text style={styles.priceType}>TOTAL PACK</Text>
                <PriceDisplay
                  amount={splittableItem.total_price}
                  size="xl"
                  variant="muted"
                />
                <Text style={styles.unitPrice}>
                  {splittableItem.pack_quantity} units
                </Text>
              </View>

              <View style={styles.vsContainer}>
                <Text style={styles.vsText}>÷</Text>
                <View style={styles.savingsArrow}>
                  <Text style={styles.arrowText}>{'->'}</Text>
                </View>
              </View>

              <View style={styles.priceColumn}>
                <Text style={styles.priceType}>PER UNIT</Text>
                <PriceDisplay
                  amount={splittableItem.price_per_unit}
                  size="xl"
                  variant="highlight"
                />
                <Text style={styles.unitPrice}>
                  per item
                </Text>
              </View>
            </View>

            <View style={styles.savingsBox}>
              <Text style={styles.savingsLabel}>YOUR COST ({qty} {qty === 1 ? 'UNIT' : 'UNITS'})</Text>
              <View style={styles.savingsRow}>
                <Text style={styles.savingsAmount}>
                  ${(splittableItem.price_per_unit * qty).toFixed(2)}
                </Text>
              </View>
            </View>
          </MetroCard>

          {/* Description */}
          <MetroCard style={styles.progressCard}>
            <Text style={styles.sectionLabel}>ABOUT</Text>
            <Text style={styles.agentReasoning}>{splittableItem.description}</Text>
            {splittableItem.feature && (
              <View style={styles.agentStat}>
                <Text style={styles.agentStatLabel}>FEATURES</Text>
                <Text style={styles.progressNote}>{splittableItem.feature}</Text>
              </View>
            )}
            {splittableItem.rating && (
              <View style={styles.agentStat}>
                <Text style={styles.agentStatLabel}>RATING</Text>
                <Text style={styles.progressNote}>{splittableItem.rating}</Text>
              </View>
            )}
          </MetroCard>

          {/* Split Progress */}
          <MetroCard style={styles.progressCard}>
            <Text style={styles.sectionLabel}>SPLIT ORDER PROGRESS</Text>

            <View style={styles.progressStats}>
              <View style={styles.progressStat}>
                <Text style={styles.progressStatValue}>
                  {(splitProgress?.pledgedQuantity || 0) + qty}
                </Text>
                <Text style={styles.progressStatLabel}>PLEDGED</Text>
              </View>
              <View style={styles.progressStat}>
                <Text style={styles.progressStatValue}>{splittableItem.pack_quantity}</Text>
                <Text style={styles.progressStatLabel}>NEEDED</Text>
              </View>
              <View style={styles.progressStat}>
                <Text style={[
                  styles.progressStatValue,
                  { color: progress >= 1 ? MetroColors.accent.green : MetroColors.accent.cyan }
                ]}>
                  {Math.round(progress * 100)}%
                </Text>
                <Text style={styles.progressStatLabel}>COMPLETE</Text>
              </View>
            </View>

            <ProgressBar progress={Math.min(progress, 1)} height={12} showLabel />

            <Text style={styles.progressNote}>
              {progress >= 1
                ? 'Split complete! Order will execute at cutoff.'
                : `Need ${Math.ceil(splittableItem.pack_quantity - (splitProgress?.pledgedQuantity || 0) - qty)} more units to complete split.`
              }
            </Text>

            {splitProgress && splitProgress.participantCount > 0 && (
              <Text style={styles.progressNote}>
                {splitProgress.participantCount} neighbors already joined
              </Text>
            )}
          </MetroCard>

          {/* Quantity Selector */}
          <MetroCard style={styles.quantityCard}>
            <Text style={styles.sectionLabel}>SELECT QUANTITY</Text>

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

            <View style={styles.quickQuantities}>
              {[1, 2, 3, 4].map((q) => (
                <MetroButton
                  key={q}
                  title={`${q}`}
                  variant={qty === q ? 'primary' : 'ghost'}
                  size="sm"
                  onPress={() => setQuantity(String(q))}
                />
              ))}
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
              <Text style={styles.summaryLabel}>Delivery Fee Estimate</Text>
              <Text style={styles.summaryValue}>~$2.50</Text>
            </View>
          </MetroCard>
        </ScrollView>

        {/* Bottom Actions */}
        <View style={styles.bottomActions}>
          <MetroButton
            title="ADD TO CART"
            variant="primary"
            size="lg"
            onPress={() => {
              // Convert splittable item to Product format for cart
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
          <Text style={styles.loadingText}>ITEM NOT FOUND</Text>
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
          <Text style={styles.headerLabel}>{product.category.toUpperCase()}</Text>
          <Text style={styles.headerTitle}>{product.name}</Text>
          <Text style={styles.headerSubtitle}>{product.store.name}</Text>
        </View>
        <MetroButton
          title="X"
          variant="ghost"
          size="sm"
          onPress={() => router.back()}
        />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Price Comparison Card */}
        <MetroCard variant="active" style={styles.priceCard}>
          <Text style={styles.sectionLabel}>PRICE ANALYSIS</Text>
          
          <View style={styles.priceComparison}>
            <View style={styles.priceColumn}>
              <Text style={styles.priceType}>RETAIL</Text>
              <PriceDisplay
                amount={product.retailPrice * qty}
                size="xl"
                variant="muted"
              />
              <Text style={styles.unitPrice}>
                ${product.retailPrice.toFixed(2)}/{product.unit}
              </Text>
            </View>
            
            <View style={styles.vsContainer}>
              <Text style={styles.vsText}>VS</Text>
              <View style={styles.savingsArrow}>
                <Text style={styles.arrowText}>{'->'}</Text>
              </View>
            </View>
            
            <View style={styles.priceColumn}>
              <Text style={styles.priceType}>BULK</Text>
              <PriceDisplay
                amount={product.bulkPrice * qty}
                size="xl"
                variant="highlight"
              />
              <Text style={styles.unitPrice}>
                ${product.bulkPrice.toFixed(2)}/{product.unit}
              </Text>
            </View>
          </View>

          {priceComparison && (
            <View style={styles.savingsBox}>
              <Text style={styles.savingsLabel}>YOUR SAVINGS</Text>
              <View style={styles.savingsRow}>
                <Text style={styles.savingsAmount}>
                  ${priceComparison.savings.toFixed(2)}
                </Text>
                <StatusBadge
                  label={`${priceComparison.savingsPercent.toFixed(0)}% OFF`}
                  variant="success"
                  size="md"
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
              <Text style={styles.sectionLabel}>AI AGENT ANALYSIS</Text>
              <ConfidenceBadge score={agentDecision.confidence} />
            </View>
            
            <View style={styles.agentDecision}>
              <View style={[
                styles.decisionIndicator,
                { backgroundColor: agentDecision.approved
                  ? MetroColors.accent.green
                  : MetroColors.accent.orange
                }
              ]} />
              <Text style={[
                styles.decisionText,
                { color: agentDecision.approved
                  ? MetroColors.accent.green
                  : MetroColors.accent.orange
                }
              ]}>
                {agentDecision.approved ? 'BULK BUY APPROVED' : 'REVIEW RECOMMENDED'}
              </Text>
            </View>
            
            <Text style={styles.agentReasoning}>{agentDecision.reasoning}</Text>
            
            {agentDecision.bulkSavings && (
              <View style={styles.agentStat}>
                <Text style={styles.agentStatLabel}>ESTIMATED BULK SAVINGS</Text>
                <Text style={styles.agentStatValue}>
                  ${agentDecision.bulkSavings.toFixed(2)}
                </Text>
              </View>
            )}
          </MetroCard>
        )}

        {/* Bulk Progress */}
        <MetroCard style={styles.progressCard}>
          <Text style={styles.sectionLabel}>BULK ORDER PROGRESS</Text>
          
          <View style={styles.progressStats}>
            <View style={styles.progressStat}>
              <Text style={styles.progressStatValue}>
                {(bulkOrder?.totalQuantity || 0) + qty}
              </Text>
              <Text style={styles.progressStatLabel}>PLEDGED</Text>
            </View>
            <View style={styles.progressStat}>
              <Text style={styles.progressStatValue}>{product.bulkMinimum}</Text>
              <Text style={styles.progressStatLabel}>NEEDED</Text>
            </View>
            <View style={styles.progressStat}>
              <Text style={[
                styles.progressStatValue,
                { color: progress >= 1 ? MetroColors.accent.green : MetroColors.accent.cyan }
              ]}>
                {Math.round(progress * 100)}%
              </Text>
              <Text style={styles.progressStatLabel}>COMPLETE</Text>
            </View>
          </View>
          
          <ProgressBar progress={Math.min(progress, 1)} height={12} showLabel />
          
          <Text style={styles.progressNote}>
            {progress >= 1
              ? 'Bulk minimum reached! Order will execute at cutoff.'
              : `Need ${Math.ceil(product.bulkMinimum - (bulkOrder?.totalQuantity || 0) - qty)} more ${product.unit} to reach bulk pricing.`
            }
          </Text>
        </MetroCard>

        {/* Quantity Selector */}
        <MetroCard style={styles.quantityCard}>
          <Text style={styles.sectionLabel}>SELECT QUANTITY</Text>
          
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
          
          <View style={styles.quickQuantities}>
            {[5, 10, 15, 20].map((q) => (
              <MetroButton
                key={q}
                title={`${q}`}
                variant={qty === q ? 'primary' : 'ghost'}
                size="sm"
                onPress={() => setQuantity(String(q))}
              />
            ))}
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
            <Text style={styles.summaryLabel}>Delivery Fee Estimate</Text>
            <Text style={styles.summaryValue}>~$2.50</Text>
          </View>
        </MetroCard>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <MetroButton
          title="ADD TO CART"
          variant="secondary"
          size="lg"
          onPress={() => {
            addToCart(product, qty);
            Alert.alert('Added to Cart', `${qty} ${product.unit} of ${product.name}`);
          }}
          style={styles.cartButton}
        />
        <MetroButton
          title={pledging ? 'PLEDGING...' : 'PLEDGE NOW'}
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
    fontFamily: Fonts.mono,
    fontSize: FontSizes.md,
    letterSpacing: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: MetroColors.border.muted,
  },
  headerContent: {
    flex: 1,
  },
  headerLabel: {
    color: MetroColors.accent.cyan,
    fontFamily: Fonts.sansBold,
    fontSize: FontSizes.sm,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  headerTitle: {
    color: MetroColors.text.primary,
    fontFamily: Fonts.heading,
    fontSize: FontSizes['3xl'],
    fontWeight: '800',
    marginVertical: 4,
  },
  headerSubtitle: {
    color: MetroColors.text.secondary,
    fontFamily: Fonts.sans,
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing[4],
    paddingBottom: Spacing[10],
  },
  sectionLabel: {
    color: MetroColors.text.secondary,
    fontFamily: Fonts.sansBold,
    fontSize: FontSizes.sm,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: Spacing[3],
  },
  priceCard: {
    marginBottom: Spacing[4],
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
    fontFamily: Fonts.mono,
    fontSize: FontSizes.xs,
    letterSpacing: 1,
    marginBottom: Spacing[1],
  },
  unitPrice: {
    color: MetroColors.text.tertiary,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.xs,
    marginTop: Spacing[1],
  },
  vsContainer: {
    alignItems: 'center',
    paddingHorizontal: Spacing[3],
  },
  vsText: {
    color: MetroColors.text.muted,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.xs,
  },
  savingsArrow: {
    marginTop: Spacing[1],
  },
  arrowText: {
    color: MetroColors.accent.green,
    fontSize: 24,
  },
  savingsBox: {
    backgroundColor: MetroColors.accent.greenMuted,
    padding: Spacing[3],
    borderRadius: 2,
    alignItems: 'center',
  },
  savingsLabel: {
    color: MetroColors.accent.green,
    fontFamily: Fonts.sansBold,
    fontSize: FontSizes.sm,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: Spacing[1],
  },
  savingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
  },
  savingsAmount: {
    color: MetroColors.accent.green,
    fontFamily: Fonts.heading,
    fontSize: FontSizes['4xl'],
    fontWeight: '800',
  },
  agentCard: {
    marginBottom: Spacing[4],
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
  },
  decisionIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: Spacing[2],
  },
  decisionText: {
    fontFamily: Fonts.mono,
    fontSize: FontSizes.md,
    fontWeight: '700',
    letterSpacing: 1,
  },
  agentReasoning: {
    color: MetroColors.text.secondary,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.sm,
    lineHeight: 20,
    marginBottom: Spacing[3],
  },
  agentStat: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing[3],
    borderTopWidth: 1,
    borderTopColor: MetroColors.border.muted,
  },
  agentStatLabel: {
    color: MetroColors.text.secondary,
    fontFamily: Fonts.sansBold,
    fontSize: FontSizes.sm,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  agentStatValue: {
    color: MetroColors.accent.green,
    fontFamily: Fonts.heading,
    fontSize: FontSizes.xl,
    fontWeight: '800',
  },
  progressCard: {
    marginBottom: Spacing[4],
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
    fontFamily: Fonts.heading,
    fontSize: FontSizes['2xl'],
    fontWeight: '800',
  },
  progressStatLabel: {
    color: MetroColors.text.secondary,
    fontFamily: Fonts.sansBold,
    fontSize: FontSizes.sm,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  progressNote: {
    color: MetroColors.text.secondary,
    fontFamily: Fonts.sans,
    fontSize: FontSizes.sm,
    marginTop: Spacing[3],
    textAlign: 'center',
    fontWeight: '500',
  },
  quantityCard: {
    marginBottom: Spacing[4],
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[3],
    marginBottom: Spacing[3],
  },
  quantityInputContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: MetroColors.background.tertiary,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
    borderRadius: 2,
    borderWidth: 1,
    borderColor: MetroColors.border.default,
  },
  quantityInput: {
    color: MetroColors.accent.cyan,
    fontFamily: Fonts.mono,
    fontSize: FontSizes['2xl'],
    fontWeight: '700',
    minWidth: 60,
    textAlign: 'center',
  },
  quantityUnit: {
    color: MetroColors.text.muted,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.md,
    marginLeft: Spacing[1],
  },
  quickQuantities: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing[2],
  },
  summaryCard: {
    marginBottom: Spacing[4],
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing[2],
  },
  summaryLabel: {
    color: MetroColors.text.secondary,
    fontFamily: Fonts.sans,
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  summaryValue: {
    color: MetroColors.text.primary,
    fontFamily: Fonts.heading,
    fontSize: FontSizes.lg,
    fontWeight: '600',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: MetroColors.border.muted,
    marginVertical: Spacing[3],
  },
  bottomActions: {
    flexDirection: 'row',
    padding: Spacing[4],
    paddingBottom: Spacing[6],
    borderTopWidth: 1,
    borderTopColor: MetroColors.border.muted,
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
