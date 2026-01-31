/**
 * StatusBadge - Confidence scores and status indicators
 * Used for agent verification, order status, and trust scores
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { MetroColors, FontSizes, Fonts, Spacing, BorderRadius } from '@/constants/theme';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'locked';
type BadgeSize = 'sm' | 'md' | 'lg';

interface StatusBadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: React.ReactNode;
  pulse?: boolean;
  style?: ViewStyle;
}

const variantStyles: Record<BadgeVariant, { bg: string; border: string; text: string }> = {
  default: {
    bg: MetroColors.background.tertiary,
    border: MetroColors.border.default,
    text: MetroColors.text.secondary,
  },
  success: {
    bg: MetroColors.accent.greenMuted,
    border: MetroColors.accent.green,
    text: MetroColors.accent.green,
  },
  warning: {
    bg: MetroColors.accent.orangeMuted,
    border: MetroColors.accent.orange,
    text: MetroColors.accent.orange,
  },
  danger: {
    bg: MetroColors.accent.redMuted,
    border: MetroColors.accent.red,
    text: MetroColors.accent.red,
  },
  info: {
    bg: MetroColors.accent.cyanMuted,
    border: MetroColors.accent.cyan,
    text: MetroColors.accent.cyan,
  },
  locked: {
    bg: MetroColors.accent.purpleMuted,
    border: MetroColors.accent.purple,
    text: MetroColors.accent.purple,
  },
};

const sizeStyles: Record<BadgeSize, { padding: number; fontSize: number }> = {
  sm: { padding: Spacing[1], fontSize: FontSizes.xs },
  md: { padding: Spacing[2], fontSize: FontSizes.sm },
  lg: { padding: Spacing[3], fontSize: FontSizes.md },
};

export function StatusBadge({
  label,
  variant = 'default',
  size = 'md',
  icon,
  pulse = false,
  style,
}: StatusBadgeProps) {
  const colors = variantStyles[variant];
  const dimensions = sizeStyles[size];

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: colors.bg,
          borderColor: colors.border,
          paddingVertical: dimensions.padding,
          paddingHorizontal: dimensions.padding * 1.5,
        },
        style,
      ]}
    >
      {pulse && <View style={[styles.pulseIndicator, { backgroundColor: colors.text }]} />}
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <Text
        style={[
          styles.label,
          {
            color: colors.text,
            fontSize: dimensions.fontSize,
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

// Confidence Score Badge
interface ConfidenceBadgeProps {
  score: number; // 0 to 100
  label?: string;
  style?: ViewStyle;
}

export function ConfidenceBadge({ score, label = 'CONFIDENCE', style }: ConfidenceBadgeProps) {
  const getVariant = (): BadgeVariant => {
    if (score >= 90) return 'success';
    if (score >= 70) return 'info';
    if (score >= 50) return 'warning';
    return 'danger';
  };

  return (
    <View style={[styles.confidenceContainer, style]}>
      <Text style={styles.confidenceLabel}>{label}</Text>
      <StatusBadge label={`${score}%`} variant={getVariant()} size="sm" />
    </View>
  );
}

// Trust Score Display
interface TrustScoreProps {
  score: number; // 0 to 5
  maxScore?: number;
  style?: ViewStyle;
}

export function TrustScore({ score, maxScore = 5, style }: TrustScoreProps) {
  const getColor = () => {
    const percentage = score / maxScore;
    if (percentage >= 0.8) return MetroColors.accent.green;
    if (percentage >= 0.6) return MetroColors.accent.cyan;
    if (percentage >= 0.4) return MetroColors.accent.orange;
    return MetroColors.accent.red;
  };

  return (
    <View style={[styles.trustContainer, style]}>
      <Text style={styles.trustLabel}>TRUST SCORE</Text>
      <View style={styles.trustDotsContainer}>
        {Array.from({ length: maxScore }, (_, i) => (
          <View
            key={i}
            style={[
              styles.trustDot,
              {
                backgroundColor: i < score ? getColor() : MetroColors.border.muted,
              },
            ]}
          />
        ))}
      </View>
      <Text style={[styles.trustValue, { color: getColor() }]}>
        {score.toFixed(1)}/{maxScore}
      </Text>
    </View>
  );
}

// Order Status Badge
type OrderStatus = 'pending' | 'locked' | 'active' | 'completed' | 'cancelled';

interface OrderStatusBadgeProps {
  status: OrderStatus;
  style?: ViewStyle;
}

const statusLabels: Record<OrderStatus, string> = {
  pending: 'PENDING',
  locked: 'FUNDS LOCKED',
  active: 'IN PROGRESS',
  completed: 'COMPLETED',
  cancelled: 'CANCELLED',
};

const statusVariants: Record<OrderStatus, BadgeVariant> = {
  pending: 'warning',
  locked: 'locked',
  active: 'info',
  completed: 'success',
  cancelled: 'danger',
};

export function OrderStatusBadge({ status, style }: OrderStatusBadgeProps) {
  return (
    <StatusBadge
      label={statusLabels[status]}
      variant={statusVariants[status]}
      size="sm"
      pulse={status === 'active'}
      style={style}
    />
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    gap: Spacing[1],
  },
  pulseIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    opacity: 0.8,
  },
  iconContainer: {
    marginRight: Spacing[1],
  },
  label: {
    fontFamily: Fonts.mono,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  confidenceLabel: {
    color: MetroColors.text.muted,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.xs,
    letterSpacing: 0.5,
  },
  trustContainer: {
    gap: Spacing[1],
  },
  trustLabel: {
    color: MetroColors.text.tertiary,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.xs,
    letterSpacing: 1,
  },
  trustDotsContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  trustDot: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  trustValue: {
    fontFamily: Fonts.mono,
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
});

