/**
 * Operations Screen - Live Mission Tracking
 * Matrix-style map with runner locations and routes
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import {
  MetroCard,
  MetroButton,
  StatusBadge,
  PulseRadar,
  LocationIndicator,
  TargetReticle,
} from '@/components/metro';
import { MetroColors, FontSizes, Fonts, Spacing } from '@/constants/theme';
import { mockMissions, mockDistributions } from '@/services/mockData';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MAP_HEIGHT = 300;

export default function OperationsScreen() {
  const router = useRouter();
  const [activeMissions, setActiveMissions] = useState(mockMissions.filter(
    m => !['completed', 'available'].includes(m.status)
  ));

  const currentMission = activeMissions[0];

  // Dummy pickup window
  const pickupWindow = '18:30–19:00';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerLabel}>UNION BUY</Text>
          <Text style={styles.headerTitle}>Track Order</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.utilityPill} onPress={() => router.push('/(customer)/cart')}>
            <Text style={styles.utilityIcon}>🛒</Text>
          </TouchableOpacity>
          <View style={styles.statusIndicator}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>LIVE</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Map Placeholder */}
        <MetroCard variant="active" style={styles.mapCard}>
          <View style={styles.mapContainer}>
            {/* Grid overlay */}
            <View style={styles.gridOverlay}>
              {Array.from({ length: 8 }, (_, i) => (
                <View key={`h-${i}`} style={[styles.gridLine, styles.gridHorizontal, { top: `${(i + 1) * 12.5}%` }]} />
              ))}
              {Array.from({ length: 8 }, (_, i) => (
                <View key={`v-${i}`} style={[styles.gridLine, styles.gridVertical, { left: `${(i + 1) * 12.5}%` }]} />
              ))}
            </View>

            {/* Map content */}
            <View style={styles.mapContent}>
              {currentMission ? (
                <>
                  {/* Drop zone indicator */}
                  <View style={[styles.dropZone, { top: '40%', left: '50%' }]}>
                    <TargetReticle size={50} animated />
                    <Text style={styles.dropZoneLabel}>DROP ZONE</Text>
                  </View>

                  {/* Runner indicator */}
                  <View style={[styles.runnerMarker, { top: '60%', left: '30%' }]}>
                    <LocationIndicator size={30} color={MetroColors.accent.cyan} />
                    <Text style={styles.runnerLabel}>RUNNER</Text>
                  </View>

                  {/* Route line (simplified) */}
                  <View style={styles.routeLine} />
                </>
              ) : (
                <View style={styles.noMissionContainer}>
                  <PulseRadar size={120} label="SCANNING" />
                  <Text style={styles.noMissionText}>NO ACTIVE MISSIONS</Text>
                </View>
              )}
            </View>

            {/* Map labels */}
            <View style={styles.mapLabels}>
              <Text style={styles.mapLabel}>PROVIDENCE METRO AREA</Text>
              <Text style={styles.mapCoords}>Pickup window {pickupWindow}</Text>
            </View>
          </View>
        </MetroCard>

        {/* Pickup Summary */}
        <MetroCard style={styles.centerCard}>
          <View style={styles.centerRow}>
            <View>
              <Text style={styles.centerLabel}>PICKUP WINDOW</Text>
              <Text style={styles.centerTitle}>{pickupWindow}</Text>
              <Text style={styles.centerCoords}>Drop zone: Providence Community Center</Text>
            </View>
            <StatusBadge label="ETA" variant="info" size="sm" />
          </View>
        </MetroCard>

        {/* Mission Status */}
        {currentMission && (
          <MetroCard variant="active" label="ACTIVE" style={styles.missionCard}>
            <View style={styles.missionHeader}>
              <Text style={styles.missionTitle}>MISSION #{currentMission.id.slice(-4).toUpperCase()}</Text>
              <StatusBadge
                label={currentMission.status.replace('_', ' ').toUpperCase()}
                variant="info"
                size="sm"
                pulse
              />
            </View>

            <View style={styles.missionStats}>
              <MissionStat label="ITEMS" value={currentMission.totalItems} />
              <MissionStat label="STORES" value={currentMission.stores.length} />
              <MissionStat label="DISTANCE" value={`${currentMission.route.totalDistance} mi`} />
              <MissionStat label="ETA" value={`${currentMission.route.estimatedTime} min`} />
              <MissionStat label="PICKUP" value={pickupWindow} />
            </View>

            <View style={styles.progressTimeline}>
              <TimelineStep
                label="ORDER"
                status="completed"
                time="18:10"
              />
              <TimelineStep
                label="ACCEPTED"
                status="completed"
                time="18:15"
              />
              <TimelineStep
                label="SHOPPING"
                status="completed"
                time="18:45"
              />
              <TimelineStep
                label="EN ROUTE"
                status="active"
                time="--:--"
              />
              <TimelineStep
                label="DISTRIBUTE"
                status="pending"
                time="--:--"
              />
            </View>
          </MetroCard>
        )}

        {/* Your Items */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>YOUR ITEMS IN TRANSIT</Text>
        </View>

        {mockDistributions.slice(0, 1).map((dist) => (
          <MetroCard key={dist.id} style={styles.itemCard}>
            <View style={styles.itemHeader}>
              <Text style={styles.itemName}>{dist.items[0].productName}</Text>
              <StatusBadge label={dist.status.toUpperCase()} variant="warning" size="sm" />
            </View>
            <View style={styles.itemDetails}>
              <Text style={styles.itemQuantity}>
                {dist.items[0].quantity} units
              </Text>
              <Text style={styles.itemTime}>
                Pickup: {dist.scheduledTime ? new Date(dist.scheduledTime).toLocaleTimeString() : 'TBD'}
              </Text>
            </View>
            <View style={styles.qrSection}>
              <Text style={styles.qrLabel}>YOUR PICKUP CODE</Text>
              <Text style={styles.qrCode}>{dist.qrCode}</Text>
            </View>
          </MetroCard>
        ))}

        {/* Quick Actions */}
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
      </ScrollView>
    </SafeAreaView>
  );
}

