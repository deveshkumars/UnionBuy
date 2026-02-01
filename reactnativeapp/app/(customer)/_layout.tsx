/**
 * Customer Tab Layout
 * Main navigation for customer-facing screens
 */

import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { FontSizes, Fonts, MetroColors, Shadows, Spacing } from '@/constants/theme';

// Custom tab bar icon component
function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons: Record<string, string> = {
    market: 'MKT',
    pledges: 'PLG',
    operations: 'OPS',
    cart: 'CRT',
    wallet: 'WLT',
    account: 'ACC',
  };

  return (
    <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
      <Text style={[styles.icon, focused && styles.iconActive]}>
        {icons[name] || 'O'}
      </Text>
    </View>
  );
}

export default function CustomerTabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: MetroColors.accent.cyan,
        tabBarInactiveTintColor: MetroColors.text.tertiary,
        tabBarLabelStyle: styles.tabLabel,
        tabBarButton: HapticTab,
        tabBarIconStyle: styles.tabIcon,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Market',
          tabBarIcon: ({ focused }) => <TabIcon name="market" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="pledges"
        options={{
          title: 'Pledges',
          tabBarIcon: ({ focused }) => <TabIcon name="pledges" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="operations"
        options={{
          title: 'Track',
          tabBarIcon: ({ focused }) => <TabIcon name="operations" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Account',
          tabBarIcon: ({ focused }) => <TabIcon name="account" focused={focused} />,
        }}
      />
      {/* Hidden screens - accessible via navigation but not in tab bar */}
      <Tabs.Screen
        name="wallet"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="test-db"
        options={{
          href: null, // Hide from tab bar
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: MetroColors.background.secondary,
    borderTopWidth: 1.5,
    borderTopColor: MetroColors.border.accent,
    height: 82,
    paddingTop: Spacing[2],
    paddingBottom: Spacing[5],
  },
  tabLabel: {
    fontFamily: Fonts.mono,
    fontSize: FontSizes.xs,
    fontWeight: '600',
    marginTop: 6,
    letterSpacing: 0.5,
    textTransform: 'capitalize',
  },
  tabIcon: {
    marginBottom: 0,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 34,
    height: 28,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: MetroColors.border.muted,
    backgroundColor: MetroColors.background.primary,
  },
  iconContainerActive: {
    borderColor: MetroColors.accent.cyan,
    backgroundColor: MetroColors.accent.cyanMuted,
    ...Shadows.cyanGlow,
  },
  icon: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    letterSpacing: 1,
    color: MetroColors.text.tertiary,
  },
  iconActive: {
    color: MetroColors.accent.cyan,
    transform: [{ scale: 1.05 }],
  },
});
