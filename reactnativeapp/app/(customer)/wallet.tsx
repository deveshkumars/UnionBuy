/**
 * Wallet Screen - Customer Finances
 * Clean, warm design for balance and transaction history
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
    MetroCard,
    PriceDisplay,
    StatusBadge,
    TrustScore,
} from '@/components/metro';
import { BorderRadius, FontSizes, Fonts, MetroColors, Shadows, Spacing } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { fetchWallet } from '@/services/api';
import { Transaction, Wallet } from '@/types';

export default function WalletScreen() {
  const router = useRouter();
  const { user } = useApp();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadWallet();
  }, []);

  const loadWallet = async () => {
    const walletData = await fetchWallet(user.id);
    setWallet(walletData);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadWallet();
    setRefreshing(false);
  };

  if (!wallet) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading wallet...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerLabel}>Union Buy</Text>
          <Text style={styles.headerTitle}>Wallet</Text>
        </View>
        <TouchableOpacity 
          style={styles.headerIconButton}
          onPress={() => router.push('/(customer)/cart')}
        >
          <Ionicons name="cart-outline" size={24} color={MetroColors.text.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={MetroColors.accent.cyan}
          />
        }
      >
        {/* Balance Card */}
        <MetroCard variant="active" style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <PriceDisplay
            amount={wallet.balance}
            size="xl"
            variant="highlight"
          />
          <View style={styles.balanceDetails}>
            <View style={styles.balanceItem}>
              <Text style={styles.balanceItemLabel}>Locked</Text>
              <Text style={[styles.balanceItemValue, { color: MetroColors.accent.orange }]}>
                ${wallet.lockedFunds.toFixed(2)}
              </Text>
            </View>
            <View style={styles.balanceDivider} />
            <View style={styles.balanceItem}>
              <Text style={styles.balanceItemLabel}>Credits</Text>
              <Text style={[styles.balanceItemValue, { color: MetroColors.accent.green }]}>
                ${wallet.discountCredits.toFixed(2)}
              </Text>
            </View>
          </View>
        </MetroCard>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <MetroCard style={styles.statCard}>
            <Ionicons name="trending-up" size={24} color={MetroColors.accent.green} style={styles.statIcon} />
            <Text style={styles.statLabel}>Total Saved</Text>
            <Text style={styles.statValue}>${wallet.totalSavings.toFixed(2)}</Text>
            <Text style={styles.statSubtext}>lifetime savings</Text>
          </MetroCard>

          <MetroCard style={styles.statCard}>
            <Ionicons name="star" size={24} color={MetroColors.accent.orange} style={styles.statIcon} />
            <Text style={styles.statLabel}>Trust Score</Text>
            <TrustScore score={user.trustScore} />
          </MetroCard>
        </View>

        {/* Quick Stats */}
        <MetroCard style={styles.quickStats}>
          <View style={styles.quickStatsRow}>
            <QuickStat label="Pledges" value="12" icon="receipt-outline" />
            <QuickStat label="Completed" value="10" icon="checkmark-circle-outline" color={MetroColors.accent.green} />
            <QuickStat label="Cancelled" value="1" icon="close-circle-outline" />
            <QuickStat label="Active" value="2" icon="time-outline" color={MetroColors.accent.cyan} />
          </View>
        </MetroCard>

        {/* Transactions */}
        <View style={styles.transactionsHeader}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <Text style={styles.sectionCount}>
            {wallet.transactions.length} items
          </Text>
        </View>

        {wallet.transactions.map((transaction) => (
          <TransactionRow key={transaction.id} transaction={transaction} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function QuickStat({
  label,
  value,
  icon,
  color = MetroColors.text.primary,
}: {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  color?: string;
}) {
  return (
    <View style={styles.quickStatItem}>
      <Ionicons name={icon} size={20} color={MetroColors.text.muted} style={styles.quickStatIcon} />
      <Text style={[styles.quickStatValue, { color }]}>{value}</Text>
      <Text style={styles.quickStatLabel}>{label}</Text>
    </View>
  );
}

function TransactionRow({ transaction }: { transaction: Transaction }) {
  const isPositive = transaction.amount > 0;
  const typeLabels: Record<string, string> = {
    pledge_hold: 'Pledge Hold',
    pledge_capture: 'Order Charged',
    pledge_release: 'Funds Released',
    refund: 'Refund',
    discount_applied: 'Discount Credit',
    runner_earnings: 'Runner Earnings',
    tip: 'Tip',
  };

  const typeVariants: Record<string, 'info' | 'success' | 'warning' | 'default'> = {
    pledge_hold: 'warning',
    pledge_capture: 'info',
    pledge_release: 'success',
    refund: 'success',
    discount_applied: 'success',
  };

  const typeIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
    pledge_hold: 'lock-closed-outline',
    pledge_capture: 'card-outline',
    pledge_release: 'lock-open-outline',
    refund: 'refresh-outline',
    discount_applied: 'gift-outline',
    runner_earnings: 'car-outline',
    tip: 'heart-outline',
  };

  return (
    <MetroCard style={styles.transactionCard}>
      <View style={styles.transactionHeader}>
        <View style={styles.transactionIconContainer}>
          <Ionicons 
            name={typeIcons[transaction.type] || 'receipt-outline'} 
            size={20} 
            color={MetroColors.text.tertiary} 
          />
        </View>
        <View style={styles.transactionInfo}>
          <StatusBadge
            label={typeLabels[transaction.type] || transaction.type}
            variant={typeVariants[transaction.type] || 'default'}
            size="sm"
          />
          <Text style={styles.transactionDesc}>{transaction.description}</Text>
        </View>
        <Text
          style={[
            styles.transactionAmount,
            isPositive ? styles.amountPositive : styles.amountNegative,
          ]}
        >
          {isPositive ? '+' : ''}${Math.abs(transaction.amount).toFixed(2)}
        </Text>
      </View>
      <View style={styles.transactionFooter}>
        <Text style={styles.transactionDate}>
          {new Date(transaction.createdAt).toLocaleString()}
        </Text>
        <Text
          style={[
            styles.transactionStatus,
            transaction.status === 'pending' && styles.statusPending,
          ]}
        >
          {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
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
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    backgroundColor: MetroColors.background.secondary,
    ...Shadows.sm,
  },
  headerLabel: {
    color: MetroColors.accent.green,
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing[4],
    paddingBottom: Spacing[10],
  },
  balanceCard: {
    alignItems: 'center',
    paddingVertical: Spacing[6],
    marginBottom: Spacing[4],
  },
  balanceLabel: {
    color: MetroColors.text.tertiary,
    fontFamily: Fonts.body,
    fontSize: FontSizes.sm,
    fontWeight: '500',
    marginBottom: Spacing[2],
  },
  balanceDetails: {
    flexDirection: 'row',
    marginTop: Spacing[4],
    paddingTop: Spacing[4],
    borderTopWidth: 1,
    borderTopColor: MetroColors.border.default,
  },
  balanceItem: {
    alignItems: 'center',
    paddingHorizontal: Spacing[6],
  },
  balanceDivider: {
    width: 1,
    backgroundColor: MetroColors.border.default,
  },
  balanceItemLabel: {
    color: MetroColors.text.tertiary,
    fontFamily: Fonts.body,
    fontSize: FontSizes.sm,
    fontWeight: '500',
    marginBottom: 4,
  },
  balanceItemValue: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.xl,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing[3],
    marginBottom: Spacing[4],
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing[4],
  },
  statIcon: {
    marginBottom: Spacing[2],
  },
  statLabel: {
    color: MetroColors.text.tertiary,
    fontFamily: Fonts.body,
    fontSize: FontSizes.sm,
    fontWeight: '500',
    marginBottom: Spacing[1],
  },
  statValue: {
    color: MetroColors.accent.green,
    fontFamily: Fonts.body,
    fontSize: FontSizes['2xl'],
    fontWeight: '700',
  },
  statSubtext: {
    color: MetroColors.text.muted,
    fontFamily: Fonts.body,
    fontSize: FontSizes.xs,
    marginTop: 2,
  },
  quickStats: {
    marginBottom: Spacing[4],
    paddingVertical: Spacing[4],
  },
  quickStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  quickStatItem: {
    alignItems: 'center',
  },
  quickStatIcon: {
    marginBottom: 4,
  },
  quickStatLabel: {
    color: MetroColors.text.tertiary,
    fontFamily: Fonts.body,
    fontSize: FontSizes.xs,
    fontWeight: '500',
    marginTop: 2,
  },
  quickStatValue: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.xl,
    fontWeight: '700',
  },
  transactionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing[3],
  },
  sectionTitle: {
    color: MetroColors.text.primary,
    fontFamily: Fonts.body,
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  sectionCount: {
    color: MetroColors.text.muted,
    fontFamily: Fonts.body,
    fontSize: FontSizes.sm,
  },
  transactionCard: {
    marginBottom: Spacing[2],
  },
  transactionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  transactionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: MetroColors.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing[3],
  },
  transactionInfo: {
    flex: 1,
    gap: Spacing[1],
  },
  transactionDesc: {
    color: MetroColors.text.secondary,
    fontFamily: Fonts.body,
    fontSize: FontSizes.sm,
    lineHeight: 20,
  },
  transactionAmount: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.lg,
    fontWeight: '700',
    marginLeft: Spacing[2],
  },
  amountPositive: {
    color: MetroColors.accent.green,
  },
  amountNegative: {
    color: MetroColors.text.primary,
  },
  transactionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing[3],
    paddingTop: Spacing[3],
    borderTopWidth: 1,
    borderTopColor: MetroColors.border.default,
  },
  transactionDate: {
    color: MetroColors.text.muted,
    fontFamily: Fonts.body,
    fontSize: FontSizes.sm,
  },
  transactionStatus: {
    color: MetroColors.accent.green,
    fontFamily: Fonts.body,
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
  statusPending: {
    color: MetroColors.accent.orange,
  },
});
