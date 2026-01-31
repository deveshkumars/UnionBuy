/**
 * Scanner Screen - Drop-off Verification
 * QR code scanner for verifying customer pickups
 */

import React, { useState } from 'react';
import {
    Dimensions,
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
    ScanOverlay,
    StatusBadge,
} from '@/components/metro';
import { FontSizes, Fonts, MetroColors, Spacing } from '@/constants/theme';
import { useMission } from '@/context/AppContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface DistributionItem {
  id: string;
  name: string;
  qrCode: string;
  items: { name: string; quantity: number }[];
  status: 'pending' | 'arrived' | 'verified' | 'completed';
}

export default function ScannerScreen() {
  const { activeMission } = useMission();
  const [scanning, setScanning] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [selectedDistribution, setSelectedDistribution] = useState<string | null>(null);

  // Mock distributions
  const [distributions, setDistributions] = useState<DistributionItem[]>([
    {
      id: '1',
      name: 'Maria Santos',
      qrCode: 'METRO-DIST-001-A7B3',
      items: [{ name: 'Chicken Breast', quantity: 5 }],
      status: 'pending',
    },
    {
      id: '2',
      name: 'James Chen',
      qrCode: 'METRO-DIST-002-C9D4',
      items: [{ name: 'Chicken Breast', quantity: 8 }, { name: 'Jasmine Rice', quantity: 10 }],
      status: 'pending',
    },
    {
      id: '3',
      name: 'Sarah Williams',
      qrCode: 'METRO-DIST-003-E5F6',
      items: [{ name: 'Organic Eggs', quantity: 3 }],
      status: 'arrived',
    },
  ]);

  const handleScan = (distributionId: string) => {
    setSelectedDistribution(distributionId);
    setScanning(true);
    setScanSuccess(false);

    // Simulate scanning
    setTimeout(() => {
      setScanSuccess(true);
      setTimeout(() => {
        setScanning(false);
        setScanSuccess(false);
        setDistributions(distributions.map(d =>
          d.id === distributionId ? { ...d, status: 'verified' } : d
        ));
        setSelectedDistribution(null);
      }, 1500);
    }, 2000);
  };

  const handleComplete = (distributionId: string) => {
    setDistributions(distributions.map(d =>
      d.id === distributionId ? { ...d, status: 'completed' } : d
    ));
  };

  const completedCount = distributions.filter(d => d.status === 'completed').length;

  if (!activeMission) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.noMissionContainer}>
          <Text style={styles.noMissionIcon}>⌗</Text>
          <Text style={styles.noMissionTitle}>NO ACTIVE MISSION</Text>
          <Text style={styles.noMissionSubtext}>
            Accept a mission to start distributing items
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (scanning) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.scannerContainer}>
          <ScanOverlay
            scanning={!scanSuccess}
            success={scanSuccess}
            label={scanSuccess ? 'VERIFIED' : 'SCANNING QR CODE'}
          />
          {!scanSuccess && (
            <TouchableOpacity
              style={styles.cancelScan}
              onPress={() => {
                setScanning(false);
                setSelectedDistribution(null);
              }}
            >
              <Text style={styles.cancelScanText}>CANCEL</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerLabel}>DROP-OFF</Text>
          <Text style={styles.headerTitle}>SCANNER</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.progressText}>
            {completedCount}/{distributions.length}
          </Text>
          <Text style={styles.progressLabel}>DISTRIBUTED</Text>
        </View>
      </View>

      {/* Summary Card */}
      <MetroCard variant="active" style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{distributions.length}</Text>
            <Text style={styles.summaryLabel}>NEIGHBORS</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>
              {distributions.reduce((sum, d) => sum + d.items.reduce((s, i) => s + i.quantity, 0), 0)}
            </Text>
            <Text style={styles.summaryLabel}>TOTAL ITEMS</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: MetroColors.accent.green }]}>
              {completedCount}
            </Text>
            <Text style={styles.summaryLabel}>COMPLETE</Text>
          </View>
        </View>
      </MetroCard>

      {/* Distribution List */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>DISTRIBUTION QUEUE</Text>
        </View>

        {distributions.map((dist) => (
          <MetroCard
            key={dist.id}
            variant={
              dist.status === 'completed' ? 'success' :
              dist.status === 'verified' ? 'active' :
              dist.status === 'arrived' ? 'warning' : 'default'
            }
            style={[
              styles.distributionCard,
              dist.status === 'completed' && styles.distributionCardCompleted
            ]}
          >
            <View style={styles.distributionHeader}>
              <View style={styles.distributionInfo}>
                <Text style={styles.distributionName}>{dist.name}</Text>
                <Text style={styles.distributionCode}>{dist.qrCode}</Text>
              </View>
              <StatusBadge
                label={dist.status.toUpperCase()}
                variant={
                  dist.status === 'completed' ? 'success' :
                  dist.status === 'verified' ? 'info' :
                  dist.status === 'arrived' ? 'warning' : 'default'
                }
                size="sm"
              />
            </View>

            <View style={styles.itemsList}>
              {dist.items.map((item, index) => (
                <View key={index} style={styles.itemRow}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemQuantity}>×{item.quantity}</Text>
                </View>
              ))}
            </View>

            <View style={styles.distributionActions}>
              {dist.status === 'pending' && (
                <MetroButton
                  title="SCAN QR CODE"
                  variant="secondary"
                  size="md"
                  fullWidth
                  onPress={() => handleScan(dist.id)}
                />
              )}
              {dist.status === 'arrived' && (
                <MetroButton
                  title="SCAN TO VERIFY"
                  variant="warning"
                  size="md"
                  fullWidth
                  onPress={() => handleScan(dist.id)}
                />
              )}
              {dist.status === 'verified' && (
                <MetroButton
                  title="HAND OFF ITEMS"
                  variant="primary"
                  size="md"
                  fullWidth
                  onPress={() => handleComplete(dist.id)}
                />
              )}
              {dist.status === 'completed' && (
                <View style={styles.completedBadge}>
                  <Text style={styles.completedText}>✓ DISTRIBUTED</Text>
                </View>
              )}
            </View>
          </MetroCard>
        ))}
      </ScrollView>

      {/* Complete All Button */}
      {completedCount === distributions.length && (
        <View style={styles.bottomAction}>
          <MetroButton
            title="COMPLETE DISTRIBUTION"
            variant="primary"
            size="lg"
            fullWidth
            onPress={() => {}}
          />
        </View>
      )}
    </SafeAreaView>
  );
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
  },
  scannerContainer: {
    flex: 1,
    backgroundColor: MetroColors.background.primary,
  },
  cancelScan: {
    position: 'absolute',
    bottom: 100,
    left: Spacing[4],
    right: Spacing[4],
    backgroundColor: MetroColors.background.secondary,
    paddingVertical: Spacing[4],
    borderRadius: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: MetroColors.border.default,
  },
  cancelScanText: {
    color: MetroColors.text.secondary,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.md,
    fontWeight: '600',
    letterSpacing: 1,
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
  progressText: {
    color: MetroColors.accent.green,
    fontFamily: Fonts.mono,
    fontSize: FontSizes['2xl'],
    fontWeight: '700',
  },
  progressLabel: {
    color: MetroColors.text.muted,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.xs,
    letterSpacing: 0.5,
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
  summaryValue: {
    color: MetroColors.text.primary,
    fontFamily: Fonts.mono,
    fontSize: FontSizes['2xl'],
    fontWeight: '700',
  },
  summaryLabel: {
    color: MetroColors.text.muted,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.xs,
    letterSpacing: 0.5,
    marginTop: 2,
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: MetroColors.border.default,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing[4],
    paddingBottom: Spacing[10],
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
  distributionCard: {
    marginBottom: Spacing[3],
  },
  distributionCardCompleted: {
    opacity: 0.7,
  },
  distributionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing[3],
  },
  distributionInfo: {},
  distributionName: {
    color: MetroColors.text.primary,
    fontFamily: Fonts.sans,
    fontSize: FontSizes.lg,
    fontWeight: '600',
    marginBottom: 2,
  },
  distributionCode: {
    color: MetroColors.accent.cyan,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.xs,
    letterSpacing: 1,
  },
  itemsList: {
    backgroundColor: MetroColors.background.tertiary,
    padding: Spacing[3],
    borderRadius: 2,
    marginBottom: Spacing[3],
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing[1],
  },
  itemName: {
    color: MetroColors.text.secondary,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.sm,
  },
  itemQuantity: {
    color: MetroColors.accent.cyan,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
  distributionActions: {},
  completedBadge: {
    backgroundColor: MetroColors.accent.greenMuted,
    paddingVertical: Spacing[3],
    borderRadius: 2,
    alignItems: 'center',
  },
  completedText: {
    color: MetroColors.accent.green,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.sm,
    fontWeight: '600',
    letterSpacing: 1,
  },
  bottomAction: {
    padding: Spacing[4],
    paddingBottom: Spacing[6],
    borderTopWidth: 1,
    borderTopColor: MetroColors.border.muted,
  },
});

