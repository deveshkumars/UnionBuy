/**
 * Runner Tab Layout
 * Clean, friendly navigation for runner/driver screens
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
    jobs: 'briefcase-outline',
    mission: 'navigate-outline',
    checklist: 'checkbox-outline',
    scanner: 'scan-outline',
    account: 'person-outline',
  };

  const iconMapFocused: Record<string, keyof typeof Ionicons.glyphMap> = {
    jobs: 'briefcase',
    mission: 'navigate',
    checklist: 'checkbox',
    scanner: 'scan',
    account: 'person',
  };

  const iconName = focused ? iconMapFocused[name] : iconMap[name];

  return (
    <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
      <Ionicons 
        name={iconName || 'ellipse-outline'} 
        size={22} 
        color={focused ? MetroColors.accent.green : MetroColors.text.muted} 
      />
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
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 32,
    borderRadius: BorderRadius.md,
  },
  iconContainerActive: {
    backgroundColor: MetroColors.accent.greenMuted,
  },
});
