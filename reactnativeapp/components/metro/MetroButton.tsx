/**
 * MetroButton - Friendly rounded buttons with warm colors
 * Clean, approachable design with subtle press states
 */

import { BorderRadius, FontSizes, Fonts, MetroColors, Shadows, Spacing } from '@/constants/theme';
import React from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TextStyle,
    TouchableOpacity,
    ViewStyle,
} from 'react-native';

type ButtonVariant = 'primary' | 'secondary' | 'warning' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface MetroButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const variantStyles: Record<ButtonVariant, { bg: string; border: string; text: string }> = {
  primary: {
    bg: MetroColors.accent.cyan,
    border: MetroColors.accent.cyan,
    text: MetroColors.text.inverse,
  },
  secondary: {
    bg: MetroColors.background.tertiary,
    border: MetroColors.border.default,
    text: MetroColors.text.primary,
  },
  warning: {
    bg: MetroColors.accent.orange,
    border: MetroColors.accent.orange,
    text: MetroColors.text.inverse,
  },
  danger: {
    bg: MetroColors.accent.red,
    border: MetroColors.accent.red,
    text: MetroColors.text.inverse,
  },
  ghost: {
    bg: 'transparent',
    border: 'transparent',
    text: MetroColors.text.secondary,
  },
};

const sizeStyles: Record<ButtonSize, { height: number; paddingHorizontal: number; fontSize: number }> = {
  sm: { height: 40, paddingHorizontal: Spacing[4], fontSize: FontSizes.sm },
  md: { height: 48, paddingHorizontal: Spacing[5], fontSize: FontSizes.md },
  lg: { height: 56, paddingHorizontal: Spacing[6], fontSize: FontSizes.lg },
};

export function MetroButton({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  icon,
  style,
  textStyle,
}: MetroButtonProps) {
  const colors = variantStyles[variant];
  const dimensions = sizeStyles[size];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        styles.button,
        {
          backgroundColor: colors.bg,
          borderColor: colors.border,
          height: dimensions.height,
          paddingHorizontal: dimensions.paddingHorizontal,
        },
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
        variant === 'primary' && !disabled && Shadows.sm,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.text} size="small" />
      ) : (
        <>
          {icon && <>{icon}</>}
          <Text
            style={[
              styles.text,
              {
                color: colors.text,
                fontSize: dimensions.fontSize,
              },
              icon && styles.textWithIcon,
              textStyle,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: BorderRadius.full, // Pill shape
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontFamily: Fonts.body,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  textWithIcon: {
    marginLeft: Spacing[2],
  },
});
