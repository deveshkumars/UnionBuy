/**
 * DataDisplay - Monospace number/price displays with labels
 * Used for prices, quantities, times, and other data points
 */

import { FontSizes, Fonts, MetroColors, Spacing } from '@/constants/theme';
import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';

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
  warning: MetroColors.accent.yellow,
  success: MetroColors.accent.green,
  muted: MetroColors.text.secondary,
};

// Increased sizes for better visibility
const sizeMap: Record<DataSize, number> = {
  sm: FontSizes.md,
  md: FontSizes.xl,
  lg: FontSizes['3xl'],
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
        <Text style={[styles.value, { color: variantColors[progressVariant], fontSize: FontSizes.xl, fontWeight: '800' }]}>
          {current}
        </Text>
        <Text style={[styles.separator, { color }]}>/</Text>
        <Text style={[styles.value, { color: MetroColors.text.secondary, fontSize: FontSizes.xl }]}>
          {total}
        </Text>
        <Text style={[styles.unit, { color: MetroColors.text.tertiary }]}>{unit}</Text>
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
    color: MetroColors.text.secondary,
    fontSize: FontSizes.sm,
    fontFamily: Fonts.sansBold,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  value: {
    fontFamily: Fonts.sansBold,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  affix: {
    fontFamily: Fonts.sansBold,
    fontWeight: '700',
    marginHorizontal: 2,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  separator: {
    fontFamily: Fonts.sansBold,
    fontSize: FontSizes.lg,
    fontWeight: '600',
    marginHorizontal: 2,
  },
  unit: {
    fontFamily: Fonts.sans,
    fontSize: FontSizes.sm,
    fontWeight: '600',
    marginLeft: Spacing[1],
    textTransform: 'lowercase',
  },
});

