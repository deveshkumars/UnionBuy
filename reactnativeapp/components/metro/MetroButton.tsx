/**
 * MetroButton - Sharp-edged cyberpunk buttons with glow states
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import { MetroColors, BorderRadius, Spacing, FontSizes, Fonts, Shadows } from '@/constants/theme';

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
    text: MetroColors.background.primary,
  },
  secondary: {
    bg: 'transparent',
    border: MetroColors.accent.cyan,
    text: MetroColors.accent.cyan,
  },
  warning: {
    bg: MetroColors.accent.orange,
    border: MetroColors.accent.orange,
    text: MetroColors.background.primary,
  },
  danger: {
    bg: MetroColors.accent.red,
    border: MetroColors.accent.red,
    text: MetroColors.text.primary,
  },
  ghost: {
    bg: 'transparent',
    border: MetroColors.border.default,
    text: MetroColors.text.secondary,
  },
};

const sizeStyles: Record<ButtonSize, { height: number; paddingHorizontal: number; fontSize: number }> = {
  sm: { height: 32, paddingHorizontal: Spacing[3], fontSize: FontSizes.xs },
  md: { height: 44, paddingHorizontal: Spacing[4], fontSize: FontSizes.sm },
  lg: { height: 56, paddingHorizontal: Spacing[6], fontSize: FontSizes.base },
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
      activeOpacity={0.7}
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
        variant === 'primary' && !disabled && Shadows.cyanGlow,
        variant === 'warning' && !disabled && Shadows.orangeGlow,
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
    borderRadius: BorderRadius.lg,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.4,
  },
  text: {
    fontFamily: Fonts.mono,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  textWithIcon: {
    marginLeft: Spacing[2],
  },
});
