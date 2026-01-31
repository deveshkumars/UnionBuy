/**
 * Customer Tab Layout
 * Main navigation for customer-facing screens
 */

import { Tabs } from 'expo-router';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { MetroColors, FontSizes, Fonts, Spacing } from '@/constants/theme';

// Custom tab bar icon component
function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons: Record<string, string> = {
    market: '◈',
    pledges: '◇',
    operations: '◎',
    wallet: '⬡',
    account: '◉',
  };

  return (
    <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
      <Text style={[styles.icon, focused && styles.iconActive]}>
        {icons[name] || '○'}
      </Text>
      {focused && <View style={styles.activeIndicator} />}
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
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'MARKET',
          tabBarIcon: ({ focused }) => <TabIcon name="market" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="pledges"
        options={{
          title: 'PLEDGES',
          tabBarIcon: ({ focused }) => <TabIcon name="pledges" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="operations"
        options={{
          title: 'OPS',
          tabBarIcon: ({ focused }) => <TabIcon name="operations" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: 'WALLET',
          tabBarIcon: ({ focused }) => <TabIcon name="wallet" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'ACCOUNT',
          tabBarIcon: ({ focused }) => <TabIcon name="account" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: MetroColors.background.primary,
    borderTopWidth: 1,
    borderTopColor: MetroColors.border.muted,
    height: 85,
    paddingTop: Spacing[2],
    paddingBottom: Spacing[6],
  },
  tabLabel: {
    fontFamily: Fonts.mono,
    fontSize: FontSizes.xs,
    letterSpacing: 1,
    marginTop: 4,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 36,
  },
  iconContainerActive: {
    backgroundColor: MetroColors.accent.cyanMuted,
    borderRadius: 4,
  },
  icon: {
    fontSize: 20,
    color: MetroColors.text.muted,
  },
  iconActive: {
    color: MetroColors.accent.cyan,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -2,
    width: 4,
    height: 4,
    backgroundColor: MetroColors.accent.cyan,
    borderRadius: 2,
  },
});

