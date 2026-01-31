/**
 * Job Board Screen - Runner Home
 * Available missions with earnings, cargo, and accept/reject actions
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  MetroCard,
  MetroButton,
  PriceDisplay,
  StatusBadge,
  InfoBar,
} from '@/components/metro';
import { MetroColors, FontSizes, Fonts, Spacing, Shadows } from '@/constants/theme';
import { useMission, useApp } from '@/context/AppContext';
import { fetchAvailableMissions, acceptMission } from '@/services/api';
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
  accepting: boolean;
  disabled: boolean;
}

function MissionCard({ mission, onAccept, accepting, disabled }: MissionCardProps) {
  const storeNames = mission.stores.map((s) => s.name).join(' → ');

  return (
    <MetroCard variant="active" style={styles.missionCard}>
      <View style={styles.missionHeader}>
        <View>
          <Text style={styles.missionTitle}>
            ORDER #{mission.id.slice(-4).toUpperCase()}
          </Text>
          <Text style={styles.missionStores}>{storeNames}</Text>
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
          icon="◇"
        />
        <MissionStat
          label="WEIGHT"
          value={`${mission.totalWeight || '~'}lbs`}
          icon="◈"
        />
        <MissionStat
          label="DISTANCE"
          value={`${mission.route.totalDistance}mi`}
          icon="◎"
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
                <Text style={styles.routeArrow}>→</Text>
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
          <Text style={styles.metaText}>
            Created {new Date(mission.createdAt).toLocaleTimeString()}
          </Text>
        </View>
        <View style={styles.missionActions}>
          <MetroButton
            title="DECLINE"
            variant="ghost"
            size="sm"
            onPress={() => {}}
            disabled={disabled}
          />
          <MetroButton
            title={accepting ? 'ACCEPTING...' : 'ACCEPT MISSION'}
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
    fontSize: FontSizes.md,
    fontWeight: '700',
    letterSpacing: 1,
  },
  activeMissionInfo: {
    color: MetroColors.text.secondary,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.sm,
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
    fontSize: FontSizes.sm,
    letterSpacing: 1,
  },
  sectionCount: {
    color: MetroColors.text.muted,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.xs,
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
  },
  missionCard: {
    marginBottom: Spacing[4],
  },
  missionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing[3],
  },
  missionTitle: {
    color: MetroColors.text.primary,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.lg,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 4,
  },
  missionStores: {
    color: MetroColors.text.muted,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.xs,
  },
  earningsContainer: {
    alignItems: 'flex-end',
  },
  earningsLabel: {
    color: MetroColors.text.muted,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.xs,
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
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  statLabel: {
    color: MetroColors.text.muted,
    fontFamily: Fonts.mono,
    fontSize: 9,
    letterSpacing: 0.5,
  },
  missionRoute: {
    marginBottom: Spacing[3],
  },
  routeLabel: {
    color: MetroColors.text.muted,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.xs,
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
    fontSize: FontSizes.sm,
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
  },
  missionMeta: {},
  metaText: {
    color: MetroColors.text.muted,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.xs,
  },
  missionActions: {
    flexDirection: 'row',
    gap: Spacing[2],
  },
});
