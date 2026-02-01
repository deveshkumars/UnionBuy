/**
 * MetroCard - Clean card container with soft shadows
 * Warm, community-focused design without corner accents
 */

import { BorderRadius, MetroColors, Shadows, Spacing } from '@/constants/theme';
import React from 'react';
import { StyleSheet, Text, View, ViewProps } from 'react-native';

type CardVariant = 'default' | 'active' | 'warning' | 'success' | 'locked';

interface MetroCardProps extends ViewProps {
  variant?: CardVariant;
  showCorners?: boolean; // Kept for API compatibility but ignored
  glowing?: boolean;
  label?: string;
  children: React.ReactNode;
}

const variantColors: Record<CardVariant, { border: string; accent: string }> = {
  default: { border: 'transparent', accent: MetroColors.accent.cyan },
  active: { border: MetroColors.accent.cyan, accent: MetroColors.accent.cyan },
  warning: { border: MetroColors.accent.orange, accent: MetroColors.accent.orange },
  success: { border: MetroColors.accent.green, accent: MetroColors.accent.green },
  locked: { border: MetroColors.accent.purple, accent: MetroColors.accent.purple },
};

export function MetroCard({
  variant = 'default',
  showCorners = false, // Ignored - no longer used
  glowing = false,
  label,
  children,
  style,
  ...props
}: MetroCardProps) {
  const colors = variantColors[variant];
  const isHighlighted = variant !== 'default';

  return (
    <View
      style={[
        styles.container,
        isHighlighted && { borderColor: colors.border, borderWidth: 2 },
        glowing && Shadows.md,
        style,
      ]}
      {...props}
    >
      {/* Metadata Label */}
      {label && (
        <View style={[styles.labelContainer, { backgroundColor: colors.accent }]}>
          <Text style={styles.labelText}>{label}</Text>
        </View>
      )}

      {/* Content */}
      <View style={styles.content}>{children}</View>

      {/* Subtle accent bar for highlighted cards */}
      {isHighlighted && (
        <View style={[styles.accentBar, { backgroundColor: colors.accent }]} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: MetroColors.background.secondary,
    borderRadius: BorderRadius.lg,
    position: 'relative',
    overflow: 'hidden',
    ...Shadows.sm,
  },
  content: {
    padding: Spacing[4],
  },
  labelContainer: {
    position: 'absolute',
    top: Spacing[3],
    right: Spacing[3],
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[1],
    borderRadius: BorderRadius.full,
    zIndex: 1,
  },
  labelText: {
    color: MetroColors.text.inverse,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  accentBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    borderBottomLeftRadius: BorderRadius.lg,
    borderBottomRightRadius: BorderRadius.lg,
  },
});
