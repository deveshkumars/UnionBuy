/**
 * Account Screen - User Settings
 * Profile, payment info, preferences, and role switching
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import {
  MetroCard,
  MetroButton,
  TrustScore,
  StatusBadge,
} from '@/components/metro';
import { MetroColors, FontSizes, Fonts, Spacing } from '@/constants/theme';
import { useApp, useRole } from '@/context/AppContext';

export default function AccountScreen() {
  const { user } = useApp();
  const { role, switchRole } = useRole();
  const [notifications, setNotifications] = useState(true);
  const [locationTracking, setLocationTracking] = useState(true);
  const router = useRouter();

  const setRoleAndNavigate = (newRole: 'customer' | 'runner') => {
    switchRole(newRole);
    router.replace('/');
  };

  const handleRoleSwitch = () => {}; // legacy stub, replaced by direct buttons

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerLabel}>UNION BUY</Text>
          <Text style={styles.headerTitle}>Account</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.utilityPill} onPress={() => router.push('/(customer)/cart')}>
            <Text style={styles.utilityIcon}>🛒</Text>
          </TouchableOpacity>
          <MetroButton
            title="Runner"
            variant={role === 'runner' ? 'primary' : 'ghost'}
            size="sm"
            onPress={() => setRoleAndNavigate('runner')}
          />
          <MetroButton
            title="Customer"
            variant={role === 'customer' ? 'primary' : 'ghost'}
            size="sm"
            onPress={() => setRoleAndNavigate('customer')}
          />
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Profile Card */}
        <MetroCard variant="active" style={styles.profileCard}>
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
                label={role.toUpperCase()}
                variant={role === 'customer' ? 'info' : 'success'}
                size="sm"
              />
            </View>
          </View>
          <View style={styles.profileStats}>
            <View style={styles.profileStatItem}>
              <Text style={styles.profileStatLabel}>MEMBER SINCE</Text>
              <Text style={styles.profileStatValue}>
                {new Date(user.joinedAt).toLocaleDateString('en-US', {
                  month: 'short',
                  year: 'numeric',
                })}
              </Text>
            </View>
            <View style={styles.profileStatDivider} />
            <View style={styles.profileStatItem}>
              <Text style={styles.profileStatLabel}>TRUST SCORE</Text>
              <TrustScore score={user.trustScore} />
            </View>
          </View>
        </MetroCard>

        {/* Role Switch */}
        <MetroCard style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>MODE</Text>
          </View>
          <View style={styles.roleButtons}>
            <MetroButton
              title="Customer"
              variant={role === 'customer' ? 'primary' : 'secondary'}
              size="md"
              fullWidth
              onPress={() => setRoleAndNavigate('customer')}
            />
            <MetroButton
              title="Runner"
              variant={role === 'runner' ? 'primary' : 'secondary'}
              size="md"
              fullWidth
              onPress={() => setRoleAndNavigate('runner')}
            />
          </View>
        </MetroCard>

        {/* Location */}
        <MetroCard style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>LOCATION</Text>
          </View>
          <View style={styles.locationInfo}>
            <View style={styles.locationIcon}>
              <Text style={styles.locationIconText}>◎</Text>
            </View>
            <View style={styles.locationDetails}>
              <Text style={styles.locationAddress}>
                {user.location.address || 'No address set'}
              </Text>
              <Text style={styles.locationNeighborhood}>
                {user.location.neighborhood || 'Unknown neighborhood'}
              </Text>
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

          <SettingRow
            label="Push Notifications"
            description="Order updates and alerts"
            value={notifications}
            onValueChange={setNotifications}
          />

          <SettingRow
            label="Location Tracking"
            description="Required for drop zone calculations"
            value={locationTracking}
            onValueChange={setLocationTracking}
          />
        </MetroCard>

        {/* Payment */}
        <MetroCard style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>PAYMENT</Text>
          </View>
          <View style={styles.paymentMethod}>
            <View style={styles.cardIcon}>
              <Text style={styles.cardIconText}>⬡</Text>
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardLabel}>Visa ending in 4242</Text>
              <Text style={styles.cardExpiry}>Expires 12/27</Text>
            </View>
            <StatusBadge label="DEFAULT" variant="success" size="sm" />
          </View>
          <MetroButton
            title="ADD PAYMENT METHOD"
            variant="secondary"
            size="md"
            fullWidth
            onPress={() => {}}
            style={styles.addPaymentButton}
          />
        </MetroCard>

        {/* Support */}
        <MetroCard style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>SUPPORT</Text>
          </View>
          <TouchableOpacity style={styles.supportItem}>
            <Text style={styles.supportLabel}>Help Center</Text>
            <Text style={styles.supportArrow}>→</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.supportItem}>
            <Text style={styles.supportLabel}>Terms of Service</Text>
            <Text style={styles.supportArrow}>→</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.supportItem}>
            <Text style={styles.supportLabel}>Privacy Policy</Text>
            <Text style={styles.supportArrow}>→</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.supportItem}>
            <Text style={styles.supportLabel}>Contact Support</Text>
            <Text style={styles.supportArrow}>→</Text>
          </TouchableOpacity>
        </MetroCard>

        {/* Logout */}
        <MetroButton
          title="SIGN OUT"
          variant="danger"
          size="lg"
          fullWidth
          onPress={() => Alert.alert('Sign Out', 'Are you sure you want to sign out?')}
          style={styles.signOutButton}
        />

        {/* Version */}
        <Text style={styles.versionText}>METROPOLIS v1.0.0 • BUILD 2026.01.31</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingRow({
  label,
  description,
  value,
  onValueChange,
}: {
  label: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.settingRow}>
      <View style={styles.settingInfo}>
        <Text style={styles.settingLabel}>{label}</Text>
        <Text style={styles.settingDesc}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{
          false: MetroColors.border.default,
          true: MetroColors.accent.cyanMuted,
        }}
        thumbColor={value ? MetroColors.accent.cyan : MetroColors.text.muted}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: MetroColors.background.primary,
  },
  header: {
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: MetroColors.border.muted,
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
  headerActions: {
    flexDirection: 'row',
    gap: Spacing[2],
    alignItems: 'center',
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing[4],
    paddingBottom: Spacing[10],
  },
  profileCard: {
    marginBottom: Spacing[4],
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing[4],
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 4,
    backgroundColor: MetroColors.accent.cyanMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing[4],
  },
  avatarText: {
    color: MetroColors.accent.cyan,
    fontFamily: Fonts.mono,
    fontSize: FontSizes['2xl'],
    fontWeight: '700',
  },
  profileInfo: {
    flex: 1,
    gap: Spacing[1],
  },
  profileName: {
    color: MetroColors.text.primary,
    fontFamily: Fonts.sans,
    fontSize: FontSizes.xl,
    fontWeight: '700',
  },
  profileEmail: {
    color: MetroColors.text.tertiary,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.sm,
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
    color: MetroColors.text.muted,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.xs,
    letterSpacing: 1,
    marginBottom: Spacing[1],
  },
  profileStatValue: {
    color: MetroColors.text.primary,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  sectionCard: {
    marginBottom: Spacing[4],
  },
  sectionHeader: {
    marginBottom: Spacing[3],
  },
  sectionTitle: {
    color: MetroColors.text.muted,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.xs,
    letterSpacing: 2,
  },
  roleButtons: {
    flexDirection: 'row',
    gap: Spacing[2],
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationIcon: {
    width: 40,
    height: 40,
    borderRadius: 4,
    backgroundColor: MetroColors.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing[3],
  },
  locationIconText: {
    color: MetroColors.accent.cyan,
    fontSize: 20,
  },
  locationDetails: {
    flex: 1,
  },
  locationAddress: {
    color: MetroColors.text.primary,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.sm,
  },
  locationNeighborhood: {
    color: MetroColors.text.muted,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.xs,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: MetroColors.border.muted,
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    color: MetroColors.text.primary,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.sm,
  },
  settingDesc: {
    color: MetroColors.text.muted,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.xs,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing[3],
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 4,
    backgroundColor: MetroColors.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing[3],
  },
  cardIconText: {
    color: MetroColors.accent.cyan,
    fontSize: 20,
  },
  cardInfo: {
    flex: 1,
  },
  cardLabel: {
    color: MetroColors.text.primary,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.sm,
  },
  cardExpiry: {
    color: MetroColors.text.muted,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.xs,
  },
  addPaymentButton: {
    marginTop: Spacing[2],
  },
  supportItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: MetroColors.border.muted,
  },
  supportLabel: {
    color: MetroColors.text.secondary,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.sm,
  },
  supportArrow: {
    color: MetroColors.text.muted,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.md,
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
