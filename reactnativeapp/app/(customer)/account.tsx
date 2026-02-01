/**
 * Account Screen - User Settings
 * Profile, payment info, preferences, and role switching
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
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
    MetroButton,
    MetroCard,
    StatusBadge,
    TrustScore,
} from '@/components/metro';
import { FontSizes, Fonts, MetroColors, Spacing } from '@/constants/theme';
import { useApp, useRole, useUser } from '@/context/AppContext';
import { isBackendConfigured } from '@/lib/amplify';

export default function AccountScreen() {
  const { user } = useApp();
  const { role, switchRole } = useRole();
  const { isAuthenticated, authInitialized } = useUser();
  const [notifications, setNotifications] = useState(true);
  const [locationTracking, setLocationTracking] = useState(true);
  const router = useRouter();

  const setRoleAndNavigate = (newRole: 'customer' | 'runner') => {
    switchRole(newRole);
    // Force navigation to the correct layout
    if (newRole === 'customer') {
      router.replace('/(customer)');
    } else {
      router.replace('/(runner)');
    }
  };

  const handleRoleSwitch = () => {}; // legacy stub, replaced by direct buttons
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
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to sign out');
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
          <Text style={styles.headerTitle}>Account</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.utilityPill} onPress={() => router.push('/(customer)/cart')}>
            <Text style={styles.utilityIcon}>CRT</Text>
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

        {/* Location */}
        <MetroCard style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>LOCATION</Text>
          </View>
          <View style={styles.locationInfo}>
            <View style={styles.locationIcon}>
              <Text style={styles.locationIconText}>LOC</Text>
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
              <Text style={styles.cardIconText}>CARD</Text>
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
          <View>
            <Text style={styles.sectionTitle}>SUPPORT</Text>
          </View>
          <TouchableOpacity style={styles.supportItem} onPress={() => router.push('/(customer)/test-db')}>
            <Text style={styles.supportLabel}>TEST DynamoDB</Text>
            <Text style={styles.supportArrow}>></Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.supportItem}>
            <Text style={styles.supportLabel}>Help Center</Text>
            <Text style={styles.supportArrow}>></Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.supportItem}>
            <Text style={styles.supportLabel}>Terms of Service</Text>
            <Text style={styles.supportArrow}>></Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.supportItem}>
            <Text style={styles.supportLabel}>Privacy Policy</Text>
            <Text style={styles.supportArrow}>></Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.supportItem}>
            <Text style={styles.supportLabel}>Contact Support</Text>
            <Text style={styles.supportArrow}>></Text>
          </TouchableOpacity>
        </MetroCard>

        {/* Auth Status & Actions */}
        {authInitialized && (
          <MetroCard style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>AUTHENTICATION</Text>
            </View>
            <View style={styles.authStatus}>
              <StatusBadge 
                label={isAuthenticated ? 'SIGNED IN' : 'NOT SIGNED IN'} 
                variant={isAuthenticated ? 'success' : 'warning'} 
                size="sm" 
              />
              <Text style={styles.authDescription}>
                {isAuthenticated 
                  ? 'Your pledges are saved to the cloud' 
                  : 'Sign in to save pledges to DynamoDB'}
              </Text>
            </View>
            {isAuthenticated ? (
              <MetroButton
                title="SIGN OUT"
                variant="danger"
                size="lg"
                fullWidth
                onPress={handleSignOut}
              />
            ) : (
              <MetroButton
                title="SIGN IN / SIGN UP"
                variant="primary"
                size="lg"
                fullWidth
                onPress={() => router.push('/auth')}
              />
            )}
          </MetroCard>
        )}

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
    paddingVertical: Spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: MetroColors.border.muted,
    backgroundColor: MetroColors.background.secondary,
  },
  headerLabel: {
    color: MetroColors.accent.indigo,
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
    color: MetroColors.accent.cyan,
    fontFamily: Fonts.mono,
    fontSize: 10,
    letterSpacing: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing[3],
    paddingBottom: Spacing[9],
  },
  profileCard: {
    marginBottom: Spacing[3],
    paddingVertical: Spacing[4],
    paddingHorizontal: Spacing[3],
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing[4],
  },
  avatarContainer: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: MetroColors.accent.indigoMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing[4],
  },
  avatarText: {
    color: MetroColors.accent.indigo,
    fontFamily: Fonts.heading,
    fontSize: FontSizes['3xl'],
    fontWeight: '800',
  },
  profileInfo: {
    flex: 1,
    gap: Spacing[2],
  },
  profileName: {
    color: MetroColors.text.primary,
    fontFamily: Fonts.heading,
    fontSize: FontSizes.xl,
    fontWeight: '700',
    lineHeight: 28,
  },
  profileEmail: {
    color: MetroColors.text.tertiary,
    fontFamily: Fonts.body,
    fontSize: FontSizes.md,
  },
  profileStats: {
    flexDirection: 'row',
    paddingTop: Spacing[3],
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
    fontSize: FontSizes.lg,
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
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: MetroColors.accent.cyanMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing[3],
  },
  locationIconText: {
    color: MetroColors.accent.cyan,
    fontFamily: Fonts.mono,
    fontSize: 12,
    letterSpacing: 1,
  },
  locationDetails: {
    flex: 1,
  },
  locationAddress: {
    color: MetroColors.text.primary,
    fontFamily: Fonts.body,
    fontSize: FontSizes.md,
    fontWeight: '600',
    marginBottom: 4,
  },
  locationNeighborhood: {
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
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing[3],
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: MetroColors.accent.greenMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing[3],
  },
  cardIconText: {
    color: MetroColors.accent.green,
    fontFamily: Fonts.mono,
    fontSize: 10,
    letterSpacing: 1,
  },
  cardInfo: {
    flex: 1,
  },
  cardLabel: {
    color: MetroColors.text.primary,
    fontFamily: Fonts.body,
    fontSize: FontSizes.md,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardExpiry: {
    color: MetroColors.text.secondary,
    fontFamily: Fonts.body,
    fontSize: FontSizes.sm,
    fontWeight: '500',
  },
  addPaymentButton: {
    marginTop: Spacing[2],
  },
  supportItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: MetroColors.border.muted,
  },
  supportLabel: {
    color: MetroColors.text.primary,
    fontFamily: Fonts.body,
    fontSize: FontSizes.md,
    fontWeight: '500',
  },
  supportArrow: {
    color: MetroColors.accent.cyan,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.lg,
    fontWeight: '700',
  },
  authStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing[3],
    gap: Spacing[2],
  },
  authDescription: {
    flex: 1,
    color: MetroColors.text.muted,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.xs,
  },
  versionText: {
    color: MetroColors.text.muted,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.xs,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
});
