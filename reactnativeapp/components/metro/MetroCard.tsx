/**
 * MetroCard - Bounding box container with corner accents
 * The signature Metropolis card component with cyberpunk aesthetics
 */

import React from 'react';
import { View, StyleSheet, ViewProps, Animated } from 'react-native';
import { MetroColors, BorderRadius, Spacing, Shadows } from '@/constants/theme';

type CardVariant = 'default' | 'active' | 'warning' | 'success' | 'locked';

interface MetroCardProps extends ViewProps {
  variant?: CardVariant;
  showCorners?: boolean;
  glowing?: boolean;
  label?: string;
  children: React.ReactNode;
}

const variantColors: Record<CardVariant, string> = {
  default: MetroColors.border.default,
  active: MetroColors.accent.cyan,
  warning: MetroColors.accent.orange,
  success: MetroColors.accent.green,
  locked: MetroColors.accent.purple,
};

export function MetroCard({
  variant = 'default',
  showCorners = true,
  glowing = false,
  label,
  children,
  style,
  ...props
}: MetroCardProps) {
  const borderColor = variantColors[variant];
  const isHighlighted = variant !== 'default';

  return (
    <View
      style={[
        styles.container,
        { borderColor },
        glowing && variant === 'active' && Shadows.cyanGlow,
        glowing && variant === 'warning' && Shadows.orangeGlow,
        style,
      ]}
      {...props}
    >
      {/* Corner Accents */}
      {showCorners && (
        <>
          <View style={[styles.corner, styles.topLeft, { borderColor }]} />
          <View style={[styles.corner, styles.topRight, { borderColor }]} />
          <View style={[styles.corner, styles.bottomLeft, { borderColor }]} />
          <View style={[styles.corner, styles.bottomRight, { borderColor }]} />
        </>
      )}

      {/* Metadata Label */}
      {label && (
        <View style={[styles.labelContainer, { backgroundColor: borderColor }]}>
          <Animated.Text style={styles.labelText}>{label}</Animated.Text>
        </View>
      )}

      {/* Content */}
      <View style={styles.content}>{children}</View>

      {/* Scan line effect for highlighted cards */}
      {isHighlighted && <View style={[styles.scanLine, { backgroundColor: borderColor }]} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: MetroColors.background.secondary,
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    position: 'relative',
    overflow: 'hidden',
  },
  content: {
    padding: Spacing[4],
  },
  corner: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderWidth: 2,
  },
  topLeft: {
    top: -1,
    left: -1,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: BorderRadius.sm,
  },
  topRight: {
    top: -1,
    right: -1,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: BorderRadius.sm,
  },
  bottomLeft: {
    bottom: -1,
    left: -1,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: BorderRadius.sm,
  },
  bottomRight: {
    bottom: -1,
    right: -1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: BorderRadius.sm,
  },
  labelContainer: {
    position: 'absolute',
    top: 0,
    right: 16,
    paddingHorizontal: Spacing[2],
    paddingVertical: Spacing[1],
    borderBottomLeftRadius: BorderRadius.sm,
    borderBottomRightRadius: BorderRadius.sm,
  },
  labelText: {
    color: MetroColors.background.primary,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  scanLine: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    opacity: 0.6,
  },
});
