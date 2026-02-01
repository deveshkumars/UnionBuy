/**
 * MetroButton - Sharp-edged cyberpunk buttons with glow states
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
  sm: { height: 38, paddingHorizontal: Spacing[4], fontSize: FontSizes.sm },
  md: { height: 48, paddingHorizontal: Spacing[5], fontSize: FontSizes.md },
  lg: { height: 58, paddingHorizontal: Spacing[6], fontSize: FontSizes.lg },
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
    borderWidth: 2,
    borderRadius: BorderRadius.lg,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.4,
  },
  text: {
    fontFamily: Fonts.sans,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  textWithIcon: {
    marginLeft: Spacing[2],
  },
});
