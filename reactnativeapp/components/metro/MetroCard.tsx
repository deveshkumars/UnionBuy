/**
 * MetroCard - Bounding box container with corner accents
 * The signature Metropolis card component with cyberpunk aesthetics
 */

import { BorderRadius, MetroColors, Shadows, Spacing } from '@/constants/theme';
import React from 'react';
import { Animated, StyleSheet, View, ViewProps } from 'react-native';

type CardVariant = 'default' | 'active' | 'warning' | 'success' | 'locked';

interface MetroCardProps extends ViewProps {
  variant?: CardVariant;
  showCorners?: boolean;
  glowing?: boolean;
  label?: string;
  children: React.ReactNode;
}

const variantColors: Record<CardVariant, string> = {
  default: MetroColors.border.accent,
  active: MetroColors.accent.cyan,
  warning: MetroColors.accent.yellow,
  success: MetroColors.accent.green,
  locked: MetroColors.accent.pink,
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
    borderWidth: 1.5,
    borderRadius: BorderRadius.lg,
    position: 'relative',
    overflow: 'hidden',
  },
  content: {
    padding: Spacing[4],
  },
  corner: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderWidth: 2.5,
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
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  scanLine: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    opacity: 0.8,
  },
});
