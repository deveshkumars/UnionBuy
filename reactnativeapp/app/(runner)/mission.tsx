
/**
 * Mission HUD Screen
 * Full-screen map with route, status indicator, and action buttons
 */

import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    Dimensions,
    StyleSheet,
    Text,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import LeafletMap from '@/components/LeafletMap';
import {
    MetroButton,
    StatusBadge
} from '@/components/metro';
import { FontSizes, Fonts, MetroColors, Shadows, Spacing } from '@/constants/theme';
import { useMission } from '@/context/AppContext';
import { updateMissionStatus } from '@/services/api';
import { findOptimalDropZone } from '@/services/kmeans';
import { mockMissions, mockStores, mockUsers } from '@/services/mockData';
import { Location, MissionStatus } from '@/types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Customer locations for the order (runner can see all to understand drop zone)
const orderCustomers = [
  { location: mockUsers[0].location, weight: 10 },
  { location: mockUsers[1].location, weight: 8 },
  { location: { latitude: 41.8276, longitude: -71.4103 }, weight: 5 },
  { location: { latitude: 41.8145, longitude: -71.4256 }, weight: 7 },
  { location: { latitude: 41.8312, longitude: -71.4089 }, weight: 12 },
];

// Calculate optimal drop zone using K-means
const kmeansResult = findOptimalDropZone(orderCustomers);

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

// Demo mission for testing UI
const demoMission = {
  ...mockMissions[0],
  status: 'en_route_to_store' as MissionStatus,
  stores: mockStores.slice(0, 2),
  estimatedEarnings: 42.50,
  tips: 8.00,
  totalItems: 92,
};

