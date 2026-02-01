/**
 * Wallet Screen - Customer Finances
 * Balance, locked funds, transaction history, and trust score
 */

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
import { FontSizes, Fonts, MetroColors, Spacing } from '@/constants/theme';
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
          <Text style={styles.loadingText}>LOADING WALLET...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerLabel}>UNION BUY</Text>
          <Text style={styles.headerTitle}>Wallet</Text>
        </View>
        <TouchableOpacity style={styles.utilityPill} onPress={() => router.push('/(customer)/cart')}>
          <Text style={styles.utilityIcon}>CRT</Text>
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
        <MetroCard variant="active" glowing style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>AVAILABLE BALANCE</Text>
          <PriceDisplay
            amount={wallet.balance}
            size="xl"
            variant="highlight"
          />
          <View style={styles.balanceDetails}>
            <View style={styles.balanceItem}>
              <Text style={styles.balanceItemLabel}>LOCKED</Text>
              <Text style={styles.balanceItemValue}>
                ${wallet.lockedFunds.toFixed(2)}
              </Text>
            </View>
            <View style={styles.balanceDivider} />
            <View style={styles.balanceItem}>
              <Text style={styles.balanceItemLabel}>CREDITS</Text>
              <Text style={[styles.balanceItemValue, styles.creditsValue]}>
                ${wallet.discountCredits.toFixed(2)}
              </Text>
            </View>
          </View>
        </MetroCard>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <MetroCard style={styles.statCard}>
            <Text style={styles.statLabel}>TOTAL SAVED</Text>
            <Text style={styles.statValue}>${wallet.totalSavings.toFixed(2)}</Text>
            <Text style={styles.statSubtext}>lifetime savings</Text>
          </MetroCard>

          <MetroCard style={styles.statCard}>
            <Text style={styles.statLabel}>TRUST SCORE</Text>
            <TrustScore score={user.trustScore} />
          </MetroCard>
        </View>

        {/* Quick Stats */}
        <MetroCard style={styles.quickStats}>
          <View style={styles.quickStatsRow}>
            <QuickStat label="PLEDGES" value="12" />
            <QuickStat label="COMPLETED" value="10" />
            <QuickStat label="CANCELLED" value="1" />
            <QuickStat label="ACTIVE" value="2" highlight />
          </View>
        </MetroCard>

        {/* Transactions */}
        <View style={styles.transactionsHeader}>
          <Text style={styles.sectionTitle}>RECENT TRANSACTIONS</Text>
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
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <View style={styles.quickStatItem}>
      <Text style={styles.quickStatLabel}>{label}</Text>
      <Text
        style={[
          styles.quickStatValue,
          highlight && { color: MetroColors.accent.cyan },
        ]}
      >
        {value}
      </Text>
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

  return (
    <MetroCard style={styles.transactionCard}>
      <View style={styles.transactionHeader}>
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
          {transaction.status.toUpperCase()}
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
    fontFamily: Fonts.mono,
    fontSize: FontSizes.sm,
    letterSpacing: 1,
  },
  header: {
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: MetroColors.border.muted,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    backgroundColor: MetroColors.background.secondary,
  },
  headerLabel: {
    color: MetroColors.accent.green,
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
    color: MetroColors.accent.cyan,
    fontFamily: Fonts.mono,
    fontSize: 10,
    letterSpacing: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing[3],
    paddingBottom: Spacing[9],
  },
  balanceCard: {
    alignItems: 'center',
    paddingVertical: Spacing[5],
    marginBottom: Spacing[3],
  },
  balanceLabel: {
    color: MetroColors.text.tertiary,
    fontFamily: Fonts.sans,
    fontSize: FontSizes.sm,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: Spacing[3],
  },
  balanceDetails: {
    flexDirection: 'row',
    marginTop: Spacing[4],
    paddingTop: Spacing[3],
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
    color: MetroColors.text.secondary,
    fontFamily: Fonts.sansBold,
    fontSize: FontSizes.sm,
    fontWeight: '700',
    marginBottom: 4,
  },
  balanceItemValue: {
    color: MetroColors.accent.orange,
    fontFamily: Fonts.heading,
    fontSize: FontSizes['2xl'],
    fontWeight: '800',
  },
  creditsValue: {
    color: MetroColors.accent.green,
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
  statLabel: {
    color: MetroColors.text.tertiary,
    fontFamily: Fonts.sans,
    fontSize: FontSizes.sm,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: Spacing[2],
  },
  statValue: {
    color: MetroColors.accent.green,
    fontFamily: Fonts.heading,
    fontSize: FontSizes['3xl'],
    fontWeight: '800',
  },
  statSubtext: {
    color: MetroColors.text.tertiary,
    fontFamily: Fonts.body,
    fontSize: FontSizes.sm,
    marginTop: 4,
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
  quickStatLabel: {
    color: MetroColors.text.secondary,
    fontFamily: Fonts.sansBold,
    fontSize: FontSizes.sm,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  quickStatValue: {
    color: MetroColors.text.primary,
    fontFamily: Fonts.heading,
    fontSize: FontSizes['2xl'],
    fontWeight: '800',
  },
  transactionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing[3],
  },
  sectionTitle: {
    color: MetroColors.text.primary,
    fontFamily: Fonts.sans,
    fontSize: FontSizes.md,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  sectionCount: {
    color: MetroColors.text.tertiary,
    fontFamily: Fonts.body,
    fontSize: FontSizes.sm,
  },
  transactionCard: {
    marginBottom: Spacing[2],
    paddingVertical: Spacing[4],
    paddingHorizontal: Spacing[4],
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  transactionInfo: {
    flex: 1,
    gap: Spacing[2],
  },
  transactionDesc: {
    color: MetroColors.text.secondary,
    fontFamily: Fonts.body,
    fontSize: FontSizes.md,
    lineHeight: 20,
  },
  transactionAmount: {
    fontFamily: Fonts.heading,
    fontSize: FontSizes['2xl'],
    fontWeight: '800',
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
    borderTopColor: MetroColors.border.muted,
  },
  transactionDate: {
    color: MetroColors.text.secondary,
    fontFamily: Fonts.body,
    fontSize: FontSizes.md,
    fontWeight: '500',
  },
  transactionStatus: {
    color: MetroColors.accent.green,
    fontFamily: Fonts.sansBold,
    fontSize: FontSizes.md,
    fontWeight: '700',
  },
  statusPending: {
    color: MetroColors.accent.orange,
  },
});
