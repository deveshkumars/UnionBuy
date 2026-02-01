/**
 * Runner Account Screen
 * Profile and role switching for runners
 */

import { signOut } from 'aws-amplify/auth';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
    MetroButton,
    MetroCard,
    StatusBadge,
    TrustScore,
} from '@/components/metro';
import { FontSizes, Fonts, MetroColors, Spacing } from '@/constants/theme';
import { useApp, useRole } from '@/context/AppContext';
import { isBackendConfigured } from '@/lib/amplify';

export default function RunnerAccountScreen() {
  const { user } = useApp();
  const { role, switchRole } = useRole();
  const [notifications, setNotifications] = useState(true);
  const [locationTracking, setLocationTracking] = useState(true);
  const router = useRouter();

  const setRoleAndNavigate = (newRole: 'customer' | 'runner') => {
    switchRole(newRole);
    // Force navigation to root to trigger re-render
    if (newRole === 'customer') {
      router.replace('/(customer)');
    } else {
      router.replace('/(runner)');
    }
  };

  const handleSignOut = async () => {
    if (!isBackendConfigured()) {
      Alert.alert('Info', 'Backend not configured (using mock data)');
      return;
    }

    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              router.replace('/auth');
            } catch (error) {
              console.error('Sign out error:', error);
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
        <View style={styles.headerLeft}>
          <Text style={styles.headerLabel}>UNION BUY</Text>
          <Text style={styles.headerTitle}>Runner Profile</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Profile Card */}
        <MetroCard variant="success" style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>
                {user.name.split(' ').map(n => n[0]).join('')}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user.name}</Text>
              <Text style={styles.profileEmail}>{user.email}</Text>
              <StatusBadge
                label="RUNNER"
                variant="success"
                size="sm"
              />
            </View>
          </View>
          <View style={styles.profileStats}>
            <View style={styles.profileStatItem}>
              <Text style={styles.profileStatLabel}>DELIVERIES</Text>
              <Text style={styles.profileStatValue}>47</Text>
            </View>
            <View style={styles.profileStatDivider} />
            <View style={styles.profileStatItem}>
              <Text style={styles.profileStatLabel}>EARNINGS</Text>
              <Text style={[styles.profileStatValue, { color: MetroColors.accent.green }]}>$892</Text>
            </View>
            <View style={styles.profileStatDivider} />
            <View style={styles.profileStatItem}>
              <Text style={styles.profileStatLabel}>RATING</Text>
              <TrustScore score={user.trustScore} />
            </View>
          </View>
        </MetroCard>

        {/* Role Switch */}
        <MetroCard style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>SWITCH MODE</Text>
          </View>
          <View style={styles.roleButtons}>
            <MetroButton
              title="[BUY] Customer"
              variant={role === 'customer' ? 'primary' : 'secondary'}
              size="md"
              style={styles.roleButton}
              onPress={() => setRoleAndNavigate('customer')}
            />
            <MetroButton
              title="[RUN] Runner"
              variant={role === 'runner' ? 'primary' : 'secondary'}
              size="md"
              style={styles.roleButton}
              onPress={() => setRoleAndNavigate('runner')}
            />
          </View>
        </MetroCard>

        {/* Vehicle Info */}
        <MetroCard style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>VEHICLE</Text>
          </View>
          <View style={styles.vehicleInfo}>
            <View style={styles.vehicleIcon}>
              <Text style={styles.vehicleIconText}>CAR</Text>
            </View>
            <View style={styles.vehicleDetails}>
              <Text style={styles.vehicleType}>Sedan / Hatchback</Text>
              <Text style={styles.vehicleCapacity}>Capacity: ~200 lbs</Text>
            </View>
            <MetroButton
              title="EDIT"
              variant="ghost"
              size="sm"
              onPress={() => {}}
            />
          </View>
        </MetroCard>

        {/* Settings */}
        <MetroCard style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>SETTINGS</Text>
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Push Notifications</Text>
              <Text style={styles.settingDesc}>New job alerts</Text>
            </View>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: MetroColors.border.muted, true: MetroColors.accent.greenMuted }}
              thumbColor={notifications ? MetroColors.accent.green : MetroColors.text.muted}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Location Tracking</Text>
              <Text style={styles.settingDesc}>Required for deliveries</Text>
            </View>
            <Switch
              value={locationTracking}
              onValueChange={setLocationTracking}
              trackColor={{ false: MetroColors.border.muted, true: MetroColors.accent.greenMuted }}
              thumbColor={locationTracking ? MetroColors.accent.green : MetroColors.text.muted}
            />
          </View>
        </MetroCard>

        {/* Earnings Summary */}
        <MetroCard style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>THIS WEEK</Text>
          </View>
          <View style={styles.earningsGrid}>
            <View style={styles.earningsItem}>
              <Text style={styles.earningsLabel}>BASE</Text>
              <Text style={styles.earningsValue}>$127.50</Text>
            </View>
            <View style={styles.earningsItem}>
              <Text style={styles.earningsLabel}>TIPS</Text>
              <Text style={[styles.earningsValue, { color: MetroColors.accent.cyan }]}>$34.00</Text>
            </View>
            <View style={styles.earningsItem}>
              <Text style={styles.earningsLabel}>BONUS</Text>
              <Text style={[styles.earningsValue, { color: MetroColors.accent.purple }]}>$15.00</Text>
            </View>
            <View style={styles.earningsItem}>
              <Text style={styles.earningsLabel}>TOTAL</Text>
              <Text style={[styles.earningsValue, { color: MetroColors.accent.green }]}>$176.50</Text>
            </View>
          </View>
        </MetroCard>

        {/* Sign Out */}
        <MetroButton
          title="Sign Out"
          variant="secondary"
          size="lg"
          fullWidth
          onPress={handleSignOut}
          style={styles.signOutButton}
        />

        <Text style={styles.versionText}>UNION BUY RUNNER v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
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
    paddingVertical: Spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: MetroColors.border.muted,
    backgroundColor: MetroColors.background.secondary,
  },
  headerLeft: {
    flex: 1,
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
  headerRight: {
    flexDirection: 'row',
    gap: Spacing[2],
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing[4],
    paddingBottom: Spacing[10],
  },
  profileCard: {
    marginBottom: Spacing[4],
    paddingVertical: Spacing[5],
    paddingHorizontal: Spacing[4],
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing[4],
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: MetroColors.accent.greenMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing[4],
    borderWidth: 2,
    borderColor: MetroColors.accent.green,
  },
  avatarText: {
    color: MetroColors.accent.green,
    fontFamily: Fonts.heading,
    fontSize: FontSizes.xl,
    fontWeight: '700',
  },
  profileInfo: {
    flex: 1,
    gap: Spacing[1],
  },
  profileName: {
    color: MetroColors.text.primary,
    fontFamily: Fonts.heading,
    fontSize: FontSizes.xl,
    fontWeight: '700',
  },
  profileEmail: {
    color: MetroColors.text.secondary,
    fontFamily: Fonts.body,
    fontSize: FontSizes.md,
    marginBottom: Spacing[1],
  },
  profileStats: {
    flexDirection: 'row',
    paddingTop: Spacing[4],
    borderTopWidth: 1,
    borderTopColor: MetroColors.border.muted,
  },
  profileStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  profileStatDivider: {
    width: 1,
    backgroundColor: MetroColors.border.default,
  },
  profileStatLabel: {
    color: MetroColors.text.secondary,
    fontFamily: Fonts.sansBold,
    fontSize: FontSizes.sm,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: Spacing[2],
  },
  profileStatValue: {
    color: MetroColors.text.primary,
    fontFamily: Fonts.heading,
    fontSize: FontSizes.xl,
    fontWeight: '800',
  },
  sectionCard: {
    marginBottom: Spacing[3],
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[3],
  },
  sectionHeader: {
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
  roleButtons: {
    flexDirection: 'row',
    gap: Spacing[3],
  },
  roleButton: {
    flex: 1,
  },
  vehicleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vehicleIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: MetroColors.accent.greenMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing[3],
  },
  vehicleIconText: {
    color: MetroColors.accent.green,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.xs,
    fontWeight: '700',
  },
  vehicleDetails: {
    flex: 1,
  },
  vehicleType: {
    color: MetroColors.text.primary,
    fontFamily: Fonts.body,
    fontSize: FontSizes.md,
    fontWeight: '600',
    marginBottom: 4,
  },
  vehicleCapacity: {
    color: MetroColors.text.secondary,
    fontFamily: Fonts.body,
    fontSize: FontSizes.sm,
    fontWeight: '500',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: MetroColors.border.muted,
  },
  settingInfo: {
    flex: 1,
    marginRight: Spacing[3],
  },
  settingLabel: {
    color: MetroColors.text.primary,
    fontFamily: Fonts.body,
    fontSize: FontSizes.md,
    fontWeight: '600',
    marginBottom: 4,
  },
  settingDesc: {
    color: MetroColors.text.secondary,
    fontFamily: Fonts.body,
    fontSize: FontSizes.sm,
    lineHeight: 20,
    fontWeight: '500',
  },
  earningsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing[2],
  },
  earningsItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: MetroColors.background.tertiary,
    padding: Spacing[3],
    borderRadius: 8,
    alignItems: 'center',
  },
  earningsLabel: {
    color: MetroColors.text.secondary,
    fontFamily: Fonts.sansBold,
    fontSize: FontSizes.xs,
    fontWeight: '700',
    marginBottom: Spacing[1],
  },
  earningsValue: {
    color: MetroColors.text.primary,
    fontFamily: Fonts.heading,
    fontSize: FontSizes.xl,
    fontWeight: '800',
  },
  signOutButton: {
    marginTop: Spacing[4],
    marginBottom: Spacing[4],
  },
  versionText: {
    color: MetroColors.text.muted,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.xs,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
});
