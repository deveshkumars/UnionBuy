/**
 * Pledges Screen - My Active Pledges
 * Shows locked funds, active orders, and rollover items
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import {
  MetroCard,
  MetroButton,
  PriceDisplay,
  ProgressBar,
  OrderStatusBadge,
  StatusBadge,
} from '@/components/metro';
import { MetroColors, FontSizes, Fonts, Spacing } from '@/constants/theme';
import { usePledges, useApp } from '@/context/AppContext';
import { fetchUserPledges, cancelPledge, fetchBulkOrderForProduct } from '@/services/api';
import { Pledge } from '@/types';

export default function PledgesScreen() {
  const router = useRouter();
  const { user } = useApp();
  const { pledges, setPledges, updatePledge } = usePledges();
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [orderProgress, setOrderProgress] = useState<Record<string, { total: number; target: number }>>({});

  useEffect(() => {
    loadPledges();
  }, []);

  const loadPledges = async () => {
    const userPledges = await fetchUserPledges(user.id);
    setPledges(userPledges);

    const productIds = Array.from(new Set(userPledges.map((p) => p.productId)));
    const progressEntries = await Promise.all(
      productIds.map(async (id) => {
        const order = await fetchBulkOrderForProduct(id);
        if (order) {
          return [id, { total: order.totalQuantity, target: order.targetQuantity }];
        }
        return null;
      })
    );
    const map: Record<string, { total: number; target: number }> = {};
    progressEntries.forEach((entry) => {
      if (entry) {
        const [id, value] = entry;
        map[id] = value;
      }
    });
    setOrderProgress(map);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPledges();
    setRefreshing(false);
  };

  const handleCancelPledge = async (pledge: Pledge) => {
    Alert.alert(
      'Cancel Pledge',
      `Are you sure you want to cancel your pledge for ${pledge.product.name}? Your funds will be released.`,
      [
        { text: 'Keep Pledge', style: 'cancel' },
        {
          text: 'Cancel Pledge',
          style: 'destructive',
          onPress: async () => {
            console.log('[Pledges] Cancelling pledge:', pledge.id);
            const result = await cancelPledge(pledge.id);
            console.log('[Pledges] Cancel result:', result);
            if (result.success) {
              console.log('[Pledges] Updating local state...');
              updatePledge({ ...pledge, status: 'cancelled' });
              // Reload to reflect changes
              await loadPledges();
              Alert.alert('Success', 'Pledge cancelled successfully!');
            } else {
              Alert.alert('Error', result.error || 'Failed to cancel pledge');
            }
          },
        },
      ]
    );
  };

  const filteredPledges = pledges.filter((p) => {
    if (filter === 'active') return ['pending', 'locked', 'active'].includes(p.status);
    if (filter === 'completed') return ['completed', 'cancelled'].includes(p.status);
    return true;
  });
  const rolloverPledges = pledges.filter((p) => p.status === 'rollover');

  const activePledges = pledges.filter((p) =>
    ['pending', 'locked', 'active'].includes(p.status)
  );
  const totalLocked = activePledges.reduce((sum, p) => sum + p.totalAmount, 0);
  const totalMaxHold = activePledges.reduce((sum, p) => sum + p.maxAmount, 0);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerLabel}>UNION BUY</Text>
          <Text style={styles.headerTitle}>Pledges</Text>
        </View>
        <TouchableOpacity style={styles.utilityPill} onPress={() => router.push('/(customer)/cart')}>
          <Text style={styles.utilityIcon}>🛒</Text>
        </TouchableOpacity>
      </View>

      {/* Summary Card */}
      <MetroCard variant="active" style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>LOCKED FUNDS</Text>
            <PriceDisplay amount={totalLocked} size="xl" variant="highlight" />
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>MAX HOLD</Text>
            <PriceDisplay amount={totalMaxHold} size="lg" variant="muted" />
          </View>
        </View>
        <View style={styles.savingsRow}>
          <Text style={styles.savingsText}>
            Potential savings: ${(totalMaxHold - totalLocked).toFixed(2)}
          </Text>
        </View>
        <Text style={styles.legendText}>
          Completed = bulk executed (not cancellable). Active = collecting (cancellable) until cutoff.
        </Text>
      </MetroCard>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {(['all', 'active', 'completed'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterTab, filter === f && styles.filterTabActive]}
            onPress={() => setFilter(f)}
          >
            <Text
              style={[
                styles.filterText,
                filter === f && styles.filterTextActive,
              ]}
            >
              {f.toUpperCase()}
            </Text>
            {f === 'active' && activePledges.length > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activePledges.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Pledges List */}
      <ScrollView
        style={styles.listContainer}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={MetroColors.accent.cyan}
          />
        }
      >
        {rolloverPledges.length > 0 && (
          <View style={styles.rolloverSection}>
            <Text style={styles.rolloverTitle}>ROLLOVER TO TODAY</Text>
            {rolloverPledges.map((pledge) => (
              <MetroCard key={pledge.id} style={styles.rolloverCard}>
                <View style={styles.rolloverHeader}>
                  <Text style={styles.rolloverName}>{pledge.product.name}</Text>
                  <StatusBadge label="ROLLED" variant="warning" size="sm" />
                </View>
                <Text style={styles.rolloverMeta}>
                  {pledge.quantity} {pledge.product.unit} • Needed {pledge.product.bulkMinimum}
                </Text>
                <MetroButton
                  title="Re-pledge"
                  variant="primary"
                  size="sm"
                  onPress={() => Alert.alert('Re-pledge', 'Would move this into today’s batch.')}
                  style={styles.rolloverButton}
                />
              </MetroCard>
            ))}
          </View>
        )}

        {filteredPledges.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>◇</Text>
            <Text style={styles.emptyText}>NO PLEDGES</Text>
            <Text style={styles.emptySubtext}>
              Join a bulk buy from the Market to see your pledges here
            </Text>
          </View>
        ) : (
          filteredPledges.map((pledge) => (
            <PledgeCard
              key={pledge.id}
              pledge={pledge}
              progress={orderProgress[pledge.productId]}
              onCancel={() => handleCancelPledge(pledge)}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

interface PledgeCardProps {
  pledge: Pledge;
  progress?: { total: number; target: number };
  onCancel: () => void;
}

function PledgeCard({ pledge, progress, onCancel }: PledgeCardProps) {
  const isActive = ['pending', 'locked', 'active'].includes(pledge.status);
  const isCompleted = pledge.status === 'completed';
  const isCancelled = pledge.status === 'cancelled';
  const target = progress?.target || pledge.product.bulkMinimum;
  const total = progress?.total ?? pledge.quantity;
  const remaining = Math.max(target - total, 0);
  const pct = Math.min(total / target, 1);

  const variant = isCompleted
    ? 'success'
    : isCancelled
    ? 'default'
    : pledge.status === 'locked'
    ? 'locked'
    : 'warning';

  return (
    <MetroCard
      variant={variant}
      style={[styles.pledgeCard, (isCompleted || isCancelled) && styles.pledgeCardInactive]}
    >
      <View style={styles.pledgeHeader}>
        <View style={styles.pledgeInfo}>
          <Text style={styles.pledgeName}>{pledge.product.name}</Text>
          <Text style={styles.pledgeDetails}>
            {pledge.quantity} {pledge.product.unit} • {pledge.product.store.name}
          </Text>
        </View>
        <OrderStatusBadge status={pledge.status as any} />
      </View>

      <View style={styles.pledgePricing}>
        <View style={styles.priceBlock}>
          <Text style={styles.priceBlockLabel}>ESTIMATED</Text>
          <PriceDisplay
            amount={pledge.totalAmount}
            size="lg"
            variant={isActive ? 'highlight' : 'muted'}
          />
        </View>
        <View style={styles.priceBlock}>
          <Text style={styles.priceBlockLabel}>MAX HOLD</Text>
          <PriceDisplay
            amount={pledge.maxAmount}
            size="md"
            variant="muted"
          />
        </View>
        <View style={styles.priceBlock}>
          <Text style={styles.priceBlockLabel}>SAVINGS</Text>
          <Text style={styles.savingsAmount}>
            ${(pledge.maxAmount - pledge.totalAmount).toFixed(2)}
          </Text>
        </View>
      </View>

      {pledge.status === 'locked' && (
        <View style={styles.lockInfo}>
          <View style={styles.lockIndicator} />
          <Text style={styles.lockText}>
            Funds locked • Waiting for bulk order completion
          </Text>
        </View>
      )}

      {['pending', 'locked', 'active'].includes(pledge.status) && (
        <View style={styles.progressSection}>
          <Text style={styles.progressText}>
            {remaining === 0
              ? 'Bulk ready • executing at cutoff'
              : `Need ~${remaining} more ${pledge.product.unit} to reach bulk`}
          </Text>
          <ProgressBar progress={pct} height={10} showLabel />
        </View>
      )}

      {isActive && !['active'].includes(pledge.status) && (
        <View style={styles.pledgeActions}>
          <MetroButton
            title="CANCEL"
            variant="danger"
            size="sm"
            onPress={onCancel}
          />
        </View>
      )}

      {isCompleted && (
        <View style={styles.completedInfo}>
          <Text style={styles.completedLabel}>COMPLETED</Text>
          <Text style={styles.completedDate}>
            {new Date(pledge.completedAt!).toLocaleDateString()}
          </Text>
        </View>
      )}

      <View style={styles.pledgeFooter}>
        <Text style={styles.pledgeId}>ID: {pledge.id.slice(-8).toUpperCase()}</Text>
        <Text style={styles.pledgeDate}>
          {new Date(pledge.createdAt).toLocaleString()}
        </Text>
      </View>
    </MetroCard>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MetroColors.background.primary,
  },
  header: {
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: MetroColors.border.muted,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
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
  utilityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MetroColors.background.secondary,
    borderWidth: 1,
    borderColor: MetroColors.border.default,
    borderRadius: 12,
    paddingHorizontal: Spacing[2],
    paddingVertical: Spacing[1],
  },
  utilityIcon: {
    fontSize: FontSizes.md,
  },
  summaryCard: {
    margin: Spacing[4],
    marginBottom: 0,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    color: MetroColors.text.muted,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.xs,
    letterSpacing: 1,
    marginBottom: Spacing[1],
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: MetroColors.border.default,
  },
  savingsRow: {
    marginTop: Spacing[3],
    paddingTop: Spacing[3],
    borderTopWidth: 1,
    borderTopColor: MetroColors.border.muted,
    alignItems: 'center',
  },
  savingsText: {
    color: MetroColors.accent.green,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.sm,
  },
  legendText: {
    color: MetroColors.text.tertiary,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.xs,
    marginTop: Spacing[2],
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    gap: Spacing[2],
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
    borderWidth: 1,
    borderColor: MetroColors.border.default,
    borderRadius: 2,
  },
  filterTabActive: {
    borderColor: MetroColors.accent.cyan,
    backgroundColor: MetroColors.accent.cyanMuted,
  },
  filterText: {
    color: MetroColors.text.tertiary,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.xs,
    letterSpacing: 1,
  },
  filterTextActive: {
    color: MetroColors.accent.cyan,
  },
  filterBadge: {
    backgroundColor: MetroColors.accent.cyan,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 2,
    marginLeft: Spacing[2],
  },
  filterBadgeText: {
    color: MetroColors.background.primary,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.xs,
    fontWeight: '700',
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    padding: Spacing[4],
    paddingBottom: Spacing[10],
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
    textAlign: 'center',
    paddingHorizontal: Spacing[8],
  },
  rolloverSection: {
    marginBottom: Spacing[4],
    gap: Spacing[2],
  },
  rolloverTitle: {
    color: MetroColors.text.secondary,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.xs,
    letterSpacing: 1,
  },
  rolloverCard: {
    paddingVertical: Spacing[3],
  },
  rolloverHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing[1],
  },
  rolloverName: {
    color: MetroColors.text.primary,
    fontFamily: Fonts.sans,
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  rolloverMeta: {
    color: MetroColors.text.tertiary,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.xs,
  },
  rolloverButton: {
    marginTop: Spacing[2],
  },
  pledgeCard: {
    marginBottom: Spacing[3],
  },
  pledgeCardInactive: {
    opacity: 0.7,
  },
  pledgeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing[3],
  },
  pledgeInfo: {
    flex: 1,
  },
  pledgeName: {
    color: MetroColors.text.primary,
    fontFamily: Fonts.sans,
    fontSize: FontSizes.lg,
    fontWeight: '600',
    marginBottom: 2,
  },
  pledgeDetails: {
    color: MetroColors.text.muted,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.xs,
    letterSpacing: 0.5,
  },
  pledgePricing: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing[3],
    paddingVertical: Spacing[2],
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: MetroColors.border.muted,
  },
  priceBlock: {
    alignItems: 'center',
  },
  priceBlockLabel: {
    color: MetroColors.text.muted,
    fontFamily: Fonts.mono,
    fontSize: 9,
    letterSpacing: 1,
    marginBottom: 2,
  },
  savingsAmount: {
    color: MetroColors.accent.green,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.lg,
    fontWeight: '600',
  },
  lockInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MetroColors.accent.purpleMuted,
    padding: Spacing[2],
    borderRadius: 2,
    marginBottom: Spacing[3],
  },
  lockIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: MetroColors.accent.purple,
    marginRight: Spacing[2],
  },
  lockText: {
    color: MetroColors.accent.purple,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.xs,
    flex: 1,
  },
  progressSection: {
    marginBottom: Spacing[3],
  },
  progressText: {
    color: MetroColors.text.secondary,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.xs,
    marginBottom: Spacing[2],
  },
  pledgeActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: Spacing[3],
  },
  completedInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: MetroColors.accent.greenMuted,
    padding: Spacing[2],
    borderRadius: 2,
    marginBottom: Spacing[3],
  },
  completedLabel: {
    color: MetroColors.accent.green,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.xs,
    fontWeight: '600',
    letterSpacing: 1,
  },
  completedDate: {
    color: MetroColors.accent.green,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.xs,
  },
  pledgeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  pledgeId: {
    color: MetroColors.text.muted,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.xs,
    letterSpacing: 0.5,
  },
  pledgeDate: {
    color: MetroColors.text.muted,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.xs,
  },
});
