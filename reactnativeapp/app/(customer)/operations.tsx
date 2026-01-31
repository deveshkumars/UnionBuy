/**
 * Operations Screen - Live Mission Tracking
 * Uber/Lyft style full-screen map with bottom sheet
 */

import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as ExpoLocation from 'expo-location';

import {
  MetroCard,
  MetroButton,
  StatusBadge,
  PulseRadar,
} from '@/components/metro';
import LeafletMap from '@/components/LeafletMap';
import { MetroColors, FontSizes, Fonts, Spacing } from '@/constants/theme';
import { mockMissions, mockDistributions, currentUser, mockUsers } from '@/services/mockData';
import { findOptimalDropZone } from '@/services/kmeans';
import { Location } from '@/types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Simulated customer locations for this order (in real app, would come from pledges)
const orderCustomers = [
  { location: mockUsers[0].location, weight: 10 }, // Maria - 10 units
  { location: mockUsers[1].location, weight: 8 },  // James - 8 units
  { location: { latitude: 41.8276, longitude: -71.4103, address: '321 Thayer St' }, weight: 5 },  // Customer 3
  { location: { latitude: 41.8145, longitude: -71.4256, address: '555 Atwells Ave' }, weight: 7 }, // Customer 4
  { location: { latitude: 41.8312, longitude: -71.4089, address: '100 Brown St' }, weight: 12 },  // Customer 5
];

// Calculate optimal drop zone using K-means
const kmeansResult = findOptimalDropZone(orderCustomers);

