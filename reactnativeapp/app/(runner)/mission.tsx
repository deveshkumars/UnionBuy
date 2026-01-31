/**
 * Mission HUD Screen
 * Full-screen map with route, status indicator, and action buttons
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  MetroCard,
  MetroButton,
  StatusBadge,
  LocationIndicator,
  TargetReticle,
} from '@/components/metro';
import { MetroColors, FontSizes, Fonts, Spacing, Shadows } from '@/constants/theme';
import { useMission } from '@/context/AppContext';
import { updateMissionStatus } from '@/services/api';
import { MissionStatus } from '@/types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const statusFlow: MissionStatus[] = [
  'accepted',
  'en_route_to_store',
  'shopping',
  'checkout',
  'en_route_to_dropzone',
  'distributing',
  'completed',
];

const statusLabels: Record<MissionStatus, string> = {
  available: 'AVAILABLE',
  accepted: 'ACCEPTED',
  en_route_to_store: 'EN ROUTE TO STORE',
  shopping: 'SHOPPING',
  checkout: 'CHECKOUT',
  en_route_to_dropzone: 'EN ROUTE TO DROP',
  distributing: 'DISTRIBUTING',
  completed: 'COMPLETED',
};

const statusActions: Record<MissionStatus, string> = {
  available: 'Accept Mission',
  accepted: 'Start Navigation',
  en_route_to_store: 'Arrived at Store',
  shopping: 'Done Shopping',
  checkout: 'Payment Complete',
  en_route_to_dropzone: 'Arrived at Drop Zone',
  distributing: 'Distribution Complete',
  completed: 'Mission Complete',
};

export default function MissionScreen() {
  const router = useRouter();
  const { activeMission, setActiveMission } = useMission();
  const [updating, setUpdating] = useState(false);

  if (!activeMission) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.noMissionContainer}>
          <Text style={styles.noMissionIcon}>◉</Text>
          <Text style={styles.noMissionTitle}>NO ACTIVE MISSION</Text>
          <Text style={styles.noMissionSubtext}>
            Accept a mission from the Job Board to begin
          </Text>
          <MetroButton
            title="VIEW JOB BOARD"
            variant="primary"
            size="lg"
            onPress={() => router.push('/(runner)/')}
            style={styles.viewJobsButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  const currentStatusIndex = statusFlow.indexOf(activeMission.status);
  const nextStatus = statusFlow[currentStatusIndex + 1];

  const handleAdvanceStatus = async () => {
    if (!nextStatus) return;

    Alert.alert(
      'Update Status',
      `Mark as "${statusLabels[nextStatus]}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setUpdating(true);
            const result = await updateMissionStatus(activeMission.id, nextStatus);
            setUpdating(false);

            if (result.success) {
              if (nextStatus === 'completed') {
                Alert.alert(
                  'Mission Complete!',
                  `You earned $${(activeMission.estimatedEarnings + activeMission.tips).toFixed(2)}`,
                  [{ text: 'OK', onPress: () => setActiveMission(null) }]
                );
              } else {
                setActiveMission({ ...activeMission, status: nextStatus });
              }
            } else {
              Alert.alert('Error', result.error || 'Failed to update status');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Status Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.missionId}>
            MISSION #{activeMission.id.slice(-4).toUpperCase()}
          </Text>
          <StatusBadge
            label={statusLabels[activeMission.status]}
            variant={activeMission.status === 'completed' ? 'success' : 'info'}
            size="md"
            pulse={activeMission.status !== 'completed'}
          />
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.earningsLabel}>EARNINGS</Text>
          <Text style={styles.earningsValue}>
            ${(activeMission.estimatedEarnings + activeMission.tips).toFixed(2)}
          </Text>
        </View>
      </View>

      {/* Map Area */}
      <View style={styles.mapContainer}>
        {/* Grid overlay */}
        <View style={styles.gridOverlay}>
          {Array.from({ length: 12 }, (_, i) => (
            <View key={`h-${i}`} style={[styles.gridLine, styles.gridHorizontal, { top: `${(i + 1) * 8.33}%` }]} />
          ))}
          {Array.from({ length: 12 }, (_, i) => (
            <View key={`v-${i}`} style={[styles.gridLine, styles.gridVertical, { left: `${(i + 1) * 8.33}%` }]} />
          ))}
        </View>

        {/* Route visualization */}
        <View style={styles.routeContainer}>
          {/* Store markers */}
          {activeMission.stores.map((store, index) => (
            <View
              key={store.id}
              style={[
                styles.storeMarker,
                { top: `${30 + index * 15}%`, left: `${20 + index * 25}%` },
              ]}
            >
              <View style={[
                styles.markerDot,
                currentStatusIndex >= 2 + index && styles.markerDotVisited
              ]} />
              <Text style={styles.markerLabel}>{store.name.split(' ')[0]}</Text>
            </View>
          ))}

          {/* Drop zone */}
          <View style={styles.dropZoneMarker}>
            <TargetReticle
              size={60}
              color={currentStatusIndex >= 5 ? MetroColors.accent.green : MetroColors.accent.cyan}
              animated={currentStatusIndex === 5}
            />
            <Text style={styles.dropZoneLabel}>DROP ZONE</Text>
          </View>

          {/* Runner position */}
          <View style={[styles.runnerMarker, getRunnerPosition(activeMission.status)]}>
            <LocationIndicator size={40} color={MetroColors.accent.green} />
            <Text style={styles.runnerLabel}>YOU</Text>
          </View>

          {/* Route lines (simplified) */}
          <View style={styles.routeLine} />
        </View>

        {/* Map info overlay */}
        <View style={styles.mapInfo}>
          <Text style={styles.mapInfoText}>
            {activeMission.route.totalDistance} mi • {activeMission.route.estimatedTime} min
          </Text>
        </View>
      </View>

      {/* Status Progress */}
      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          {statusFlow.slice(0, -1).map((status, index) => {
            const isCompleted = index < currentStatusIndex;
            const isCurrent = index === currentStatusIndex;

            return (
              <View key={status} style={styles.progressStep}>
                <View
                  style={[
                    styles.progressDot,
                    isCompleted && styles.progressDotCompleted,
                    isCurrent && styles.progressDotCurrent,
                  ]}
                >
                  {isCompleted && <Text style={styles.checkmark}>✓</Text>}
                </View>
                {index < statusFlow.length - 2 && (
                  <View
                    style={[
                      styles.progressLine,
                      isCompleted && styles.progressLineCompleted,
                    ]}
                  />
                )}
              </View>
            );
          })}
        </View>
        <View style={styles.progressLabels}>
          <Text style={styles.progressLabel}>START</Text>
          <Text style={styles.progressLabel}>SHOP</Text>
          <Text style={styles.progressLabel}>PAY</Text>
          <Text style={styles.progressLabel}>DRIVE</Text>
          <Text style={styles.progressLabel}>DROP</Text>
          <Text style={styles.progressLabel}>DONE</Text>
        </View>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsRow}>
        <StatBox label="ITEMS" value={activeMission.totalItems} />
        <StatBox label="STORES" value={activeMission.stores.length} />
        <StatBox label="NEIGHBORS" value={5} />
      </View>

      {/* Action Button */}
      <View style={styles.actionContainer}>
        {nextStatus ? (
          <MetroButton
            title={statusActions[activeMission.status]}
            variant="primary"
            size="lg"
            fullWidth
            loading={updating}
            onPress={handleAdvanceStatus}
          />
        ) : (
          <View style={styles.completedBanner}>
            <Text style={styles.completedText}>MISSION COMPLETE</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

function StatBox({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function getRunnerPosition(status: MissionStatus): { top: string; left: string } {
  switch (status) {
    case 'accepted':
      return { top: '70%', left: '10%' };
    case 'en_route_to_store':
      return { top: '50%', left: '25%' };
    case 'shopping':
    case 'checkout':
      return { top: '30%', left: '45%' };
    case 'en_route_to_dropzone':
      return { top: '50%', left: '60%' };
    case 'distributing':
    case 'completed':
      return { top: '60%', left: '75%' };
    default:
      return { top: '70%', left: '10%' };
  }
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
    marginBottom: Spacing[6],
  },
  viewJobsButton: {
    minWidth: 200,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: MetroColors.accent.green + '40',
  },
  headerLeft: {
    gap: Spacing[2],
  },
  missionId: {
    color: MetroColors.text.primary,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.md,
    fontWeight: '700',
    letterSpacing: 1,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  earningsLabel: {
    color: MetroColors.text.muted,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.xs,
    letterSpacing: 0.5,
  },
  earningsValue: {
    color: MetroColors.accent.green,
    fontFamily: Fonts.mono,
    fontSize: FontSizes['2xl'],
    fontWeight: '700',
  },
  mapContainer: {
    flex: 1,
    backgroundColor: MetroColors.background.tertiary,
    position: 'relative',
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  gridLine: {
    position: 'absolute',
    backgroundColor: MetroColors.border.muted,
    opacity: 0.2,
  },
  gridHorizontal: {
    left: 0,
    right: 0,
    height: 1,
  },
  gridVertical: {
    top: 0,
    bottom: 0,
    width: 1,
  },
  routeContainer: {
    flex: 1,
    position: 'relative',
  },
  storeMarker: {
    position: 'absolute',
    alignItems: 'center',
    transform: [{ translateX: -20 }, { translateY: -20 }],
  },
  markerDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: MetroColors.accent.cyan,
    borderWidth: 2,
    borderColor: MetroColors.background.primary,
  },
  markerDotVisited: {
    backgroundColor: MetroColors.accent.green,
  },
  markerLabel: {
    color: MetroColors.text.secondary,
    fontFamily: Fonts.mono,
    fontSize: 10,
    marginTop: 4,
  },
  dropZoneMarker: {
    position: 'absolute',
    top: '55%',
    left: '70%',
    alignItems: 'center',
    transform: [{ translateX: -30 }, { translateY: -30 }],
  },
  dropZoneLabel: {
    color: MetroColors.accent.cyan,
    fontFamily: Fonts.mono,
    fontSize: 10,
    letterSpacing: 1,
    marginTop: 4,
  },
  runnerMarker: {
    position: 'absolute',
    alignItems: 'center',
    transform: [{ translateX: -20 }, { translateY: -20 }],
  },
  runnerLabel: {
    color: MetroColors.accent.green,
    fontFamily: Fonts.mono,
    fontSize: 10,
    fontWeight: '700',
    marginTop: 4,
  },
  routeLine: {
    position: 'absolute',
    top: '40%',
    left: '15%',
    width: '60%',
    height: 2,
    backgroundColor: MetroColors.accent.cyan,
    opacity: 0.4,
  },
  mapInfo: {
    position: 'absolute',
    bottom: Spacing[2],
    left: Spacing[3],
    backgroundColor: MetroColors.background.primary + 'CC',
    paddingHorizontal: Spacing[2],
    paddingVertical: Spacing[1],
    borderRadius: 2,
  },
  mapInfoText: {
    color: MetroColors.text.secondary,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.xs,
  },
  progressContainer: {
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    backgroundColor: MetroColors.background.secondary,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: MetroColors.border.muted,
  },
  progressTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing[2],
  },
  progressStep: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: MetroColors.border.default,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressDotCompleted: {
    backgroundColor: MetroColors.accent.green,
  },
  progressDotCurrent: {
    backgroundColor: MetroColors.accent.cyan,
    ...Shadows.cyanGlow,
  },
  checkmark: {
    color: MetroColors.background.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  progressLine: {
    width: 30,
    height: 2,
    backgroundColor: MetroColors.border.default,
  },
  progressLineCompleted: {
    backgroundColor: MetroColors.accent.green,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[1],
  },
  progressLabel: {
    color: MetroColors.text.muted,
    fontFamily: Fonts.mono,
    fontSize: 8,
    letterSpacing: 0.5,
  },
  statsRow: {
    flexDirection: 'row',
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[4],
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    color: MetroColors.accent.green,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.xl,
    fontWeight: '700',
  },
  statLabel: {
    color: MetroColors.text.muted,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.xs,
    letterSpacing: 0.5,
  },
  actionContainer: {
    padding: Spacing[4],
    paddingBottom: Spacing[6],
  },
  completedBanner: {
    backgroundColor: MetroColors.accent.green,
    paddingVertical: Spacing[4],
    borderRadius: 4,
    alignItems: 'center',
    ...Shadows.glow(MetroColors.accent.green),
  },
  completedText: {
    color: MetroColors.background.primary,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.lg,
    fontWeight: '700',
    letterSpacing: 2,
  },
});

