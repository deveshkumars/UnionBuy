/**
 * ProgressRing - Circular progress indicator for pledge completion
 * Features animated fill and glow effects
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { MetroColors, FontSizes, Fonts, Spacing } from '@/constants/theme';

interface ProgressRingProps {
  progress: number; // 0 to 1
  size?: number;
  strokeWidth?: number;
  showPercentage?: boolean;
  label?: string;
  variant?: 'default' | 'success' | 'warning';
}

export function ProgressRing({
  progress,
  size = 80,
  strokeWidth = 6,
  showPercentage = true,
  label,
  variant = 'default',
}: ProgressRingProps) {
  const animatedProgress = useSharedValue(0);
  
  useEffect(() => {
    animatedProgress.value = withTiming(progress, {
      duration: 800,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
  }, [progress]);

  const getColor = () => {
    if (variant === 'success' || progress >= 1) return MetroColors.accent.green;
    if (variant === 'warning' || progress < 0.3) return MetroColors.accent.orange;
    return MetroColors.accent.cyan;
  };

  const color = getColor();
  const percentage = Math.round(progress * 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const animatedStyle = useAnimatedStyle(() => {
    const strokeDashoffset = circumference * (1 - animatedProgress.value);
    return {
      strokeDashoffset,
    };
  });

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Background Ring */}
      <View style={styles.svgContainer}>
        <View
          style={[
            styles.ring,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: strokeWidth,
              borderColor: MetroColors.border.muted,
            },
          ]}
        />
        {/* Progress Arc - Using a simplified view-based approach */}
        <View
          style={[
            styles.progressContainer,
            {
              width: size,
              height: size,
            },
          ]}
        >
          <Animated.View
            style={[
              styles.progressArc,
              {
                width: size - strokeWidth * 2,
                height: size - strokeWidth * 2,
                borderRadius: (size - strokeWidth * 2) / 2,
                borderWidth: strokeWidth,
                borderColor: color,
                borderTopColor: progress > 0.25 ? color : 'transparent',
                borderRightColor: progress > 0.5 ? color : 'transparent',
                borderBottomColor: progress > 0.75 ? color : 'transparent',
                borderLeftColor: progress > 0 ? color : 'transparent',
                transform: [{ rotate: '-90deg' }],
              },
            ]}
          />
        </View>
      </View>

      {/* Center Content */}
      <View style={styles.centerContent}>
        {showPercentage && (
          <Text style={[styles.percentage, { color }]}>{percentage}%</Text>
        )}
        {label && <Text style={styles.label}>{label}</Text>}
      </View>

      {/* Glow Effect */}
      {progress >= 1 && (
        <View
          style={[
            styles.glowRing,
            {
              width: size + 10,
              height: size + 10,
              borderRadius: (size + 10) / 2,
              borderColor: color,
              shadowColor: color,
            },
          ]}
        />
      )}
    </View>
  );
}

// Smaller inline progress bar variant
interface ProgressBarProps {
  progress: number;
  height?: number;
  showLabel?: boolean;
  variant?: 'default' | 'success' | 'warning';
}

export function ProgressBar({
  progress,
  height = 10,
  showLabel = false,
  variant = 'default',
}: ProgressBarProps) {
  const getColor = () => {
    if (variant === 'success' || progress >= 1) return MetroColors.accent.green;
    if (variant === 'warning' || progress < 0.3) return MetroColors.accent.orange;
    return MetroColors.accent.cyan;
  };

  const color = getColor();
  const percentage = Math.round(progress * 100);

  return (
    <View style={styles.barContainer}>
      <View style={[styles.barBackground, { height }]}>
        <Animated.View
          style={[
            styles.barFill,
            {
              width: `${Math.min(progress * 100, 100)}%`,
              backgroundColor: color,
              height,
            },
          ]}
        />
      </View>
      {showLabel && (
        <Text style={[styles.barLabel, { color }]}>{percentage}%</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  svgContainer: {
    position: 'absolute',
  },
  ring: {
    position: 'absolute',
  },
  progressContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressArc: {
    position: 'absolute',
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentage: {
    fontFamily: Fonts.mono,
    fontSize: FontSizes.lg,
    fontWeight: '700',
  },
  label: {
    color: MetroColors.text.tertiary,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.xs,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  glowRing: {
    position: 'absolute',
    borderWidth: 2,
    opacity: 0.3,
    shadowOpacity: 0.8,
    shadowRadius: 15,
  },
  barContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  barBackground: {
    flex: 1,
    backgroundColor: MetroColors.border.muted,
    borderRadius: 6,
    overflow: 'hidden',
  },
  barFill: {
    borderRadius: 6,
  },
  barLabel: {
    fontFamily: Fonts.mono,
    fontSize: FontSizes.sm,
    fontWeight: '600',
    minWidth: 36,
    textAlign: 'right',
  },
});
