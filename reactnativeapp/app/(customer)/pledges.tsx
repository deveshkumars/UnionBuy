/**
 * Pledges Screen - My Active Pledges
 * Clean, warm design showing locked funds and active orders
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
    MetroButton,
    MetroCard,
    OrderStatusBadge,
    PriceDisplay,
    ProgressBar,
    StatusBadge,
} from '@/components/metro';
import { BorderRadius, FontSizes, Fonts, MetroColors, Shadows, Spacing } from '@/constants/theme';
import { useApp, usePledges } from '@/context/AppContext';
import { cancelPledge, fetchBulkOrderForProductAnyStatus, fetchUserPledges, repledgePledge } from '@/services/api';
import { Pledge } from '@/types';

export default function PledgesScreen() {
  const router = useRouter();
  const { user } = useApp();
  const { pledges, setPledges, updatePledge } = usePledges();
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [orderProgress, setOrderProgress] = useState<Record<string, { total: number; target: number; status?: string }>>({});

  useEffect(() => {
    loadPledges();
  }, []);

  const loadPledges = async () => {
    const userPledges = await fetchUserPledges(user.id);
    setPledges(userPledges);

    const productIds = Array.from(new Set(userPledges.map((p) => p.productId)));
    const progressEntries = await Promise.all(
      productIds.map(async (id) => {
        const order = await fetchBulkOrderForProductAnyStatus(id);
        if (order) {
          return [id, { total: order.totalQuantity, target: order.targetQuantity, status: order.status }];
        }
        return null;
      })
    );
    const map: Record<string, { total: number; target: number; status?: string }> = {};
    progressEntries.forEach((entry) => {
      if (entry) {
        const [id, value] = entry;
        map[id] = value as { total: number; target: number; status?: string };
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
    const progress = orderProgress[pledge.productId];
    if (progress?.status && ['assigned', 'shopping', 'in_transit', 'distributing'].includes(progress.status)) {
      Alert.alert('Cannot Cancel', 'This order has been activated and is in progress. Cancellation is no longer available.');
      return;
    }
    
    Alert.alert(
      'Cancel Pledge',
      `Are you sure you want to cancel your pledge for ${pledge.product.name}? Your funds will be released.`,
      [
        { text: 'Keep Pledge', style: 'cancel' },
        {
          text: 'Cancel Pledge',
          style: 'destructive',
          onPress: async () => {
            const result = await cancelPledge(pledge.id);
            if (result.success) {
              updatePledge({ ...pledge, status: 'cancelled' });
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

  const handleRepledge = async (pledge: Pledge) => {
    Alert.alert(
      'Re-pledge Item',
      `Re-pledge ${pledge.quantity} ${pledge.product.unit} of ${pledge.product.name} to today's batch?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Re-pledge',
          onPress: async () => {
            const result = await repledgePledge(pledge.id, user.id);
            if (result.success && result.pledge) {
              await loadPledges();
              Alert.alert('Success', `Re-pledged ${pledge.product.name} to today's batch!`);
            } else {
              Alert.alert('Error', result.error || 'Failed to re-pledge');
            }
          },
        },
      ]
    );
  };

  const getClearablePledges = () => {
    return pledges.filter((p) => {
      if (!['pending', 'locked'].includes(p.status)) return false;
      const progress = orderProgress[p.productId];
      if (progress?.status && ['assigned', 'shopping', 'in_transit', 'distributing'].includes(progress.status)) {
        return false;
      }
      return true;
    });
  };

  const handleClearAllPledges = async () => {
    const clearable = getClearablePledges();
    
    if (clearable.length === 0) {
      Alert.alert('No Pledges to Clear', 'All your pledges are either already completed, cancelled, or have hit bulk and are being processed.');
      return;
    }

    Alert.alert(
      'Clear All Pledges',
      `Are you sure you want to cancel ${clearable.length} pledge${clearable.length > 1 ? 's' : ''}? Your funds will be released.`,
      [
        { text: 'Keep Pledges', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            let successCount = 0;
            let failCount = 0;

            for (const pledge of clearable) {
              const result = await cancelPledge(pledge.id);
              if (result.success) {
                successCount++;
              } else {
                failCount++;
              }
            }

            await loadPledges();

            if (failCount === 0) {
              Alert.alert('Success', `Cleared ${successCount} pledge${successCount > 1 ? 's' : ''} successfully!`);
            } else {
              Alert.alert('Partial Success', `Cleared ${successCount} pledge${successCount > 1 ? 's' : ''}, but ${failCount} failed to cancel.`);
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
          <Text style={styles.headerLabel}>Union Buy</Text>
          <Text style={styles.headerTitle}>Pledges</Text>
        </View>
        <TouchableOpacity 
          style={styles.headerIconButton}
          onPress={() => router.push('/(customer)/cart')}
        >
          <Ionicons name="cart-outline" size={24} color={MetroColors.text.primary} />
        </TouchableOpacity>
      </View>

      {/* Summary Card */}
      <MetroCard variant="active" style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Locked Funds</Text>
            <PriceDisplay amount={totalLocked} size="xl" variant="highlight" />
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Max Hold</Text>
            <PriceDisplay amount={totalMaxHold} size="lg" variant="muted" />
          </View>
        </View>
        <View style={styles.savingsRow}>
          <Ionicons name="trending-down" size={16} color={MetroColors.accent.green} />
          <Text style={styles.savingsText}>
            Potential savings: ${(totalMaxHold - totalLocked).toFixed(2)}
          </Text>
        </View>
        <Text style={styles.legendText}>
          Completed = bulk executed. Active = collecting until cutoff.
        </Text>
        {getClearablePledges().length > 0 && (
          <MetroButton
            title={`Clear All (${getClearablePledges().length})`}
            variant="danger"
            size="sm"
            onPress={handleClearAllPledges}
            style={styles.clearAllButton}
          />
        )}
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
              {f.charAt(0).toUpperCase() + f.slice(1)}
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
            <Text style={styles.rolloverTitle}>Rollover to Today</Text>
            {rolloverPledges.map((pledge) => (
              <MetroCard key={pledge.id} style={styles.rolloverCard}>
                <View style={styles.rolloverHeader}>
                  <Text style={styles.rolloverName}>{pledge.product.name}</Text>
                  <StatusBadge label="Rolled" variant="warning" size="sm" />
                </View>
                <Text style={styles.rolloverMeta}>
                  {pledge.quantity} {pledge.product.unit} · Needed {pledge.product.bulkMinimum}
                </Text>
                <MetroButton
                  title="Re-pledge"
                  variant="primary"
                  size="sm"
                  onPress={() => handleRepledge(pledge)}
                  style={styles.rolloverButton}
                />
              </MetroCard>
            ))}
          </View>
        )}

        {filteredPledges.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={48} color={MetroColors.text.muted} />
            <Text style={styles.emptyText}>No Pledges</Text>
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
  progress?: { total: number; target: number; status?: string };
  onCancel: () => void;
}

