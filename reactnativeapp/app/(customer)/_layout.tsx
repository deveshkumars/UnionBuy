/**
 * Customer Tab Layout
 * Clean, friendly navigation for customer-facing screens
 */

import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { BorderRadius, FontSizes, Fonts, MetroColors, Shadows, Spacing } from '@/constants/theme';

// Tab icon component with Ionicons
function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
    market: 'storefront-outline',
    pledges: 'receipt-outline',
    operations: 'map-outline',
    cart: 'cart-outline',
    wallet: 'wallet-outline',
    account: 'person-outline',
  };

  const iconMapFocused: Record<string, keyof typeof Ionicons.glyphMap> = {
    market: 'storefront',
    pledges: 'receipt',
    operations: 'map',
    cart: 'cart',
    wallet: 'wallet',
    account: 'person',
  };

  const iconName = focused ? iconMapFocused[name] : iconMap[name];

  return (
    <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
      <Ionicons 
        name={iconName || 'ellipse-outline'} 
        size={22} 
        color={focused ? MetroColors.accent.cyan : MetroColors.text.muted} 
      />
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
        tabBarInactiveTintColor: MetroColors.text.muted,
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
    borderTopWidth: 1,
    borderTopColor: MetroColors.border.default,
    height: 88,
    paddingTop: Spacing[2],
    paddingBottom: Spacing[6],
    ...Shadows.sm,
  },
  tabLabel: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.xs,
    fontWeight: '500',
    marginTop: 4,
  },
  tabIcon: {
    marginBottom: 0,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 32,
    borderRadius: BorderRadius.md,
  },
  iconContainerActive: {
    backgroundColor: MetroColors.accent.cyanMuted,
  },
});