function MissionStat({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={styles.missionStatItem}>
      <Text style={styles.missionStatLabel}>{label}</Text>
      <Text style={styles.missionStatValue}>{value}</Text>
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
  const getColor = () => {
    switch (status) {
      case 'completed':
        return MetroColors.accent.green;
      case 'active':
        return MetroColors.accent.cyan;
      default:
        return MetroColors.text.muted;
    }
  };

  const color = getColor();

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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: MetroColors.border.muted,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
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
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
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
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: MetroColors.accent.green,
  },
  statusText: {
    color: MetroColors.accent.green,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.xs,
    letterSpacing: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing[4],
    paddingBottom: Spacing[10],
  },
  centerCard: {
    marginBottom: Spacing[4],
  },
  centerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  centerLabel: {
    color: MetroColors.text.muted,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.xs,
    letterSpacing: 1,
  },
  centerTitle: {
    color: MetroColors.text.primary,
    fontFamily: Fonts.sans,
    fontSize: FontSizes.md,
    fontWeight: '600',
    marginTop: 4,
  },
  centerCoords: {
    color: MetroColors.text.tertiary,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.xs,
    marginTop: 2,
  },
  mapCard: {
    marginBottom: Spacing[4],
    padding: 0,
    overflow: 'hidden',
  },
  mapContainer: {
    height: MAP_HEIGHT,
    backgroundColor: MetroColors.background.tertiary,
    position: 'relative',
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  gridLine: {
    position: 'absolute',
    backgroundColor: MetroColors.border.muted,
    opacity: 0.3,
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
  mapContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noMissionContainer: {
    alignItems: 'center',
    gap: Spacing[4],
  },
  noMissionText: {
    color: MetroColors.text.muted,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.sm,
    letterSpacing: 1,
  },
  dropZone: {
    position: 'absolute',
    alignItems: 'center',
    transform: [{ translateX: -25 }, { translateY: -25 }],
  },
  dropZoneLabel: {
    color: MetroColors.accent.cyan,
    fontFamily: Fonts.mono,
    fontSize: 8,
    letterSpacing: 1,
    marginTop: 4,
  },
  runnerMarker: {
    position: 'absolute',
    alignItems: 'center',
    transform: [{ translateX: -15 }, { translateY: -15 }],
  },
  runnerLabel: {
    color: MetroColors.accent.cyan,
    fontFamily: Fonts.mono,
    fontSize: 8,
    letterSpacing: 1,
    marginTop: 4,
  },
  routeLine: {
    position: 'absolute',
    width: 100,
    height: 2,
    backgroundColor: MetroColors.accent.cyan,
    opacity: 0.5,
    top: '50%',
    left: '30%',
    transform: [{ rotate: '-30deg' }],
  },
  mapLabels: {
    position: 'absolute',
    bottom: Spacing[2],
    left: Spacing[3],
  },
  mapLabel: {
    color: MetroColors.text.muted,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.xs,
    letterSpacing: 1,
  },
  mapCoords: {
    color: MetroColors.text.muted,
    fontFamily: Fonts.mono,
    fontSize: 9,
    opacity: 0.7,
  },
  missionCard: {
    marginBottom: Spacing[4],
  },
  missionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing[3],
  },
  missionTitle: {
    color: MetroColors.text.primary,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.md,
    fontWeight: '700',
    letterSpacing: 1,
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
  missionStatItem: {
    alignItems: 'center',
  },
  missionStatLabel: {
    color: MetroColors.text.muted,
    fontFamily: Fonts.mono,
    fontSize: 9,
    letterSpacing: 0.5,
  },
  missionStatValue: {
    color: MetroColors.accent.cyan,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.md,
    fontWeight: '700',
  },
  progressTimeline: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timelineStep: {
    alignItems: 'center',
    gap: 4,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
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
    fontSize: 8,
    letterSpacing: 0.5,
  },
  timelineTime: {
    color: MetroColors.text.muted,
    fontFamily: Fonts.mono,
    fontSize: 9,
  },
  sectionHeader: {
    marginBottom: Spacing[3],
  },
  sectionTitle: {
    color: MetroColors.text.secondary,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.sm,
    letterSpacing: 1,
  },
  itemCard: {
    marginBottom: Spacing[3],
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing[2],
  },
  itemName: {
    color: MetroColors.text.primary,
    fontFamily: Fonts.sans,
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  itemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing[3],
  },
  itemQuantity: {
    color: MetroColors.text.secondary,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.sm,
  },
  itemTime: {
    color: MetroColors.text.muted,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.sm,
  },
  qrSection: {
    backgroundColor: MetroColors.background.tertiary,
    padding: Spacing[3],
    borderRadius: 2,
    alignItems: 'center',
  },
  qrLabel: {
    color: MetroColors.text.muted,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.xs,
    letterSpacing: 1,
    marginBottom: Spacing[1],
  },
  qrCode: {
    color: MetroColors.accent.cyan,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.xl,
    fontWeight: '700',
    letterSpacing: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing[3],
  },
  actionButton: {
    flex: 1,
  },
});
