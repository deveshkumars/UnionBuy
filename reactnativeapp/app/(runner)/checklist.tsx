/**
 * Checklist Screen - Pick and Pay
 * Item checklist with quantities and virtual card display
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  MetroCard,
  MetroButton,
  StatusBadge,
  PriceDisplay,
} from '@/components/metro';
import { MetroColors, FontSizes, Fonts, Spacing } from '@/constants/theme';
import { useMission } from '@/context/AppContext';

interface ChecklistItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  store: string;
  checked: boolean;
}

export default function ChecklistScreen() {
  const { activeMission } = useMission();

  // Mock checklist items
  const [items, setItems] = useState<ChecklistItem[]>([
    { id: '1', name: 'Jasmine Rice', quantity: 50, unit: 'lbs', store: 'Costco', checked: false },
    { id: '2', name: 'Chicken Breast', quantity: 40, unit: 'lbs', store: 'Restaurant Depot', checked: false },
    { id: '3', name: 'Organic Eggs', quantity: 15, unit: 'dozen', store: "BJ's", checked: false },
    { id: '4', name: 'Olive Oil', quantity: 6, unit: 'bottles', store: 'Costco', checked: false },
    { id: '5', name: 'Paper Towels', quantity: 30, unit: 'rolls', store: 'Costco', checked: false },
  ]);

  const toggleItem = (id: string) => {
    setItems(items.map(item =>
      item.id === id ? { ...item, checked: !item.checked } : item
    ));
  };

  const checkedCount = items.filter(i => i.checked).length;
  const totalEstimate = 187.45; // Mock value
  const cardLimit = 250.00;

  if (!activeMission) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.noMissionContainer}>
          <Text style={styles.noMissionIcon}>☰</Text>
          <Text style={styles.noMissionTitle}>NO ACTIVE MISSION</Text>
          <Text style={styles.noMissionSubtext}>
            Accept a mission to see your shopping checklist
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerLabel}>PICK & PAY</Text>
          <Text style={styles.headerTitle}>CHECKLIST</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.progressText}>
            {checkedCount}/{items.length}
          </Text>
          <Text style={styles.progressLabel}>ITEMS</Text>
        </View>
      </View>

      {/* Virtual Card */}
      <View style={styles.cardSection}>
        <MetroCard variant="active" glowing style={styles.virtualCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardLabel}>METROPOLIS MISSION CARD</Text>
            <StatusBadge label="ACTIVE" variant="success" size="sm" />
          </View>
          <View style={styles.cardNumber}>
            <Text style={styles.cardDigits}>•••• •••• •••• 8472</Text>
          </View>
          <View style={styles.cardDetails}>
            <View>
              <Text style={styles.cardDetailLabel}>LIMIT</Text>
              <PriceDisplay amount={cardLimit} size="lg" variant="highlight" />
            </View>
            <View>
              <Text style={styles.cardDetailLabel}>EST. TOTAL</Text>
              <PriceDisplay amount={totalEstimate} size="lg" variant="warning" />
            </View>
            <View>
              <Text style={styles.cardDetailLabel}>REMAINING</Text>
              <PriceDisplay amount={cardLimit - totalEstimate} size="lg" variant="success" />
            </View>
          </View>
          <View style={styles.cardFooter}>
            <Text style={styles.cardNote}>
              Present this card at checkout • PIN: 1234
            </Text>
          </View>
        </MetroCard>
      </View>

      {/* Checklist */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Group by store */}
        {['Costco', 'Restaurant Depot', "BJ's"].map(store => {
          const storeItems = items.filter(i => i.store === store);
          if (storeItems.length === 0) return null;

          const allChecked = storeItems.every(i => i.checked);

          return (
            <View key={store} style={styles.storeSection}>
              <View style={styles.storeHeader}>
                <View style={[styles.storeDot, allChecked && styles.storeDotComplete]} />
                <Text style={[styles.storeName, allChecked && styles.storeNameComplete]}>
                  {store.toUpperCase()}
                </Text>
                <Text style={styles.storeCount}>
                  {storeItems.filter(i => i.checked).length}/{storeItems.length}
                </Text>
              </View>

              {storeItems.map(item => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.checklistItem, item.checked && styles.checklistItemChecked]}
                  onPress={() => toggleItem(item.id)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.checkbox, item.checked && styles.checkboxChecked]}>
                    {item.checked && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <View style={styles.itemInfo}>
                    <Text style={[styles.itemName, item.checked && styles.itemNameChecked]}>
                      {item.name}
                    </Text>
                    <Text style={styles.itemQuantity}>
                      {item.quantity} {item.unit}
                    </Text>
                  </View>
                  {item.checked && (
                    <StatusBadge label="PICKED" variant="success" size="sm" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          );
        })}

        {/* Receipt Scan Option */}
        <MetroCard style={styles.receiptCard}>
          <View style={styles.receiptContent}>
            <View style={styles.receiptIcon}>
              <Text style={styles.receiptIconText}>⌗</Text>
            </View>
            <View style={styles.receiptInfo}>
              <Text style={styles.receiptTitle}>VERIFY RECEIPT</Text>
              <Text style={styles.receiptSubtext}>
                Scan your receipt to verify purchase
              </Text>
            </View>
          </View>
          <MetroButton
            title="SCAN RECEIPT"
            variant="secondary"
            size="sm"
            onPress={() => {}}
          />
        </MetroCard>
      </ScrollView>

      {/* Bottom Action */}
      <View style={styles.bottomAction}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>
            {checkedCount === items.length ? 'ALL ITEMS PICKED' : `${items.length - checkedCount} ITEMS REMAINING`}
          </Text>
          <Text style={styles.summaryValue}>~${totalEstimate.toFixed(2)}</Text>
        </View>
        <MetroButton
          title={checkedCount === items.length ? 'PROCEED TO CHECKOUT' : 'MARK ALL PICKED'}
          variant={checkedCount === items.length ? 'primary' : 'secondary'}
          size="lg"
          fullWidth
          onPress={() => {
            if (checkedCount < items.length) {
              setItems(items.map(i => ({ ...i, checked: true })));
            }
          }}
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
  noMissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing[4],
  },
  noMissionIcon: {
    fontSize: 64,
    color: MetroColors.text.muted,
    marginBottom: Spacing[4],
  },
  noMissionTitle: {
    color: MetroColors.text.secondary,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.xl,
    letterSpacing: 1,
    marginBottom: Spacing[2],
  },
  noMissionSubtext: {
    color: MetroColors.text.muted,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.sm,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: MetroColors.accent.green + '40',
  },
  headerLabel: {
    color: MetroColors.accent.green,
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
  progressText: {
    color: MetroColors.accent.green,
    fontFamily: Fonts.mono,
    fontSize: FontSizes['2xl'],
    fontWeight: '700',
  },
  progressLabel: {
    color: MetroColors.text.muted,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.xs,
    letterSpacing: 0.5,
  },
  cardSection: {
    padding: Spacing[4],
    paddingBottom: 0,
  },
  virtualCard: {
    backgroundColor: MetroColors.background.tertiary,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing[3],
  },
  cardLabel: {
    color: MetroColors.text.muted,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.xs,
    letterSpacing: 1,
  },
  cardNumber: {
    marginBottom: Spacing[3],
  },
  cardDigits: {
    color: MetroColors.text.primary,
    fontFamily: Fonts.mono,
    fontSize: FontSizes['2xl'],
    letterSpacing: 4,
  },
  cardDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: Spacing[3],
    borderTopWidth: 1,
    borderTopColor: MetroColors.border.muted,
  },
  cardDetailLabel: {
    color: MetroColors.text.muted,
    fontFamily: Fonts.mono,
    fontSize: 9,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  cardFooter: {
    marginTop: Spacing[3],
    paddingTop: Spacing[3],
    borderTopWidth: 1,
    borderTopColor: MetroColors.border.muted,
  },
  cardNote: {
    color: MetroColors.text.muted,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.xs,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing[4],
    paddingBottom: Spacing[10],
  },
  storeSection: {
    marginBottom: Spacing[4],
  },
  storeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing[2],
  },
  storeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: MetroColors.accent.cyan,
    marginRight: Spacing[2],
  },
  storeDotComplete: {
    backgroundColor: MetroColors.accent.green,
  },
  storeName: {
    color: MetroColors.text.secondary,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.sm,
    fontWeight: '600',
    letterSpacing: 1,
    flex: 1,
  },
  storeNameComplete: {
    color: MetroColors.accent.green,
  },
  storeCount: {
    color: MetroColors.text.muted,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.xs,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MetroColors.background.secondary,
    borderWidth: 1,
    borderColor: MetroColors.border.default,
    borderRadius: 2,
    padding: Spacing[3],
    marginBottom: Spacing[2],
  },
  checklistItemChecked: {
    borderColor: MetroColors.accent.green,
    backgroundColor: MetroColors.accent.greenMuted,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: MetroColors.border.default,
    borderRadius: 2,
    marginRight: Spacing[3],
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    borderColor: MetroColors.accent.green,
    backgroundColor: MetroColors.accent.green,
  },
  checkmark: {
    color: MetroColors.background.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    color: MetroColors.text.primary,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.md,
    marginBottom: 2,
  },
  itemNameChecked: {
    textDecorationLine: 'line-through',
    color: MetroColors.text.tertiary,
  },
  itemQuantity: {
    color: MetroColors.text.muted,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.sm,
  },
  receiptCard: {
    marginTop: Spacing[4],
  },
  receiptContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing[3],
  },
  receiptIcon: {
    width: 48,
    height: 48,
    borderRadius: 4,
    backgroundColor: MetroColors.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing[3],
  },
  receiptIconText: {
    color: MetroColors.accent.cyan,
    fontSize: 24,
  },
  receiptInfo: {
    flex: 1,
  },
  receiptTitle: {
    color: MetroColors.text.primary,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.sm,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  receiptSubtext: {
    color: MetroColors.text.muted,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.xs,
  },
  bottomAction: {
    padding: Spacing[4],
    borderTopWidth: 1,
    borderTopColor: MetroColors.border.muted,
    backgroundColor: MetroColors.background.secondary,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing[3],
  },
  summaryLabel: {
    color: MetroColors.text.secondary,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.sm,
  },
  summaryValue: {
    color: MetroColors.accent.green,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.lg,
    fontWeight: '700',
  },
});