interface BatchInfo {
  batchNumber: number;
  totalBatches: number;
  batchTotal: number;
  batchTarget: number;
  isFilled: boolean;
}

function getBatches(total: number, target: number): BatchInfo[] {
  if (target <= 0) return [{ batchNumber: 1, totalBatches: 1, batchTotal: total, batchTarget: target, isFilled: false }];
  
  const completeBatches = Math.floor(total / target);
  const remainder = total % target;
  const batches: BatchInfo[] = [];
  const totalBatches = completeBatches + (remainder > 0 ? 1 : 0);
  
  for (let i = 0; i < completeBatches; i++) {
    batches.push({
      batchNumber: i + 1,
      totalBatches,
      batchTotal: target,
      batchTarget: target,
      isFilled: true,
    });
  }
  
  if (remainder > 0 || batches.length === 0) {
    batches.push({
      batchNumber: batches.length + 1,
      totalBatches: Math.max(totalBatches, 1),
      batchTotal: remainder > 0 ? remainder : total,
      batchTarget: target,
      isFilled: false,
    });
  }
  
  return batches;
}

function PledgeCard({ pledge, progress, onCancel }: PledgeCardProps) {
  const isActive = ['pending', 'locked', 'active'].includes(pledge.status);
  const isCompleted = pledge.status === 'completed';
  const isCancelled = pledge.status === 'cancelled';
  const target = progress?.target || pledge.product.bulkMinimum;
  const total = progress?.total ?? pledge.quantity;
  
  const orderStatus = progress?.status;
  const isOrderActivated = orderStatus && ['assigned', 'shopping', 'in_transit', 'distributing'].includes(orderStatus);

  const batches = getBatches(total, target);
  const showMultipleBatches = batches.length > 1 || total > target;

  const renderBatchCard = (batch: BatchInfo, isLastBatch: boolean) => {
    const batchRemaining = Math.max(batch.batchTarget - batch.batchTotal, 0);
    const batchPct = batch.batchTarget > 0 ? Math.min(batch.batchTotal / batch.batchTarget, 1) : 0;
    
    const variant = isCompleted
      ? 'success'
      : isCancelled
      ? 'default'
      : batch.isFilled
      ? 'success'
      : isOrderActivated
      ? 'success'
      : pledge.status === 'locked'
      ? 'locked'
      : 'warning';

    return (
      <MetroCard
        key={`${pledge.id}-batch-${batch.batchNumber}`}
        variant={variant}
        style={[styles.pledgeCard, (isCompleted || isCancelled) && styles.pledgeCardInactive]}
      >
        <View style={styles.pledgeHeader}>
          <View style={styles.pledgeInfo}>
            <Text style={styles.pledgeName}>
              {pledge.product.name}
              {showMultipleBatches && (
                <Text style={styles.batchLabel}> #{batch.batchNumber}</Text>
              )}
            </Text>
            <Text style={styles.pledgeDetails}>
              {pledge.quantity} {pledge.product.unit} · {pledge.product.store.name}
            </Text>
          </View>
          <OrderStatusBadge status={batch.isFilled ? 'completed' : pledge.status as any} />
        </View>

        {batch.batchNumber === 1 && (
          <View style={styles.pledgePricing}>
            <View style={styles.priceBlock}>
              <Text style={styles.priceBlockLabel}>Estimated</Text>
              <PriceDisplay
                amount={pledge.totalAmount}
                size="lg"
                variant={isActive ? 'highlight' : 'muted'}
              />
            </View>
            <View style={styles.priceBlock}>
              <Text style={styles.priceBlockLabel}>Max Hold</Text>
              <PriceDisplay
                amount={pledge.maxAmount}
                size="md"
                variant="muted"
              />
            </View>
            <View style={styles.priceBlock}>
              <Text style={styles.priceBlockLabel}>Savings</Text>
              <Text style={styles.savingsAmount}>
                ${(pledge.maxAmount - pledge.totalAmount).toFixed(2)}
              </Text>
            </View>
          </View>
        )}

        {batch.isFilled && (
          <View style={[styles.lockInfo, { backgroundColor: MetroColors.accent.greenMuted }]}>
            <Ionicons name="checkmark-circle" size={16} color={MetroColors.accent.green} />
            <Text style={[styles.lockText, { color: MetroColors.accent.green }]}>
              Order filled at {batch.batchTotal}/{batch.batchTarget}
            </Text>
          </View>
        )}

        {!batch.isFilled && isOrderActivated && (
          <View style={[styles.lockInfo, { backgroundColor: MetroColors.accent.greenMuted }]}>
            <Ionicons name="time" size={16} color={MetroColors.accent.green} />
            <Text style={[styles.lockText, { color: MetroColors.accent.green }]}>
              Order will be processed soon
            </Text>
          </View>
        )}

        {pledge.status === 'locked' && !isOrderActivated && !batch.isFilled && (
          <View style={styles.lockInfo}>
            <Ionicons name="lock-closed" size={16} color={MetroColors.accent.purple} />
            <Text style={styles.lockText}>
              Funds locked · Waiting for bulk order completion
            </Text>
          </View>
        )}

        {['pending', 'locked', 'active'].includes(pledge.status) && (
          <View style={styles.progressSection}>
            <Text style={styles.progressText}>
              {batch.isFilled
                ? `Batch filled! ${batch.batchTotal}/${batch.batchTarget} ${pledge.product.unit}`
                : isOrderActivated
                ? `Bulk minimum reached! ${batch.batchTotal}/${batch.batchTarget} ${pledge.product.unit} pledged`
                : batchRemaining === 0
                ? 'Bulk ready · executing at cutoff'
                : `Need ${batchRemaining} more ${pledge.product.unit} to reach bulk (${batch.batchTotal}/${batch.batchTarget})`}
            </Text>
            <ProgressBar progress={batchPct} height={8} showLabel />
          </View>
        )}

        {isLastBatch && isActive && !['active'].includes(pledge.status) && !isOrderActivated && !batch.isFilled && (
          <View style={styles.pledgeActions}>
            <MetroButton
              title="Cancel"
              variant="danger"
              size="sm"
              onPress={onCancel}
            />
          </View>
        )}

        {isCompleted && batch.batchNumber === 1 && (
          <View style={styles.completedInfo}>
            <Ionicons name="checkmark-circle" size={20} color={MetroColors.accent.green} />
            <Text style={styles.completedLabel}>Completed</Text>
            <Text style={styles.completedDate}>
              {new Date(pledge.completedAt!).toLocaleDateString()}
            </Text>
          </View>
        )}

        <View style={styles.pledgeFooter}>
          <Text style={styles.pledgeId}>
            ID: {pledge.id.slice(-8).toUpperCase()}
            {showMultipleBatches && `-B${batch.batchNumber}`}
          </Text>
          <Text style={styles.pledgeDate}>
            {new Date(pledge.createdAt).toLocaleString()}
          </Text>
        </View>
      </MetroCard>
    );
  };

  return (
    <>
      {batches.map((batch, index) => renderBatchCard(batch, index === batches.length - 1))}
    </>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    backgroundColor: MetroColors.background.secondary,
    ...Shadows.sm,
  },
  headerLabel: {
    color: MetroColors.accent.purple,
    fontFamily: Fonts.body,
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
  headerTitle: {
    color: MetroColors.text.primary,
    fontFamily: Fonts.heading,
    fontSize: FontSizes['3xl'],
    fontWeight: '700',
    letterSpacing: -0.5,
    marginTop: 2,
  },
  headerIconButton: {
    padding: Spacing[2],
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
    color: MetroColors.text.tertiary,
    fontFamily: Fonts.body,
    fontSize: FontSizes.sm,
    fontWeight: '500',
    marginBottom: Spacing[2],
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: MetroColors.border.default,
  },
  savingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
    marginTop: Spacing[3],
    paddingTop: Spacing[3],
    borderTopWidth: 1,
    borderTopColor: MetroColors.border.default,
  },
  savingsText: {
    color: MetroColors.accent.green,
    fontFamily: Fonts.body,
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  legendText: {
    color: MetroColors.text.tertiary,
    fontFamily: Fonts.body,
    fontSize: FontSizes.sm,
    marginTop: Spacing[2],
    textAlign: 'center',
    lineHeight: 20,
  },
  clearAllButton: {
    marginTop: Spacing[3],
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    gap: Spacing[2],
    backgroundColor: MetroColors.background.primary,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
    borderRadius: BorderRadius.full,
    backgroundColor: MetroColors.background.secondary,
    ...Shadows.sm,
  },
  filterTabActive: {
    backgroundColor: MetroColors.accent.purple,
  },
  filterText: {
    color: MetroColors.text.secondary,
    fontFamily: Fonts.body,
    fontSize: FontSizes.sm,
    fontWeight: '500',
  },
  filterTextActive: {
    color: MetroColors.text.inverse,
  },
  filterBadge: {
    backgroundColor: MetroColors.background.secondary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    marginLeft: Spacing[2],
  },
  filterBadgeText: {
    color: MetroColors.accent.purple,
    fontFamily: Fonts.body,
    fontSize: FontSizes.xs,
    fontWeight: '600',
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
  emptyText: {
    color: MetroColors.text.secondary,
    fontFamily: Fonts.body,
    fontSize: FontSizes.lg,
    fontWeight: '600',
    marginTop: Spacing[3],
    marginBottom: Spacing[1],
  },
  emptySubtext: {
    color: MetroColors.text.muted,
    fontFamily: Fonts.body,
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
    fontFamily: Fonts.body,
    fontSize: FontSizes.sm,
    fontWeight: '600',
    marginBottom: Spacing[1],
  },
  rolloverCard: {
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[4],
  },
  rolloverHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing[2],
  },
  rolloverName: {
    color: MetroColors.text.primary,
    fontFamily: Fonts.body,
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  rolloverMeta: {
    color: MetroColors.text.tertiary,
    fontFamily: Fonts.body,
    fontSize: FontSizes.sm,
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
    marginRight: Spacing[2],
  },
  pledgeName: {
    color: MetroColors.text.primary,
    fontFamily: Fonts.body,
    fontSize: FontSizes.lg,
    fontWeight: '600',
    marginBottom: 4,
  },
  batchLabel: {
    color: MetroColors.text.tertiary,
    fontFamily: Fonts.body,
    fontSize: FontSizes.md,
    fontWeight: '500',
  },
  pledgeDetails: {
    color: MetroColors.text.tertiary,
    fontFamily: Fonts.body,
    fontSize: FontSizes.sm,
  },
  pledgePricing: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing[3],
    paddingVertical: Spacing[3],
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: MetroColors.border.default,
  },
  priceBlock: {
    alignItems: 'center',
  },
  priceBlockLabel: {
    color: MetroColors.text.tertiary,
    fontFamily: Fonts.body,
    fontSize: FontSizes.xs,
    fontWeight: '500',
    marginBottom: 4,
  },
  savingsAmount: {
    color: MetroColors.accent.green,
    fontFamily: Fonts.body,
    fontSize: FontSizes.xl,
    fontWeight: '700',
  },
  lockInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MetroColors.accent.purpleMuted,
    padding: Spacing[3],
    borderRadius: BorderRadius.md,
    marginBottom: Spacing[3],
    gap: Spacing[2],
  },
  lockText: {
    color: MetroColors.accent.purple,
    fontFamily: Fonts.body,
    fontSize: FontSizes.sm,
    flex: 1,
    fontWeight: '500',
  },
  progressSection: {
    marginBottom: Spacing[3],
  },
  progressText: {
    color: MetroColors.text.secondary,
    fontFamily: Fonts.body,
    fontSize: FontSizes.sm,
    marginBottom: Spacing[2],
    fontWeight: '500',
  },
  pledgeActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: Spacing[3],
  },
  completedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MetroColors.accent.greenMuted,
    padding: Spacing[3],
    borderRadius: BorderRadius.md,
    marginBottom: Spacing[3],
    gap: Spacing[2],
  },
  completedLabel: {
    color: MetroColors.accent.green,
    fontFamily: Fonts.body,
    fontSize: FontSizes.sm,
    fontWeight: '600',
    flex: 1,
  },
  completedDate: {
    color: MetroColors.accent.green,
    fontFamily: Fonts.body,
    fontSize: FontSizes.sm,
    fontWeight: '500',
  },
  pledgeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: Spacing[3],
    borderTopWidth: 1,
    borderTopColor: MetroColors.border.default,
  },
  pledgeId: {
    color: MetroColors.text.muted,
    fontFamily: Fonts.body,
    fontSize: FontSizes.xs,
    fontWeight: '500',
  },
  pledgeDate: {
    color: MetroColors.text.muted,
    fontFamily: Fonts.body,
    fontSize: FontSizes.xs,
    fontWeight: '500',
  },
});
