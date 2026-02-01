/**
 * Scanner Screen - Drop-off Verification
 * PIN entry for verifying customer pickups (replaced QR scanning)
 */

import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
    MetroButton,
    MetroCard,
    StatusBadge,
} from '@/components/metro';
import { FontSizes, Fonts, MetroColors, Spacing } from '@/constants/theme';
import { useMission } from '@/context/AppContext';
import { completeDistribution, fetchDistributions, updateMissionStatus, verifyDistributionPin } from '@/services/api';

interface DistributionItem {
  id: string;
  name: string;
  pickupPin: string;
  items: { name: string; quantity: number; unit: string }[];
  status: 'pending' | 'arrived' | 'verified' | 'completed';
}

export default function ScannerScreen() {
  const { activeMission, setActiveMission } = useMission();
  const [verifying, setVerifying] = useState(false);
  const [selectedDistribution, setSelectedDistribution] = useState<string | null>(null);
  const [pinDigits, setPinDigits] = useState(['', '', '', '']);
  const [pinError, setPinError] = useState<string | null>(null);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  // Mock distributions - 5 neighbors in the bulk order
  const [distributions, setDistributions] = useState<DistributionItem[]>([
    {
      id: '1',
      name: 'Maria Santos',
      pickupPin: '4829',
      items: [
        { name: 'Chicken Breast', quantity: 5, unit: 'lbs' },
        { name: 'Jasmine Rice', quantity: 10, unit: 'lbs' },
      ],
      status: 'pending',
    },
    {
      id: '2',
      name: 'James Chen',
      pickupPin: '7156',
      items: [
        { name: 'Chicken Breast', quantity: 8, unit: 'lbs' },
        { name: 'Jasmine Rice', quantity: 15, unit: 'lbs' },
        { name: 'Olive Oil', quantity: 2, unit: 'bottles' },
      ],
      status: 'pending',
    },
    {
      id: '3',
      name: 'Sarah Williams',
      pickupPin: '3042',
      items: [
        { name: 'Organic Eggs', quantity: 3, unit: 'dozen' },
        { name: 'Paper Towels', quantity: 6, unit: 'rolls' },
      ],
      status: 'arrived',
    },
    {
      id: '4',
      name: 'David Park',
      pickupPin: '9583',
      items: [
        { name: 'Chicken Breast', quantity: 12, unit: 'lbs' },
        { name: 'Organic Eggs', quantity: 4, unit: 'dozen' },
      ],
      status: 'pending',
    },
    {
      id: '5',
      name: 'Lisa Thompson',
      pickupPin: '6271',
      items: [
        { name: 'Jasmine Rice', quantity: 25, unit: 'lbs' },
        { name: 'Paper Towels', quantity: 10, unit: 'rolls' },
        { name: 'Olive Oil', quantity: 4, unit: 'bottles' },
      ],
      status: 'pending',
    },
  ]);

  // Load real distributions if available
  useEffect(() => {
    const loadDistributions = async () => {
      if (activeMission) {
        try {
          const realDistributions = await fetchDistributions(activeMission.id);
          if (realDistributions.length > 0) {
            setDistributions(realDistributions.map(d => ({
              id: d.id,
              name: d.user.name,
              pickupPin: d.pickupPin,
              items: d.items.map(i => ({
                name: i.productName,
                quantity: i.quantity,
                unit: 'units',
              })),
              status: d.status,
            })));
          }
        } catch (e) {
          console.log('Using mock distributions');
        }
      }
    };
    loadDistributions();
  }, [activeMission]);

  const handleStartVerify = (distributionId: string) => {
    setSelectedDistribution(distributionId);
    setPinDigits(['', '', '', '']);
    setPinError(null);
    setVerifying(true);
    // Focus first input after a short delay
    setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 100);
  };

  const handlePinChange = (index: number, value: string) => {
    if (value.length > 1) {
      value = value.slice(-1);
    }
    
    const newDigits = [...pinDigits];
    newDigits[index] = value;
    setPinDigits(newDigits);
    setPinError(null);

    // Auto-advance to next input
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePinKeyPress = (index: number, key: string) => {
    // Handle backspace to go to previous input
    if (key === 'Backspace' && !pinDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyPin = async () => {
    const enteredPin = pinDigits.join('');
    if (enteredPin.length !== 4) {
      setPinError('Please enter all 4 digits');
      return;
    }

    const distribution = distributions.find(d => d.id === selectedDistribution);
    if (!distribution) return;

    if (enteredPin === distribution.pickupPin) {
      // PIN matches!
      // Try to verify via API first
      const result = await verifyDistributionPin(distribution.id, enteredPin);
      
      // Update local state
      setDistributions(distributions.map(d =>
        d.id === selectedDistribution ? { ...d, status: 'verified' } : d
      ));
      setVerifying(false);
      setSelectedDistribution(null);
      setPinDigits(['', '', '', '']);
    } else {
      // Wrong PIN
      setPinError('Invalid PIN. Please try again.');
      setPinDigits(['', '', '', '']);
      inputRefs.current[0]?.focus();
    }
  };

  const handleCancelVerify = () => {
    setVerifying(false);
    setSelectedDistribution(null);
    setPinDigits(['', '', '', '']);
    setPinError(null);
  };

  const handleComplete = async (distributionId: string) => {
    await completeDistribution(distributionId);
    setDistributions(distributions.map(d =>
      d.id === distributionId ? { ...d, status: 'completed' } : d
    ));
  };

  const handleCompleteAll = async () => {
    if (!activeMission) return;
    
    // Update mission status to completed
    const result = await updateMissionStatus(activeMission.id, 'completed');
    if (result.success) {
      // Update local state
      setActiveMission({ ...activeMission, status: 'completed', completedAt: new Date().toISOString() });
      Alert.alert(
        'Mission Complete!',
        `You've successfully distributed all items. Earnings: $${activeMission.estimatedEarnings.toFixed(2)}`,
        [{ text: 'OK' }]
      );
    }
  };

  const completedCount = distributions.filter(d => d.status === 'completed').length;

  // PIN Entry Modal/Screen
  if (verifying) {
    const distribution = distributions.find(d => d.id === selectedDistribution);
    
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.pinContainer}>
          <View style={styles.pinHeader}>
            <Text style={styles.pinHeaderLabel}>VERIFY CUSTOMER</Text>
            <Text style={styles.pinHeaderName}>{distribution?.name}</Text>
          </View>

          <View style={styles.pinInputContainer}>
            <Text style={styles.pinInstructions}>
              Ask the customer for their 4-digit pickup PIN
            </Text>
            
            <View style={styles.pinInputRow}>
              {[0, 1, 2, 3].map((index) => (
                <TextInput
                  key={index}
                  ref={(ref) => { inputRefs.current[index] = ref; }}
                  style={[
                    styles.pinInput,
                    pinDigits[index] && styles.pinInputFilled,
                    pinError && styles.pinInputError,
                  ]}
                  value={pinDigits[index]}
                  onChangeText={(value) => handlePinChange(index, value)}
                  onKeyPress={(e) => handlePinKeyPress(index, e.nativeEvent.key)}
                  keyboardType="number-pad"
                  maxLength={1}
                  selectTextOnFocus
                />
              ))}
            </View>

            {pinError && (
              <Text style={styles.pinErrorText}>{pinError}</Text>
            )}
          </View>

          <View style={styles.pinItemsPreview}>
            <Text style={styles.pinItemsLabel}>ITEMS TO HAND OFF:</Text>
            {distribution?.items.map((item, index) => (
              <Text key={index} style={styles.pinItemText}>
                • {item.quantity} {item.unit} {item.name}
              </Text>
            ))}
          </View>

          <View style={styles.pinActions}>
            <MetroButton
              title="VERIFY PIN"
              variant="primary"
              size="lg"
              fullWidth
              onPress={handleVerifyPin}
              disabled={pinDigits.some(d => !d)}
            />
            <MetroButton
              title="CANCEL"
              variant="secondary"
              size="md"
              fullWidth
              onPress={handleCancelVerify}
              style={{ marginTop: Spacing[3] }}
            />
          </View>
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
          <Text style={styles.headerTitle}>VERIFY</Text>
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
                <Text style={styles.distributionCode}>PIN: ••••</Text>
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
                  <Text style={styles.itemQuantity}>{item.quantity} {item.unit}</Text>
                </View>
              ))}
            </View>

            <View style={styles.distributionActions}>
              {dist.status === 'pending' && (
                <MetroButton
                  title="ENTER PIN"
                  variant="secondary"
                  size="md"
                  fullWidth
                  onPress={() => handleStartVerify(dist.id)}
                />
              )}
              {dist.status === 'arrived' && (
                <MetroButton
                  title="VERIFY PIN"
                  variant="warning"
                  size="md"
                  fullWidth
                  onPress={() => handleStartVerify(dist.id)}
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
      {completedCount === distributions.length && distributions.length > 0 && (
        <View style={styles.bottomAction}>
          <MetroButton
            title="COMPLETE DISTRIBUTION"
            variant="primary"
            size="lg"
            fullWidth
            onPress={handleCompleteAll}
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
  // PIN Entry Styles
  pinContainer: {
    flex: 1,
    padding: Spacing[4],
  },
  pinHeader: {
    alignItems: 'center',
    marginBottom: Spacing[6],
    paddingTop: Spacing[4],
  },
  pinHeaderLabel: {
    color: MetroColors.accent.cyan,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.md,
    fontWeight: '600',
    letterSpacing: 2,
    marginBottom: Spacing[2],
  },
  pinHeaderName: {
    color: MetroColors.text.primary,
    fontFamily: Fonts.sans,
    fontSize: FontSizes['3xl'],
    fontWeight: '800',
  },
  pinInputContainer: {
    alignItems: 'center',
    marginBottom: Spacing[6],
  },
  pinInstructions: {
    color: MetroColors.text.muted,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.md,
    textAlign: 'center',
    marginBottom: Spacing[4],
  },
  pinInputRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing[3],
  },
  pinInput: {
    width: 60,
    height: 72,
    backgroundColor: MetroColors.background.secondary,
    borderWidth: 2,
    borderColor: MetroColors.border.default,
    borderRadius: 4,
    fontSize: FontSizes['3xl'],
    fontFamily: Fonts.mono,
    fontWeight: '800',
    color: MetroColors.text.primary,
    textAlign: 'center',
  },
  pinInputFilled: {
    borderColor: MetroColors.accent.cyan,
    backgroundColor: MetroColors.accent.cyanMuted,
  },
  pinInputError: {
    borderColor: MetroColors.accent.red,
  },
  pinErrorText: {
    color: MetroColors.accent.red,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.md,
    marginTop: Spacing[3],
  },
  pinItemsPreview: {
    backgroundColor: MetroColors.background.secondary,
    padding: Spacing[4],
    borderRadius: 4,
    marginBottom: Spacing[6],
  },
  pinItemsLabel: {
    color: MetroColors.text.muted,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.sm,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: Spacing[2],
  },
  pinItemText: {
    color: MetroColors.text.secondary,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.md,
    paddingVertical: Spacing[1],
  },
  pinActions: {
    marginTop: 'auto',
    paddingBottom: Spacing[4],
  },
  // Main Screen Styles
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
    fontWeight: '600',
    letterSpacing: 2,
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
  progressText: {
    color: MetroColors.accent.green,
    fontFamily: Fonts.mono,
    fontSize: FontSizes['3xl'],
    fontWeight: '800',
  },
  progressLabel: {
    color: MetroColors.text.muted,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.sm,
    fontWeight: '600',
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
    fontSize: FontSizes['3xl'],
    fontWeight: '800',
  },
  summaryLabel: {
    color: MetroColors.text.muted,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.md,
    fontWeight: '600',
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
    fontSize: FontSizes.lg,
    fontWeight: '700',
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
    fontSize: FontSizes.xl,
    fontWeight: '700',
    marginBottom: 2,
  },
  distributionCode: {
    color: MetroColors.text.muted,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.md,
    fontWeight: '600',
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
    fontSize: FontSizes.md,
    fontWeight: '500',
  },
  itemQuantity: {
    color: MetroColors.accent.cyan,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.md,
    fontWeight: '700',
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
    fontSize: FontSizes.md,
    fontWeight: '700',
    letterSpacing: 1,
  },
  bottomAction: {
    padding: Spacing[4],
    paddingBottom: Spacing[6],
    borderTopWidth: 1,
    borderTopColor: MetroColors.border.muted,
  },
});
