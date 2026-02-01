/**
 * Job Board Screen - Runner Home
 * Clean, warm design for available missions and stacked orders
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
    InfoBar,
    MetroButton,
    MetroCard,
    PriceDisplay,
    StatusBadge,
} from '@/components/metro';
import { BorderRadius, Fonts, FontSizes, MetroColors, Shadows, Spacing } from '@/constants/theme';
import { useApp, useMission } from '@/context/AppContext';
import { acceptMission, fetchStackedMissions, MissionStack } from '@/services/api';
import { Mission } from '@/types';

export default function JobBoardScreen() {
  const router = useRouter();
  const { user } = useApp();
  const { activeMission, setActiveMission, setDistributionsComplete } = useMission();
  const [missionStacks, setMissionStacks] = useState<MissionStack[]>([]);
  const [expandedStacks, setExpandedStacks] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);
  const [accepting, setAccepting] = useState<string | null>(null);

  useEffect(() => {
    loadMissions();
  }, []);

  const loadMissions = async () => {
    const stacks = await fetchStackedMissions();
    setMissionStacks(stacks);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMissions();
    setRefreshing(false);
  };

  const toggleStackExpand = (stackId: string) => {
    setExpandedStacks((prev) => {
      const next = new Set(prev);
      if (next.has(stackId)) {
        next.delete(stackId);
      } else {
        next.add(stackId);
      }
      return next;
    });
  };

  const handleAcceptStack = async (stack: MissionStack) => {
    if (stack.missions.length === 0) return;

    Alert.alert(
      'Accept Zone Stack',
      `Accept all ${stack.missions.length} orders in ${stack.zoneName} for estimated $${stack.totalEarnings.toFixed(2)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept All',
          onPress: async () => {
            setAccepting(stack.id);
            
            const acceptedMissionIds: string[] = [];
            let firstAcceptedMission: Mission | null = null;
            const allOrders: any[] = [];
            
            for (const mission of stack.missions) {
              const result = await acceptMission(mission.id, user.id);
              if (result.success && result.mission) {
                acceptedMissionIds.push(mission.id);
                if (result.mission.orders) {
                  allOrders.push(...result.mission.orders);
                }
                if (!firstAcceptedMission) {
                  firstAcceptedMission = result.mission;
                }
              }
            }
            
            setAccepting(null);

            if (firstAcceptedMission && acceptedMissionIds.length > 0) {
              const stackedMission: Mission = {
                ...firstAcceptedMission,
                totalItems: stack.totalItems,
                totalWeight: stack.totalWeight,
                estimatedEarnings: stack.totalEarnings,
                orders: allOrders,
                stackedMissionIds: acceptedMissionIds,
              };
              setActiveMission(stackedMission);
              setDistributionsComplete(false);
              setMissionStacks((prev) => prev.filter((s) => s.id !== stack.id));
              Alert.alert('Stack Accepted', `You've accepted ${acceptedMissionIds.length} orders in ${stack.zoneName}. Navigate to Mission tab to begin.`);
              router.push('/(runner)/mission');
            } else {
              Alert.alert('Error', 'Failed to accept mission');
            }
          },
        },
      ]
    );
  };

  const handleDeclineStack = (stack: MissionStack) => {
    Alert.alert(
      'Decline Zone Stack',
      `Decline all ${stack.missions.length} orders in ${stack.zoneName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: () => {
            setMissionStacks((prev) => prev.filter((s) => s.id !== stack.id));
          },
        },
      ]
    );
  };

  const totalMissions = missionStacks.reduce((sum, s) => sum + s.missions.length, 0);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerLabel}>Union Buy</Text>
          <Text style={styles.headerTitle}>Runner Board</Text>
        </View>
        <View style={styles.headerRight}>
          <StatusBadge
            label={activeMission ? 'On Mission' : 'Available'}
            variant={activeMission ? 'success' : 'info'}
            size="sm"
            pulse={!!activeMission}
          />
        </View>
      </View>

      {/* Stats Bar */}
      <InfoBar
        items={[
          { label: 'Today', value: '$0' },
          { label: 'This Week', value: '$127.50' },
          { label: 'Rating', value: user.trustScore.toFixed(1), highlight: true },
        ]}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={MetroColors.accent.green}
          />
        }
      >
        {/* Active Mission Alert */}
        {activeMission && (
          <MetroCard variant="success" style={styles.activeMissionCard}>
            <View style={styles.activeMissionHeader}>
              <Ionicons name="navigate" size={24} color={MetroColors.accent.green} />
              <Text style={styles.activeMissionTitle}>Active Mission</Text>
              <StatusBadge
                label={activeMission.status.replace('_', ' ')}
                variant="success"
                size="sm"
              />
            </View>
            <Text style={styles.activeMissionInfo}>
              {activeMission.totalItems} items · {activeMission.stores.length} stores
            </Text>
            <MetroButton
              title="Continue Mission"
              variant="primary"
              size="md"
              fullWidth
              onPress={() => router.push('/(runner)/mission')}
              style={styles.continueButton}
            />
          </MetroCard>
        )}

        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Available Stacks</Text>
          <Text style={styles.sectionCount}>
            {missionStacks.length} zones · {totalMissions} orders
          </Text>
        </View>

        {/* Stacked Mission Cards */}
        {missionStacks.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="briefcase-outline" size={48} color={MetroColors.text.muted} />
            <Text style={styles.emptyText}>No Orders Available</Text>
            <Text style={styles.emptySubtext}>
              Check back after the next cutoff time
            </Text>
          </View>
        ) : (
          missionStacks.map((stack) => (
            <StackCard
              key={stack.id}
              stack={stack}
              expanded={expandedStacks.has(stack.id)}
              onToggleExpand={() => toggleStackExpand(stack.id)}
              onAccept={() => handleAcceptStack(stack)}
              onDecline={() => handleDeclineStack(stack)}
              accepting={accepting === stack.id}
              disabled={!!activeMission}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// Stack Card Component
interface StackCardProps {
  stack: MissionStack;
  expanded: boolean;
  onToggleExpand: () => void;
  onAccept: () => void;
  onDecline: () => void;
  accepting: boolean;
  disabled: boolean;
}

function StackCard({
  stack,
  expanded,
  onToggleExpand,
  onAccept,
  onDecline,
  accepting,
  disabled,
}: StackCardProps) {
  const storeNames = [...new Set(stack.missions.flatMap((m) => m.stores.map((s) => s.name)))];

  return (
    <MetroCard variant="active" style={styles.stackCard}>
      {/* Stack Header - Zone Info */}
      <TouchableOpacity onPress={onToggleExpand} activeOpacity={0.7}>
        <View style={styles.stackHeader}>
          <View style={styles.stackZoneInfo}>
            <View style={styles.zoneBadge}>
              <Text style={styles.zoneBadgeText}>{stack.missions.length}</Text>
            </View>
            <View style={styles.zoneDetails}>
              <Text style={styles.zoneName}>{stack.zoneName}</Text>
              <Text style={styles.zoneRadius}>
                {stack.zoneRadius < 0.5 ? 'Tight Cluster' : `~${stack.zoneRadius.toFixed(1)} mi radius`}
              </Text>
            </View>
          </View>
          <View style={styles.earningsContainer}>
            <Text style={styles.earningsLabel}>Total Earnings</Text>
            <PriceDisplay
              amount={stack.totalEarnings}
              size="xl"
              variant="success"
            />
          </View>
        </View>

        {/* Stack Stats */}
        <View style={styles.stackStats}>
          <StackStat label="Orders" value={stack.missions.length} icon="layers-outline" />
          <StackStat label="Items" value={stack.totalItems} icon="cube-outline" />
          <StackStat label="Weight" value={`${stack.totalWeight}lbs`} icon="scale-outline" />
          <StackStat label="Time" value={`~${stack.estimatedTime}min`} icon="time-outline" />
        </View>
      </TouchableOpacity>

      {/* Stores Route */}
      <View style={styles.storesSection}>
        <Text style={styles.storesLabel}>Stores</Text>
        <View style={styles.storesList}>
          {storeNames.map((name) => (
            <View key={name} style={styles.storeChip}>
              <Ionicons name="storefront-outline" size={14} color={MetroColors.accent.cyan} />
              <Text style={styles.storeChipText}>{name}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Expanded: Individual Orders */}
      {expanded && (
        <View style={styles.expandedSection}>
          <Text style={styles.expandedTitle}>Orders in this stack</Text>
          {stack.missions.map((mission, idx) => (
            <View key={mission.id} style={styles.orderRow}>
              <View style={styles.orderDot}>
                <Text style={styles.orderDotText}>{idx + 1}</Text>
              </View>
              <View style={styles.orderInfo}>
                <Text style={styles.orderAddress} numberOfLines={1}>
                  {mission.dropZone.address || 'Drop Zone'}
                </Text>
                <Text style={styles.orderMeta}>
                  {mission.totalItems} items · ${mission.estimatedEarnings.toFixed(2)}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Expand/Collapse Indicator */}
      <TouchableOpacity onPress={onToggleExpand} style={styles.expandToggle}>
        <Ionicons 
          name={expanded ? "chevron-up" : "chevron-down"} 
          size={20} 
          color={MetroColors.accent.cyan} 
        />
        <Text style={styles.expandToggleText}>
          {expanded ? 'Collapse' : 'View Individual Orders'}
        </Text>
      </TouchableOpacity>

      {/* Action Buttons */}
      <View style={styles.stackActions}>
        <MetroButton
          title="Decline"
          variant="ghost"
          size="sm"
          onPress={onDecline}
          disabled={disabled}
        />
        <MetroButton
          title={accepting ? 'Accepting...' : `Accept Stack (${stack.missions.length})`}
          variant="primary"
          size="md"
          onPress={onAccept}
          loading={accepting}
          disabled={disabled}
        />
      </View>
    </MetroCard>
  );
}

function StackStat({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View style={styles.statItem}>
      <Ionicons name={icon} size={18} color={MetroColors.accent.green} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
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
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing[4],
    paddingBottom: Spacing[10],
  },
  activeMissionCard: {
    marginBottom: Spacing[4],
  },
  activeMissionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    marginBottom: Spacing[2],
  },
  activeMissionTitle: {
    color: MetroColors.accent.green,
    fontFamily: Fonts.body,
    fontSize: FontSizes.lg,
    fontWeight: '700',
    flex: 1,
  },
  activeMissionInfo: {
    color: MetroColors.text.secondary,
    fontFamily: Fonts.body,
    fontSize: FontSizes.md,
    marginBottom: Spacing[3],
  },
  continueButton: {
    marginTop: Spacing[2],
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing[3],
  },
  sectionTitle: {
    color: MetroColors.text.secondary,
    fontFamily: Fonts.body,
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  sectionCount: {
    color: MetroColors.text.muted,
    fontFamily: Fonts.body,
    fontSize: FontSizes.sm,
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
  },
  // Stack Card Styles
  stackCard: {
    marginBottom: Spacing[3],
  },
  stackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing[3],
  },
  stackZoneInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: Spacing[3],
  },
  zoneBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: MetroColors.accent.cyanMuted,
    borderWidth: 2,
    borderColor: MetroColors.accent.cyan,
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoneBadgeText: {
    color: MetroColors.accent.cyan,
    fontFamily: Fonts.body,
    fontSize: FontSizes.xl,
    fontWeight: '700',
  },
  zoneDetails: {
    flex: 1,
  },
  zoneName: {
    color: MetroColors.text.primary,
    fontFamily: Fonts.body,
    fontSize: FontSizes.lg,
    fontWeight: '600',
  },
  zoneRadius: {
    color: MetroColors.text.muted,
    fontFamily: Fonts.body,
    fontSize: FontSizes.sm,
    marginTop: 2,
  },
  earningsContainer: {
    alignItems: 'flex-end',
    flexShrink: 0,
    minWidth: 100,
  },
  earningsLabel: {
    color: MetroColors.text.muted,
    fontFamily: Fonts.body,
    fontSize: FontSizes.xs,
    fontWeight: '500',
    marginBottom: 2,
  },
  stackStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing[3],
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: MetroColors.border.default,
    marginBottom: Spacing[3],
  },
  statItem: {
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    color: MetroColors.text.primary,
    fontFamily: Fonts.body,
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  statLabel: {
    color: MetroColors.text.muted,
    fontFamily: Fonts.body,
    fontSize: FontSizes.xs,
    fontWeight: '500',
  },
  storesSection: {
    marginBottom: Spacing[3],
  },
  storesLabel: {
    color: MetroColors.text.muted,
    fontFamily: Fonts.body,
    fontSize: FontSizes.xs,
    fontWeight: '500',
    marginBottom: Spacing[2],
  },
  storesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing[2],
  },
  storeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MetroColors.background.tertiary,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
    borderRadius: BorderRadius.full,
    gap: Spacing[1],
  },
  storeChipText: {
    color: MetroColors.text.secondary,
    fontFamily: Fonts.body,
    fontSize: FontSizes.sm,
    fontWeight: '500',
  },
  expandedSection: {
    backgroundColor: MetroColors.background.tertiary,
    borderRadius: BorderRadius.md,
    padding: Spacing[3],
    marginBottom: Spacing[3],
  },
  expandedTitle: {
    color: MetroColors.text.muted,
    fontFamily: Fonts.body,
    fontSize: FontSizes.xs,
    fontWeight: '600',
    marginBottom: Spacing[3],
  },
  orderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    marginBottom: Spacing[2],
    paddingBottom: Spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: MetroColors.border.default,
  },
  orderDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: MetroColors.accent.greenMuted,
    borderWidth: 1,
    borderColor: MetroColors.accent.green,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderDotText: {
    color: MetroColors.accent.green,
    fontFamily: Fonts.body,
    fontSize: FontSizes.xs,
    fontWeight: '600',
  },
  orderInfo: {
    flex: 1,
  },
  orderAddress: {
    color: MetroColors.text.primary,
    fontFamily: Fonts.body,
    fontSize: FontSizes.sm,
    fontWeight: '500',
  },
  orderMeta: {
    color: MetroColors.text.muted,
    fontFamily: Fonts.body,
    fontSize: FontSizes.xs,
    marginTop: 2,
  },
  expandToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[1],
    paddingVertical: Spacing[2],
    marginBottom: Spacing[3],
  },
  expandToggleText: {
    color: MetroColors.accent.cyan,
    fontFamily: Fonts.body,
    fontSize: FontSizes.sm,
    fontWeight: '500',
  },
  stackActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing[2],
    paddingTop: Spacing[3],
    borderTopWidth: 1,
    borderTopColor: MetroColors.border.default,
  },
});
