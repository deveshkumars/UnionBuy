/**
 * DataDisplay - Monospace number/price displays with labels
 * Used for prices, quantities, times, and other data points
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { MetroColors, FontSizes, Fonts, Spacing } from '@/constants/theme';

type DataVariant = 'default' | 'highlight' | 'warning' | 'success' | 'muted';
type DataSize = 'sm' | 'md' | 'lg' | 'xl';

interface DataDisplayProps {
  value: string | number;
  label?: string;
  prefix?: string;
  suffix?: string;
  variant?: DataVariant;
  size?: DataSize;
  align?: 'left' | 'center' | 'right';
  style?: ViewStyle;
}

const variantColors: Record<DataVariant, string> = {
  default: MetroColors.text.primary,
  highlight: MetroColors.accent.cyan,
  warning: MetroColors.accent.orange,
  success: MetroColors.accent.green,
  muted: MetroColors.text.muted,
};

const sizeMap: Record<DataSize, number> = {
  sm: FontSizes.sm,
  md: FontSizes.lg,
  lg: FontSizes['2xl'],
  xl: FontSizes['4xl'],
};

export function DataDisplay({
  value,
  label,
  prefix,
  suffix,
  variant = 'default',
  size = 'md',
  align = 'left',
  style,
}: DataDisplayProps) {
  const color = variantColors[variant];
  const fontSize = sizeMap[size];

  return (
    <View style={[styles.container, { alignItems: alignMap[align] }, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.valueContainer}>
        {prefix && (
          <Text style={[styles.affix, { fontSize: fontSize * 0.6, color }]}>{prefix}</Text>
        )}
        <Text style={[styles.value, { fontSize, color }]}>{value}</Text>
        {suffix && (
          <Text style={[styles.affix, { fontSize: fontSize * 0.6, color }]}>{suffix}</Text>
        )}
      </View>
    </View>
  );
}

const alignMap = {
  left: 'flex-start',
  center: 'center',
  right: 'flex-end',
} as const;

// Price display shorthand
interface PriceDisplayProps {
  amount: number;
  label?: string;
  variant?: DataVariant;
  size?: DataSize;
  showCents?: boolean;
  style?: ViewStyle;
}

export function PriceDisplay({
  amount,
  label,
  variant = 'highlight',
  size = 'md',
  showCents = true,
  style,
}: PriceDisplayProps) {
  const formattedAmount = showCents ? amount.toFixed(2) : Math.floor(amount).toString();

  return (
    <DataDisplay
      value={formattedAmount}
      label={label}
      prefix="$"
      variant={variant}
      size={size}
      style={style}
    />
  );
}

// Quantity display
interface QuantityDisplayProps {
  current: number;
  total: number;
  label?: string;
  unit?: string;
  variant?: DataVariant;
  style?: ViewStyle;
}

export function QuantityDisplay({
  current,
  total,
  label,
  unit = 'units',
  variant = 'default',
  style,
}: QuantityDisplayProps) {
  const color = variantColors[variant];
  const progress = current / total;
  const progressVariant = progress >= 1 ? 'success' : progress >= 0.5 ? 'highlight' : 'warning';

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.quantityRow}>
        <Text style={[styles.value, { color: variantColors[progressVariant], fontSize: FontSizes.lg }]}>
          {current}
        </Text>
        <Text style={[styles.separator, { color }]}>/</Text>
        <Text style={[styles.value, { color: MetroColors.text.tertiary, fontSize: FontSizes.lg }]}>
          {total}
        </Text>
        <Text style={[styles.unit, { color: MetroColors.text.muted }]}>{unit}</Text>
      </View>
    </View>
  );
}

// Time display
interface TimeDisplayProps {
  time: string;
  label?: string;
  variant?: DataVariant;
  style?: ViewStyle;
}

export function TimeDisplay({
  time,
  label,
  variant = 'default',
  style,
}: TimeDisplayProps) {
  return (
    <DataDisplay
      value={time}
      label={label}
      variant={variant}
      size="md"
      style={style}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing[1],
  },
  label: {
    color: MetroColors.text.tertiary,
    fontSize: FontSizes.xs,
    fontFamily: Fonts.mono,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  value: {
    fontFamily: Fonts.mono,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  affix: {
    fontFamily: Fonts.mono,
    fontWeight: '500',
    marginHorizontal: 2,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  separator: {
    fontFamily: Fonts.mono,
    fontSize: FontSizes.md,
    marginHorizontal: 2,
  },
  unit: {
    fontFamily: Fonts.mono,
    fontSize: FontSizes.xs,
    marginLeft: Spacing[1],
    textTransform: 'lowercase',
  },
});

