/**
 * StatusBadge - Soft, friendly status indicators
 * Clean pill badges with warm colors
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

const variantStyles: Record<BadgeVariant, { bg: string; text: string }> = {
  default: {
    bg: MetroColors.background.tertiary,
    text: MetroColors.text.secondary,
  },
  success: {
    bg: MetroColors.accent.greenMuted,
    text: MetroColors.accent.green,
  },
  warning: {
    bg: MetroColors.accent.orangeMuted,
    text: MetroColors.accent.orange,
  },
  danger: {
    bg: MetroColors.accent.redMuted,
    text: MetroColors.accent.red,
  },
  info: {
    bg: MetroColors.accent.cyanMuted,
    text: MetroColors.accent.cyan,
  },
  locked: {
    bg: MetroColors.accent.purpleMuted,
    text: MetroColors.accent.purple,
  },
};

const sizeStyles: Record<BadgeSize, { paddingV: number; paddingH: number; fontSize: number }> = {
  sm: { paddingV: 4, paddingH: 10, fontSize: FontSizes.xs },
  md: { paddingV: 6, paddingH: 12, fontSize: FontSizes.sm },
  lg: { paddingV: 8, paddingH: 16, fontSize: FontSizes.md },
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
          paddingVertical: dimensions.paddingV,
          paddingHorizontal: dimensions.paddingH,
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

export function ConfidenceBadge({ score, label = 'Confidence', style }: ConfidenceBadgeProps) {
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
        {score.toFixed(1)}
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
  pending: 'Pending',
  locked: 'Locked',
  active: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
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
    borderRadius: BorderRadius.full,
    gap: Spacing[1],
  },
  pulseIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    opacity: 0.9,
  },
  iconContainer: {
    marginRight: 2,
  },
  label: {
    fontFamily: Fonts.body,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  confidenceLabel: {
    color: MetroColors.text.tertiary,
    fontFamily: Fonts.body,
    fontSize: FontSizes.sm,
    fontWeight: '500',
  },
  trustContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  trustStarsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'nowrap',
  },
  starCell: {
    width: 20,
    height: 20,
  },
  starText: {
    fontSize: 18,
    lineHeight: 20,
    fontFamily: Fonts.body,
  },
  starEmpty: {
    color: MetroColors.border.default,
  },
  starFill: {
    color: MetroColors.accent.orange,
  },
  starFillMask: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: 20,
    overflow: 'hidden',
  },
  trustValue: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.lg,
    fontWeight: '700',
  },
});
