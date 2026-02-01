/**
 * Job Board Screen - Runner Home
 * Available missions with earnings, cargo, and accept/reject actions
 */

import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
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
import { FontSizes, Fonts, MetroColors, Spacing } from '@/constants/theme';
import { useApp, useMission } from '@/context/AppContext';
import { acceptMission, fetchAvailableMissions } from '@/services/api';
import { Mission } from '@/types';

export default function JobBoardScreen() {
  const router = useRouter();
  const { user } = useApp();
  const { activeMission, setActiveMission } = useMission();
  const [availableMissions, setAvailableMissions] = useState<Mission[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [accepting, setAccepting] = useState<string | null>(null);

  useEffect(() => {
    loadMissions();
  }, []);

  const loadMissions = async () => {
    const missions = await fetchAvailableMissions();
    setAvailableMissions(missions);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMissions();
    setRefreshing(false);
  };

  const handleAcceptMission = async (mission: Mission) => {
    Alert.alert(
      'Accept Mission',
      `Accept this mission for estimated $${mission.estimatedEarnings.toFixed(2)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: async () => {
            setAccepting(mission.id);
            const result = await acceptMission(mission.id);
            setAccepting(null);
            
            if (result.success && result.mission) {
              setActiveMission(result.mission);
              Alert.alert('Mission Accepted', 'Navigate to the Mission tab to begin.');
              router.push('/(runner)/mission');
            } else {
              Alert.alert('Error', result.error || 'Failed to accept mission');
            }
          },
        },
      ]
    );
  };

  const handleDeclineMission = (mission: Mission) => {
    Alert.alert(
      'Decline Mission',
      'Are you sure you want to decline this mission?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: () => {
            // Remove mission from available list
            setAvailableMissions(availableMissions.filter(m => m.id !== mission.id));
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerLabel}>UNION BUY</Text>
          <Text style={styles.headerTitle}>Runner Board</Text>
        </View>
        <View style={styles.headerRight}>
          <StatusBadge
            label={activeMission ? 'ON MISSION' : 'AVAILABLE'}
            variant={activeMission ? 'success' : 'info'}
            size="sm"
            pulse={!!activeMission}
          />
        </View>
      </View>

      {/* Stats Bar */}
      <InfoBar
        items={[
          { label: 'TODAY', value: `$${0}` },
          { label: 'THIS WEEK', value: `$${127.50}` },
          { label: 'RATING', value: user.trustScore.toFixed(1), highlight: true },
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
          <MetroCard variant="success" glowing style={styles.activeMissionCard}>
            <View style={styles.activeMissionHeader}>
              <Text style={styles.activeMissionTitle}>ACTIVE MISSION</Text>
              <StatusBadge
                label={activeMission.status.replace('_', ' ').toUpperCase()}
                variant="success"
                size="sm"
              />
            </View>
            <Text style={styles.activeMissionInfo}>
              {activeMission.totalItems} items • {activeMission.stores.length} stores
            </Text>
            <MetroButton
              title="CONTINUE MISSION"
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
          <Text style={styles.sectionTitle}>AVAILABLE ORDERS</Text>
          <Text style={styles.sectionCount}>
            {availableMissions.length} available
          </Text>
        </View>

        {/* Mission Cards */}
        {availableMissions.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>▣</Text>
            <Text style={styles.emptyText}>NO ORDERS AVAILABLE</Text>
            <Text style={styles.emptySubtext}>
              Check back after the next cutoff time
            </Text>
          </View>
        ) : (
          availableMissions.map((mission) => (
            <MissionCard
              key={mission.id}
              mission={mission}
              onAccept={() => handleAcceptMission(mission)}
              onDecline={() => handleDeclineMission(mission)}
              accepting={accepting === mission.id}
              disabled={!!activeMission}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

interface MissionCardProps {
  mission: Mission;
  onAccept: () => void;
  onDecline: () => void;
  accepting: boolean;
  disabled: boolean;
}

function MissionCard({ mission, onAccept, onDecline, accepting, disabled }: MissionCardProps) {
  const storeNames = mission.stores.map((s) => s.name).join(' -> ');

  return (
    <MetroCard variant="active" style={styles.missionCard}>
      <View style={styles.missionHeader}>
        <View style={styles.missionHeaderLeft}>
          <Text style={styles.missionTitle}>
            ORDER #{mission.id.slice(-4).toUpperCase()}
          </Text>
          <Text style={styles.missionStores} numberOfLines={1} ellipsizeMode="tail">
            {storeNames}
          </Text>
        </View>
        <View style={styles.earningsContainer}>
          <Text style={styles.earningsLabel}>ESTIMATED</Text>
          <PriceDisplay
            amount={mission.estimatedEarnings}
            size="xl"
            variant="success"
          />
        </View>
      </View>

      <View style={styles.missionStats}>
        <MissionStat
          label="ITEMS"
          value={mission.totalItems}
          icon="[]"
        />
        <MissionStat
          label="WEIGHT"
          value={`${mission.totalWeight || '~'}lbs`}
          icon="◈"
        />
        <MissionStat
          label="DISTANCE"
          value={`${mission.route.totalDistance}mi`}
          icon="O"
        />
        <MissionStat
          label="TIME"
          value={`~${mission.route.estimatedTime}min`}
          icon="◉"
        />
      </View>

      <View style={styles.missionRoute}>
        <Text style={styles.routeLabel}>ROUTE</Text>
        <View style={styles.routeSteps}>
          {mission.stores.map((store, index) => (
            <View key={store.id} style={styles.routeStep}>
              <View style={styles.routeStepDot} />
              <Text style={styles.routeStepText}>{store.name}</Text>
              {index < mission.stores.length - 1 && (
                <Text style={styles.routeArrow}>{'\u2192'}</Text>
              )}
            </View>
          ))}
          <View style={styles.routeStep}>
            <View style={[styles.routeStepDot, styles.routeStepDotFinal]} />
            <Text style={styles.routeStepText}>Drop Zone</Text>
          </View>
        </View>
      </View>

      <View style={styles.missionFooter}>
        <View style={styles.missionMeta}>
          <Text style={styles.metaText} numberOfLines={1}>
            Created {new Date(mission.createdAt).toLocaleTimeString()}
          </Text>
        </View>
        <View style={styles.missionActions}>
          <MetroButton
            title="DECLINE"
            variant="ghost"
            size="sm"
            onPress={onDecline}
            disabled={disabled}
          />
          <MetroButton
            title={accepting ? 'ACCEPTING...' : 'ACCEPT'}
            variant="primary"
            size="md"
            onPress={onAccept}
            loading={accepting}
            disabled={disabled}
          />
        </View>
      </View>
    </MetroCard>
  );
}

function MissionStat({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: string;
}) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statIcon}>{icon}</Text>
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
    borderBottomWidth: 1,
    borderBottomColor: MetroColors.accent.green + '40',
  },
  headerLabel: {
    color: MetroColors.accent.green,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.md,
    letterSpacing: 2,
    fontWeight: '600',
  },
  headerTitle: {
    color: MetroColors.text.primary,
    fontFamily: Fonts.sans,
    fontSize: FontSizes['3xl'],
    fontWeight: '800',
    letterSpacing: 1,
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing[2],
  },
  activeMissionTitle: {
    color: MetroColors.accent.green,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.xl,
    fontWeight: '800',
    letterSpacing: 1,
  },
  activeMissionInfo: {
    color: MetroColors.text.secondary,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.lg,
    fontWeight: '600',
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
    fontFamily: Fonts.mono,
    fontSize: FontSizes.lg,
    fontWeight: '700',
    letterSpacing: 1,
  },
  sectionCount: {
    color: MetroColors.text.muted,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.md,
    fontWeight: '600',
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
    fontSize: FontSizes.xl,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: Spacing[2],
  },
  emptySubtext: {
    color: MetroColors.text.muted,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.md,
    textAlign: 'center',
  },
  missionCard: {
    marginBottom: Spacing[4],
  },
  missionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing[3],
  },
  missionHeaderLeft: {
    flex: 1,
    flexShrink: 1,
    marginRight: Spacing[2],
  },
  missionTitle: {
    color: MetroColors.text.primary,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.xl,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 4,
  },
  missionStores: {
    color: MetroColors.text.muted,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.md,
    fontWeight: '500',
  },
  earningsContainer: {
    alignItems: 'flex-end',
    flexShrink: 0,
    minWidth: 90,
  },
  earningsLabel: {
    color: MetroColors.text.muted,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.sm,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  missionStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing[3],
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: MetroColors.border.muted,
    marginBottom: Spacing[3],
  },
  statItem: {
    alignItems: 'center',
    gap: 2,
  },
  statIcon: {
    color: MetroColors.accent.green,
    fontSize: 16,
  },
  statValue: {
    color: MetroColors.text.primary,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.lg,
    fontWeight: '700',
  },
  statLabel: {
    color: MetroColors.text.muted,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.sm,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  missionRoute: {
    marginBottom: Spacing[3],
  },
  routeLabel: {
    color: MetroColors.text.muted,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.md,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: Spacing[2],
  },
  routeSteps: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: Spacing[2],
  },
  routeStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[1],
  },
  routeStepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: MetroColors.accent.cyan,
  },
  routeStepDotFinal: {
    backgroundColor: MetroColors.accent.green,
  },
  routeStepText: {
    color: MetroColors.text.secondary,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  routeArrow: {
    color: MetroColors.text.muted,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.sm,
    marginLeft: Spacing[1],
  },
  missionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing[3],
    borderTopWidth: 1,
    borderTopColor: MetroColors.border.muted,
    flexWrap: 'wrap',
    gap: Spacing[2],
  },
  missionMeta: {
    flexShrink: 1,
    minWidth: 80,
  },
  metaText: {
    color: MetroColors.text.muted,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.sm,
    fontWeight: '500',
  },
  missionActions: {
    flexDirection: 'row',
    gap: Spacing[2],
    flexShrink: 0,
  },
});