export default function MissionScreen() {
  const router = useRouter();
  const { activeMission, setActiveMission } = useMission();
  const [updating, setUpdating] = useState(false);

  // Use demo mission if no active mission for demo purposes
  const displayMission = activeMission || demoMission;

  const currentStatusIndex = statusFlow.indexOf(displayMission.status);
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
            const result = await updateMissionStatus(displayMission.id, nextStatus);
            setUpdating(false);

            if (result.success) {
              if (nextStatus === 'completed') {
                // Keep mission in state with completed status to show earnings summary
                setActiveMission({ 
                  ...displayMission, 
                  status: 'completed', 
                  completedAt: new Date().toISOString() 
                });
              } else {
                setActiveMission({ ...displayMission, status: nextStatus });
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
            ORDER #{displayMission.id.slice(-4).toUpperCase()}
          </Text>
          <StatusBadge
            label={statusLabels[displayMission.status]}
            variant={displayMission.status === 'completed' ? 'success' : 'info'}
            size="md"
            pulse={displayMission.status !== 'completed'}
          />
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.earningsLabel}>EARNINGS</Text>
          <Text style={styles.earningsValue}>
            ${(displayMission.estimatedEarnings + displayMission.tips).toFixed(2)}
          </Text>
        </View>
      </View>

      {/* Map Area */}
      <View style={styles.mapContainer}>
        <LeafletMap
          stores={displayMission.stores}
          dropZone={kmeansResult.location} // K-means optimized drop zone
          runnerPosition={getRunnerLocation(displayMission.status, displayMission.stores, displayMission.dropZone)}
          customerLocations={orderCustomers.map(c => c.location)} // Show all customers to runner
          missionStatus={displayMission.status}
        />

        {/* Map info overlay */}
        <View style={styles.mapInfo}>
          <Text style={styles.mapInfoText}>
            {displayMission.route.totalDistance} mi • {displayMission.route.estimatedTime} min • {orderCustomers.length} customers
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
        <StatBox label="ITEMS" value={displayMission.totalItems} />
        <StatBox label="STORES" value={displayMission.stores.length} />
        <StatBox label="NEIGHBORS" value={5} />
      </View>

      {/* Action Button */}
      <View style={styles.actionContainer}>
        {nextStatus ? (
          <MetroButton
            title={statusActions[displayMission.status]}
            variant="primary"
            size="lg"
            fullWidth
            loading={updating}
            onPress={handleAdvanceStatus}
          />
        ) : (
          <View style={styles.completedContainer}>
            {/* Earnings Summary */}
            <View style={styles.earningsSummary}>
              <Text style={styles.completedTitle}>🎉 MISSION COMPLETE!</Text>
              <View style={styles.earningsRow}>
                <View style={styles.earningsItem}>
                  <Text style={styles.earningsLabel}>BASE EARNINGS</Text>
                  <Text style={styles.earningsValue}>
                    ${displayMission.estimatedEarnings.toFixed(2)}
                  </Text>
                </View>
                <View style={styles.earningsDivider} />
                <View style={styles.earningsItem}>
                  <Text style={styles.earningsLabel}>TIPS</Text>
                  <Text style={styles.earningsValue}>
                    ${(displayMission.tips || 0).toFixed(2)}
                  </Text>
                </View>
                <View style={styles.earningsDivider} />
                <View style={styles.earningsItem}>
                  <Text style={styles.earningsLabel}>TOTAL</Text>
                  <Text style={[styles.earningsValue, styles.earningsTotal]}>
                    ${(displayMission.estimatedEarnings + (displayMission.tips || 0)).toFixed(2)}
                  </Text>
                </View>
              </View>
            </View>
            
            {/* Return to Job Board Button */}
            <MetroButton
              title="START NEW MISSION"
              variant="primary"
              size="lg"
              fullWidth
              onPress={() => {
                setActiveMission(null);
                router.replace('/(runner)');
              }}
            />
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

function getRunnerLocation(
  status: MissionStatus,
  stores: { location: Location }[],
  dropZone: Location
): Location | undefined {
  if (stores.length === 0) return undefined;

  const firstStore = stores[0].location;
  const lastStore = stores[stores.length - 1].location;

  switch (status) {
    case 'accepted':
      // Runner is at starting position (slightly offset from first store)
      return {
        latitude: firstStore.latitude - 0.01,
        longitude: firstStore.longitude - 0.01,
      };
    case 'en_route_to_store':
      // Runner is between start and first store
      return {
        latitude: firstStore.latitude - 0.005,
        longitude: firstStore.longitude - 0.005,
      };
    case 'shopping':
    case 'checkout':
      // Runner is at the store
      return lastStore;
    case 'en_route_to_dropzone':
      // Runner is between store and drop zone
      return {
        latitude: (lastStore.latitude + dropZone.latitude) / 2,
        longitude: (lastStore.longitude + dropZone.longitude) / 2,
      };
    case 'distributing':
    case 'completed':
      // Runner is at drop zone
      return dropZone;
    default:
      return undefined;
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
    fontSize: FontSizes['2xl'],
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: Spacing[2],
  },
  noMissionSubtext: {
    color: MetroColors.text.muted,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.md,
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
    fontSize: FontSizes.xl,
    fontWeight: '800',
    letterSpacing: 1,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  earningsLabel: {
    color: MetroColors.text.muted,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.sm,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  earningsValue: {
    color: MetroColors.accent.green,
    fontFamily: Fonts.mono,
    fontSize: FontSizes['3xl'],
    fontWeight: '800',
  },
  mapContainer: {
    flex: 1,
    backgroundColor: MetroColors.background.tertiary,
    position: 'relative',
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
    fontSize: FontSizes.md,
    fontWeight: '600',
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
    fontSize: FontSizes.xs,
    fontWeight: '600',
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
    fontSize: FontSizes['2xl'],
    fontWeight: '800',
  },
  statLabel: {
    color: MetroColors.text.muted,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.md,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  actionContainer: {
    padding: Spacing[4],
    paddingBottom: Spacing[6],
  },
  completedContainer: {
    gap: Spacing[4],
  },
  earningsSummary: {
    backgroundColor: MetroColors.background.secondary,
    borderRadius: 4,
    padding: Spacing[4],
    borderWidth: 2,
    borderColor: MetroColors.accent.green,
    ...Shadows.glow(MetroColors.accent.green),
  },
  completedTitle: {
    color: MetroColors.accent.green,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.xl,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: Spacing[3],
    letterSpacing: 1,
  },
  earningsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  earningsItem: {
    flex: 1,
    alignItems: 'center',
  },
  earningsDivider: {
    width: 1,
    height: 40,
    backgroundColor: MetroColors.border.default,
  },
  earningsTotal: {
    color: MetroColors.accent.green,
    fontSize: FontSizes['2xl'],
  },
});