export default function OperationsScreen() {
  const [activeMissions] = useState(mockMissions.filter(
    m => !['completed', 'available'].includes(m.status)
  ));
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const bottomSheetRef = useRef<BottomSheet>(null);

  const currentMission = activeMissions[0];

  // Get user's real GPS location
  useEffect(() => {
    (async () => {
      // Request permission
      const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Location permission denied');
        // Fall back to mock location
        setUserLocation(currentUser.location);
        return;
      }

      try {
        // Get current position
        const location = await ExpoLocation.getCurrentPositionAsync({
          accuracy: ExpoLocation.Accuracy.Balanced,
        });

        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      } catch (error) {
        console.error('Error getting location:', error);
        // Fall back to mock location
        setUserLocation(currentUser.location);
      }
    })();
  }, []);

  // Bottom sheet snap points: collapsed (25%), half (50%), expanded (85%)
  const snapPoints = useMemo(() => ['25%', '50%', '85%'], []);

  const handleSheetChanges = useCallback((index: number) => {
    // Optional: track sheet position
  }, []);

  return (
    <GestureHandlerRootView style={styles.container}>
      {/* Full-screen Map */}
      <View style={styles.mapContainer}>
        {currentMission ? (
          <LeafletMap
            stores={currentMission.stores}
            dropZone={kmeansResult.location} // Use K-means optimized drop zone
            runnerPosition={getRunnerLocation(currentMission)}
            userLocation={userLocation || undefined}
            missionStatus={currentMission.status}
          />
        ) : (
          <View style={styles.noMissionMap}>
            <PulseRadar size={150} label="SCANNING" />
          </View>
        )}
      </View>

      {/* Top Status Bar Overlay */}
      <SafeAreaView style={styles.topOverlay} edges={['top']}>
        <View style={styles.topBar}>
          <View>
            <Text style={styles.topLabel}>LIVE TRACKING</Text>
            {currentMission && (
              <Text style={styles.topTitle}>
                MISSION #{currentMission.id.slice(-4).toUpperCase()}
              </Text>
            )}
          </View>
          <View style={styles.statusPill}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>
              {currentMission ? currentMission.status.replace(/_/g, ' ').toUpperCase() : 'NO MISSION'}
            </Text>
          </View>
        </View>
      </SafeAreaView>

      {/* Bottom Sheet */}
      <BottomSheet
        ref={bottomSheetRef}
        index={1}
        snapPoints={snapPoints}
        onChange={handleSheetChanges}
        backgroundStyle={styles.sheetBackground}
        handleIndicatorStyle={styles.sheetHandle}
        enablePanDownToClose={false}
      >
        <BottomSheetScrollView style={styles.sheetContent}>
          {currentMission ? (
            <>
              {/* Mission Progress */}
              <View style={styles.section}>
                <View style={styles.progressHeader}>
                  <Text style={styles.sectionTitle}>DELIVERY PROGRESS</Text>
                  <StatusBadge
                    label={currentMission.status.replace(/_/g, ' ').toUpperCase()}
                    variant="info"
                    size="sm"
                    pulse
                  />
                </View>

                <View style={styles.progressTimeline}>
                  <TimelineStep label="ORDERED" status="completed" time="18:10" />
                  <TimelineStep label="ACCEPTED" status="completed" time="18:15" />
                  <TimelineStep label="SHOPPING" status="completed" time="18:45" />
                  <TimelineStep label="EN ROUTE" status="active" time="--:--" />
                  <TimelineStep label="ARRIVING" status="pending" time="--:--" />
                </View>
              </View>

              {/* Stats Row */}
              <View style={styles.statsRow}>
                <StatCard label="ITEMS" value={currentMission.totalItems} />
                <StatCard label="STORES" value={currentMission.stores.length} />
                <StatCard label="CUSTOMERS" value={orderCustomers.length} />
                <StatCard label="ETA" value={`${currentMission.route.estimatedTime} min`} highlight />
              </View>

              {/* Drop Zone Info (simplified for customer) */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>PICKUP LOCATION</Text>
                <View style={styles.kmeansCard}>
                  <Text style={styles.kmeansLabel}>
                    Optimized for {orderCustomers.length} neighbors · {kmeansResult.averageDistance.toFixed(1)} mi avg distance
                  </Text>
                </View>
              </View>

              {/* Your Items */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>YOUR ITEMS</Text>
                {mockDistributions.slice(0, 2).map((dist) => (
                  <View key={dist.id} style={styles.itemCard}>
                    <View style={styles.itemRow}>
                      <View>
                        <Text style={styles.itemName}>{dist.items[0].productName}</Text>
                        <Text style={styles.itemQuantity}>{dist.items[0].quantity} units</Text>
                      </View>
                      <StatusBadge label={dist.status.toUpperCase()} variant="warning" size="sm" />
                    </View>
                  </View>
                ))}
              </View>

              {/* Pickup Code */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>PICKUP CODE</Text>
                <View style={styles.codeCard}>
                  <Text style={styles.codeLabel}>Show this to your runner</Text>
                  <Text style={styles.codeValue}>{mockDistributions[0]?.qrCode || 'N/A'}</Text>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionsRow}>
                <MetroButton
                  title="CONTACT RUNNER"
                  variant="secondary"
                  size="md"
                  onPress={() => {}}
                  style={styles.actionButton}
                />
                <MetroButton
                  title="GET DIRECTIONS"
                  variant="primary"
                  size="md"
                  onPress={() => {}}
                  style={styles.actionButton}
                />
              </View>
            </>
          ) : (
            <View style={styles.noMissionSheet}>
              <Text style={styles.noMissionTitle}>NO ACTIVE DELIVERIES</Text>
              <Text style={styles.noMissionText}>
                Your orders will appear here once a runner accepts them
              </Text>
              <MetroButton
                title="BROWSE MARKET"
                variant="primary"
                size="lg"
                onPress={() => {}}
                style={{ marginTop: Spacing[4] }}
              />
            </View>
          )}

          {/* Bottom padding for safe area */}
          <View style={{ height: 100 }} />
        </BottomSheetScrollView>
      </BottomSheet>
    </GestureHandlerRootView>
  );
}

function getRunnerLocation(mission: typeof mockMissions[0]): Location | undefined {
  if (!mission || mission.stores.length === 0) return undefined;

  const firstStore = mission.stores[0].location;
  const lastStore = mission.stores[mission.stores.length - 1].location;
  const dropZone = mission.dropZone;

  switch (mission.status) {
    case 'accepted':
      return { latitude: firstStore.latitude - 0.01, longitude: firstStore.longitude - 0.01 };
    case 'en_route_to_store':
      return { latitude: firstStore.latitude - 0.005, longitude: firstStore.longitude - 0.005 };
    case 'shopping':
    case 'checkout':
      return lastStore;
    case 'en_route_to_dropzone':
      return {
        latitude: (lastStore.latitude + dropZone.latitude) / 2,
        longitude: (lastStore.longitude + dropZone.longitude) / 2,
      };
    case 'distributing':
    case 'completed':
      return dropZone;
    default:
      return undefined;
  }
}

function StatCard({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, highlight && styles.statValueHighlight]}>{value}</Text>
    </View>
  );
}

