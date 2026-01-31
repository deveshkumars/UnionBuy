/**
 * Runner Tab Layout
 * Main navigation for runner/driver screens
 */

import { Tabs } from 'expo-router';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { MetroColors, FontSizes, Fonts, Spacing } from '@/constants/theme';

// Custom tab bar icon component
function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons: Record<string, string> = {
    jobs: '▣',
    mission: '◉',
    checklist: '☰',
    scanner: '⌗',
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

export default function RunnerTabLayout() {
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
          title: 'JOBS',
          tabBarIcon: ({ focused }) => <TabIcon name="jobs" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="mission"
        options={{
          title: 'MISSION',
          tabBarIcon: ({ focused }) => <TabIcon name="mission" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="checklist"
        options={{
          title: 'CHECKLIST',
          tabBarIcon: ({ focused }) => <TabIcon name="checklist" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="scanner"
        options={{
          title: 'SCANNER',
          tabBarIcon: ({ focused }) => <TabIcon name="scanner" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: MetroColors.background.primary,
    borderTopWidth: 1,
    borderTopColor: MetroColors.accent.green + '40',
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
    backgroundColor: MetroColors.accent.greenMuted,
    borderRadius: 4,
  },
  icon: {
    fontSize: 20,
    color: MetroColors.text.muted,
  },
  iconActive: {
    color: MetroColors.accent.green,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -2,
    width: 4,
    height: 4,
    backgroundColor: MetroColors.accent.green,
    borderRadius: 2,
  },
});
