/**
 * StatusBadge - Confidence scores and status indicators
 * Used for agent verification, order status, and trust scores
 */

import { BorderRadius, FontSizes, Fonts, MetroColors, Spacing } from '@/constants/theme';
import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';

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
  sm: { padding: Spacing[2], fontSize: FontSizes.sm },
  md: { padding: Spacing[2], fontSize: FontSizes.md },
  lg: { padding: Spacing[3], fontSize: FontSizes.lg },
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
            fontWeight: '800',
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
      <StatusBadge label={`${score}%`} variant={getVariant()} size="md" />
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
      {(() => {
        const starSize = 20;
        const starGap = 4;
        const totalWidth = maxScore * starSize + (maxScore - 1) * starGap;
        return (
          <View style={[styles.trustStarsContainer, { width: totalWidth, columnGap: starGap }]}>
        {Array.from({ length: maxScore }, (_, i) => {
          const fill = Math.max(0, Math.min(1, score - i));
          const fillWidth = starSize * fill;
          return (
            <View key={i} style={[styles.starCell, { width: starSize, height: starSize }]}>
              <Text style={[styles.starText, styles.starEmpty]}>★</Text>
              <View style={[styles.starFillMask, { width: fillWidth }]}>
                <Text style={[styles.starText, styles.starFill]}>★</Text>
              </View>
            </View>
          );
        })}
          </View>
        );
      })()}
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
      size="md"
      pulse={status === 'active'}
      style={style}
    />
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: BorderRadius.md,
    gap: Spacing[1],
  },
  pulseIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    opacity: 0.9,
  },
  iconContainer: {
    marginRight: Spacing[1],
  },
  label: {
    fontFamily: Fonts.sans,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  confidenceLabel: {
    color: MetroColors.text.secondary,
    fontFamily: Fonts.sans,
    fontSize: FontSizes.sm,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  trustContainer: {
    gap: Spacing[2],
  },
  trustLabel: {
    color: MetroColors.text.secondary,
    fontFamily: Fonts.sans,
    fontSize: FontSizes.sm,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  trustStarsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'nowrap',
  },
  starCell: {
    width: 24,
    height: 24,
  },
  starText: {
    fontSize: 22,
    lineHeight: 24,
    fontFamily: Fonts.sans,
  },
  starEmpty: {
    color: MetroColors.border.default,
  },
  starFill: {
    color: MetroColors.accent.yellow,
  },
  starFillMask: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: 24,
    overflow: 'hidden',
  },
  trustValue: {
    fontFamily: Fonts.heading,
    fontSize: FontSizes.lg,
    fontWeight: '800',
  },
});