function TimelineStep({
  label,
  status,
  time,
}: {
  label: string;
  status: 'pending' | 'active' | 'completed';
  time: string;
}) {
  const color = status === 'completed'
    ? MetroColors.accent.green
    : status === 'active'
      ? MetroColors.accent.cyan
      : MetroColors.text.muted;

  return (
    <View style={styles.timelineStep}>
      <View style={[styles.timelineDot, { backgroundColor: color }]}>
        {status === 'active' && <View style={styles.timelinePulse} />}
      </View>
      <Text style={[styles.timelineLabel, { color }]}>{label}</Text>
      <Text style={styles.timelineTime}>{time}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MetroColors.background.primary,
  },
  mapContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  noMissionMap: {
    flex: 1,
    backgroundColor: MetroColors.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: Spacing[4],
    marginTop: Spacing[2],
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    backgroundColor: 'rgba(10, 10, 10, 0.9)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: MetroColors.accent.cyan + '40',
  },
  topLabel: {
    color: MetroColors.text.muted,
    fontFamily: Fonts.mono,
    fontSize: 10,
    letterSpacing: 2,
  },
  topTitle: {
    color: MetroColors.text.primary,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.md,
    fontWeight: '700',
    letterSpacing: 1,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MetroColors.accent.cyan + '20',
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[1],
    borderRadius: 20,
    gap: Spacing[2],
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: MetroColors.accent.green,
  },
  liveText: {
    color: MetroColors.accent.cyan,
    fontFamily: Fonts.mono,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  sheetBackground: {
    backgroundColor: MetroColors.background.primary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: MetroColors.accent.cyan + '40',
  },
  sheetHandle: {
    backgroundColor: MetroColors.accent.cyan,
    width: 40,
  },
  sheetContent: {
    flex: 1,
    paddingHorizontal: Spacing[4],
  },
  section: {
    marginBottom: Spacing[5],
  },
  progressHeader: {
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
    marginBottom: Spacing[3],
  },
  progressTimeline: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timelineStep: {
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  timelineDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelinePulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: MetroColors.background.primary,
  },
  timelineLabel: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  timelineTime: {
    color: MetroColors.text.muted,
    fontFamily: Fonts.mono,
    fontSize: 9,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing[2],
    marginBottom: Spacing[5],
  },
  statCard: {
    flex: 1,
    backgroundColor: MetroColors.background.secondary,
    borderRadius: 8,
    padding: Spacing[3],
    alignItems: 'center',
    borderWidth: 1,
    borderColor: MetroColors.border.muted,
  },
  statLabel: {
    color: MetroColors.text.muted,
    fontFamily: Fonts.mono,
    fontSize: 9,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  statValue: {
    color: MetroColors.text.primary,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.md,
    fontWeight: '700',
  },
  statValueHighlight: {
    color: MetroColors.accent.green,
  },
  itemCard: {
    backgroundColor: MetroColors.background.secondary,
    borderRadius: 8,
    padding: Spacing[3],
    marginBottom: Spacing[2],
    borderWidth: 1,
    borderColor: MetroColors.border.muted,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemName: {
    color: MetroColors.text.primary,
    fontFamily: Fonts.sans,
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  itemQuantity: {
    color: MetroColors.text.muted,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.sm,
    marginTop: 2,
  },
  codeCard: {
    backgroundColor: MetroColors.background.tertiary,
    borderRadius: 12,
    padding: Spacing[4],
    alignItems: 'center',
    borderWidth: 2,
    borderColor: MetroColors.accent.cyan + '60',
    borderStyle: 'dashed',
  },
  codeLabel: {
    color: MetroColors.text.muted,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.xs,
    letterSpacing: 1,
    marginBottom: Spacing[2],
  },
  codeValue: {
    color: MetroColors.accent.cyan,
    fontFamily: Fonts.mono,
    fontSize: FontSizes['2xl'],
    fontWeight: '700',
    letterSpacing: 3,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing[3],
    marginTop: Spacing[2],
  },
  actionButton: {
    flex: 1,
  },
  noMissionSheet: {
    alignItems: 'center',
    paddingVertical: Spacing[6],
  },
  noMissionTitle: {
    color: MetroColors.text.secondary,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.lg,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: Spacing[2],
  },
  noMissionText: {
    color: MetroColors.text.muted,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.sm,
    textAlign: 'center',
    paddingHorizontal: Spacing[4],
  },
  kmeansCard: {
    backgroundColor: MetroColors.background.secondary,
    borderRadius: 12,
    padding: Spacing[3],
    borderWidth: 1,
    borderColor: MetroColors.accent.green + '40',
  },
  kmeansLabel: {
    color: MetroColors.text.muted,
    fontFamily: Fonts.mono,
    fontSize: 11,
    textAlign: 'center',
  },
});
