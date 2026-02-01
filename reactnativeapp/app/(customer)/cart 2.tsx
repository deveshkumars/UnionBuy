/**
 * Cart Screen - Light Metro
 * Shows items added from Market with quick adjust controls.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MetroCard, MetroButton, PriceDisplay, StatusBadge } from '@/components/metro';
import { MetroColors, FontSizes, Fonts, Spacing } from '@/constants/theme';
import { useCart } from '@/context/AppContext';

export default function CartScreen() {
  const { cart, updateCartQuantity, removeFromCart, clearCart, getCartTotal } = useCart();
  const totals = getCartTotal();

  const handleCheckout = () => {
    Alert.alert('Pledge Checkout', 'This would route to pledge/hold flow in production.');
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
          <Text style={styles.emptyIcon}>🧺</Text>
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
                  <MetroButton
                    title="Pledge"
                    variant="secondary"
                    size="sm"
                    onPress={() => Alert.alert('Pledge', 'Would start pledge flow for this item.')}
                  />
                  <TouchableOpacity onPress={() => removeFromCart(product.id)}>
                    <Text style={styles.remove}>Remove</Text>
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
            <StatusBadge label={`${totals.items} items`} variant="info" size="sm" />
            <StatusBadge label={`Save $${totals.savings.toFixed(2)}`} variant="success" size="sm" />
          </View>
        </View>
        <MetroButton title="Pledge All (Hold Funds)" variant="primary" size="lg" fullWidth onPress={handleCheckout} />
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  clearAll: {
    color: MetroColors.accent.red,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.sm,
    letterSpacing: 1,
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
    fontFamily: Fonts.sans,
    fontSize: FontSizes.lg,
    fontWeight: '700',
  },
  itemMeta: {
    color: MetroColors.text.tertiary,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.xs,
    letterSpacing: 0.5,
    marginTop: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
  },
  qtyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MetroColors.background.tertiary,
    borderRadius: Spacing[4],
    paddingHorizontal: Spacing[2],
    borderWidth: 1,
    borderColor: MetroColors.border.default,
  },
  qtyButton: {
    padding: Spacing[2],
  },
  qtySymbol: {
    color: MetroColors.text.primary,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.lg,
  },
  qtyValue: {
    minWidth: 28,
    textAlign: 'center',
    color: MetroColors.accent.cyan,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.lg,
    fontWeight: '700',
  },
  priceBlock: {
    flex: 1,
    alignItems: 'flex-start',
  },
  label: {
    color: MetroColors.text.tertiary,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.xs,
    letterSpacing: 0.5,
    marginBottom: 2,
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
    fontFamily: Fonts.mono,
    fontSize: FontSizes.sm,
  },
  remove: {
    color: MetroColors.accent.red,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.sm,
    letterSpacing: 0.5,
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
    fontFamily: Fonts.mono,
    fontSize: FontSizes.xs,
    letterSpacing: 0.5,
  },
  totalValue: {
    color: MetroColors.text.primary,
    fontFamily: Fonts.sans,
    fontSize: FontSizes['2xl'],
    fontWeight: '700',
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
    fontSize: 42,
    color: MetroColors.text.muted,
  },
  emptyText: {
    color: MetroColors.text.primary,
    fontFamily: Fonts.sans,
    fontSize: FontSizes.lg,
    fontWeight: '700',
  },
  emptySubtext: {
    color: MetroColors.text.tertiary,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.sm,
  },
});
