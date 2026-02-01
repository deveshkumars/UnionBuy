/**
 * Cart Screen - Light Metro
 * Shows items added from Market with quick adjust controls.
 * Creates pledges in DynamoDB when user pledges items.
 */

import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MetroButton, MetroCard, PriceDisplay, StatusBadge } from '@/components/metro';
import { FontSizes, Fonts, MetroColors, Spacing } from '@/constants/theme';
import { useApp, useCart, usePledges } from '@/context/AppContext';
import { createPledge } from '@/services/api';
import { Product } from '@/types';

export default function CartScreen() {
  const router = useRouter();
  const { cart, updateCartQuantity, removeFromCart, clearCart, getCartTotal } = useCart();
  const { addPledge } = usePledges();
  const { user } = useApp();
  const totals = getCartTotal();
  const [pledgingItem, setPledgingItem] = useState<string | null>(null);
  const [pledgingAll, setPledgingAll] = useState(false);

  // Pledge a single item
  const handlePledgeItem = async (product: Product, quantity: number) => {
    setPledgingItem(product.id);
    try {
      // Pass product data so custom items can be created in backend if needed
      const result = await createPledge(product.id, quantity, user.id, product);
      if (result.success && result.pledge) {
        addPledge(result.pledge);
        removeFromCart(product.id);
        Alert.alert(
          'Pledge Created!',
          `Successfully pledged ${quantity} ${product.unit} of ${product.name}.\n\nEstimated: $${result.pledge.totalAmount.toFixed(2)}\nMax Hold: $${result.pledge.maxAmount.toFixed(2)}`,
          [{ text: 'View Pledges', onPress: () => router.push('/(customer)/pledges') }, { text: 'OK' }]
        );
      } else {
        Alert.alert('Pledge Failed', result.error || 'Could not create pledge. Please try again.');
      }
    } catch (e) {
      Alert.alert('Error', 'An unexpected error occurred while creating the pledge.');
      console.error('[Cart] Pledge error:', e);
    } finally {
      setPledgingItem(null);
    }
  };

  // Pledge all items in cart
  const handleCheckout = async () => {
    if (cart.length === 0) return;

    Alert.alert(
      'Pledge All Items',
      `This will create pledges for ${totals.items} items totaling ~$${totals.estimate.toFixed(2)}.\n\nYour funds will be held until the bulk order completes.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Pledge All',
          onPress: async () => {
            setPledgingAll(true);
            let successCount = 0;
            let failCount = 0;
            const pledgedItems: string[] = [];

            for (const { product, quantity } of cart) {
              try {
                // Pass product data so custom items can be created in backend if needed
                const result = await createPledge(product.id, quantity, user.id, product);
                if (result.success && result.pledge) {
                  addPledge(result.pledge);
                  pledgedItems.push(product.id);
                  successCount++;
                } else {
                  failCount++;
                }
              } catch {
                failCount++;
              }
            }

            // Remove pledged items from cart
            pledgedItems.forEach((id) => removeFromCart(id));
            setPledgingAll(false);

            if (failCount === 0) {
              Alert.alert(
                'All Pledges Created!',
                `Successfully created ${successCount} pledges.`,
                [{ text: 'View Pledges', onPress: () => router.push('/(customer)/pledges') }, { text: 'OK' }]
              );
            } else {
              Alert.alert(
                'Partial Success',
                `Created ${successCount} pledges, ${failCount} failed.\nFailed items remain in cart.`
              );
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerLabel}>UNION BUY</Text>
          <Text style={styles.headerTitle}>Cart</Text>
        </View>
        <View style={styles.headerActions}>
          {cart.length > 0 && (
            <TouchableOpacity onPress={() => clearCart()}>
              <Text style={styles.clearAll}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {cart.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>[]</Text>
          <Text style={styles.emptyText}>Cart is empty</Text>
          <Text style={styles.emptySubtext}>Add items from the Market to start.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {cart.map(({ product, quantity }) => (
            <MetroCard key={product.id} style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{product.name}</Text>
                  <Text style={styles.itemMeta}>
                    {product.category.toUpperCase()} • {product.store.name}
                  </Text>
                </View>
                <StatusBadge label={`${product.bulkPrice.toFixed(2)}/${product.unit}`} variant="info" size="sm" />
              </View>

              <View style={styles.row}>
                <View style={styles.qtyPill}>
                  <TouchableOpacity
                    style={styles.qtyButton}
                    onPress={() => updateCartQuantity(product.id, quantity - 1)}
                  >
                    <Text style={styles.qtySymbol}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.qtyValue}>{quantity}</Text>
                  <TouchableOpacity
                    style={styles.qtyButton}
                    onPress={() => updateCartQuantity(product.id, quantity + 1)}
                  >
                    <Text style={styles.qtySymbol}>+</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.priceBlock}>
                  <Text style={styles.label}>Est.</Text>
                  <PriceDisplay amount={product.bulkPrice * quantity * 1.1} size="md" variant="highlight" />
                </View>
                <View style={styles.priceBlock}>
                  <Text style={styles.label}>Max Hold</Text>
                  <PriceDisplay amount={product.retailPrice * quantity} size="sm" variant="muted" />
                </View>
              </View>

              <View style={styles.itemFooter}>
                <Text style={styles.savings}>Save ~${((product.retailPrice - product.bulkPrice) * quantity).toFixed(2)}</Text>
                <View style={styles.itemActions}>
                  {pledgingItem === product.id ? (
                    <ActivityIndicator size="small" color={MetroColors.accent.cyan} />
                  ) : (
                    <MetroButton
                      title="Pledge"
                      variant="secondary"
                      size="sm"
                      onPress={() => handlePledgeItem(product, quantity)}
                      disabled={pledgingAll}
                    />
                  )}
                  <TouchableOpacity onPress={() => removeFromCart(product.id)} disabled={pledgingItem === product.id || pledgingAll}>
                    <Text style={[styles.remove, (pledgingItem === product.id || pledgingAll) && styles.disabled]}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </MetroCard>
          ))}
        </ScrollView>
      )}

      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <View>
            <Text style={styles.totalLabel}>Estimated</Text>
            <Text style={styles.totalValue}>${totals.estimate.toFixed(2)}</Text>
          </View>
          <View style={styles.badges}>
            <StatusBadge label={`${totals.items} items`} variant="info" size="md" />
            <StatusBadge label={`Save $${totals.savings.toFixed(2)}`} variant="success" size="md" />
          </View>
        </View>
        {pledgingAll ? (
          <View style={styles.pledgingContainer}>
            <ActivityIndicator size="small" color={MetroColors.accent.cyan} />
            <Text style={styles.pledgingText}>Creating pledges...</Text>
          </View>
        ) : (
          <MetroButton
            title="Pledge All (Hold Funds)"
            variant="primary"
            size="lg"
            fullWidth
            onPress={handleCheckout}
            disabled={cart.length === 0 || pledgingItem !== null}
          />
        )}
      </View>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[4],
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  clearAll: {
    color: MetroColors.accent.red,
    fontFamily: Fonts.sans,
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  content: {
    padding: Spacing[4],
    paddingBottom: Spacing[10],
    gap: Spacing[3],
  },
  itemCard: {
    gap: Spacing[3],
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemInfo: {
    flex: 1,
    marginRight: Spacing[3],
  },
  itemName: {
    color: MetroColors.text.primary,
    fontFamily: Fonts.heading,
    fontSize: FontSizes.lg,
    fontWeight: '700',
    lineHeight: 24,
  },
  itemMeta: {
    color: MetroColors.text.tertiary,
    fontFamily: Fonts.body,
    fontSize: FontSizes.sm,
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
  },
  qtyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MetroColors.accent.cyanMuted,
    borderRadius: 16,
    paddingHorizontal: Spacing[2],
    borderWidth: 1.5,
    borderColor: MetroColors.accent.cyan,
  },
  qtyButton: {
    padding: Spacing[2],
    paddingHorizontal: Spacing[3],
  },
  qtySymbol: {
    color: MetroColors.accent.cyan,
    fontFamily: Fonts.sans,
    fontSize: FontSizes.xl,
    fontWeight: '600',
  },
  qtyValue: {
    minWidth: 32,
    textAlign: 'center',
    color: MetroColors.accent.cyan,
    fontFamily: Fonts.heading,
    fontSize: FontSizes.xl,
    fontWeight: '700',
  },
  priceBlock: {
    flex: 1,
    alignItems: 'flex-start',
  },
  label: {
    color: MetroColors.text.tertiary,
    fontFamily: Fonts.sans,
    fontSize: FontSizes.sm,
    fontWeight: '600',
    marginBottom: 4,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  savings: {
    color: MetroColors.accent.green,
    fontFamily: Fonts.heading,
    fontSize: FontSizes.lg,
    fontWeight: '800',
  },
  remove: {
    color: MetroColors.accent.red,
    fontFamily: Fonts.sans,
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.5,
  },
  footer: {
    padding: Spacing[4],
    borderTopWidth: 1,
    borderTopColor: MetroColors.border.muted,
    backgroundColor: MetroColors.background.secondary,
    gap: Spacing[3],
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    color: MetroColors.text.tertiary,
    fontFamily: Fonts.sans,
    fontSize: FontSizes.md,
    fontWeight: '600',
    marginBottom: 4,
  },
  totalValue: {
    color: MetroColors.text.primary,
    fontFamily: Fonts.heading,
    fontSize: FontSizes['3xl'],
    fontWeight: '800',
  },
  badges: {
    flexDirection: 'row',
    gap: Spacing[2],
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing[6],
    gap: Spacing[2],
  },
  emptyIcon: {
    fontSize: 28,
    color: MetroColors.text.muted,
  },
  emptyText: {
    color: MetroColors.text.primary,
    fontFamily: Fonts.heading,
    fontSize: FontSizes.xl,
    fontWeight: '700',
  },
  emptySubtext: {
    color: MetroColors.text.tertiary,
    fontFamily: Fonts.body,
    fontSize: FontSizes.md,
  },
  pledgingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing[4],
    gap: Spacing[3],
  },
  pledgingText: {
    color: MetroColors.accent.cyan,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.sm,
    letterSpacing: 1,
  },
});
