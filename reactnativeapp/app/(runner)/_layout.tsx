/**
 * Runner Tab Layout
 * Main navigation for runner/driver screens
 */

import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { FontSizes, Fonts, MetroColors, Spacing } from '@/constants/theme';

// Custom tab bar icon component
function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons: Record<string, string> = {
    jobs: 'JOB',
    mission: 'HUD',
    checklist: 'LST',
    scanner: 'SCN',
    account: 'ACC',
  };

  return (
    <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
      <Text style={[styles.icon, focused && styles.iconActive]}>
        {icons[name] || 'O'}
      </Text>
      {focused && <View style={styles.activeIndicator} />}
    </View>
  );
}

export default function RunnerTabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: MetroColors.accent.green,
        tabBarInactiveTintColor: MetroColors.text.muted,
        tabBarLabelStyle: styles.tabLabel,
        tabBarButton: HapticTab,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Jobs',
          tabBarIcon: ({ focused }) => <TabIcon name="jobs" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="mission"
        options={{
          title: 'Mission',
          tabBarIcon: ({ focused }) => <TabIcon name="mission" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="checklist"
        options={{
          title: 'Checklist',
          tabBarIcon: ({ focused }) => <TabIcon name="checklist" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="scanner"
        options={{
          title: 'Scanner',
          tabBarIcon: ({ focused }) => <TabIcon name="scanner" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Account',
          tabBarIcon: ({ focused }) => <TabIcon name="account" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: MetroColors.background.secondary,
    borderTopWidth: 1.5,
    borderTopColor: MetroColors.accent.green,
    height: 82,
    paddingTop: Spacing[2],
    paddingBottom: Spacing[5],
  },
  tabLabel: {
    fontFamily: Fonts.mono,
    fontSize: FontSizes.xs,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginTop: 4,
    textTransform: 'capitalize',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: MetroColors.border.muted,
    backgroundColor: MetroColors.background.primary,
  },
  iconContainerActive: {
    backgroundColor: MetroColors.accent.greenMuted,
    borderColor: MetroColors.accent.green,
  },
  icon: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    fontWeight: '700',
    color: MetroColors.text.muted,
  },
  iconActive: {
    color: MetroColors.accent.green,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -6,
    width: 4,
    height: 4,
    backgroundColor: MetroColors.accent.green,
    borderRadius: 2,
  },
});
