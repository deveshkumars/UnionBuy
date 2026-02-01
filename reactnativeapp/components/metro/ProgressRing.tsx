/**
 * ProgressRing - Circular progress indicator
 * Clean, friendly design with warm colors
 */

import { BorderRadius, FontSizes, Fonts, MetroColors, Spacing } from '@/constants/theme';
import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';

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
  strokeWidth = 8,
  showPercentage = true,
  label,
  variant = 'default',
}: ProgressRingProps) {
  const animatedProgress = useSharedValue(0);
  
  useEffect(() => {
    animatedProgress.value = withTiming(progress, {
      duration: 600,
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
              borderColor: MetroColors.background.tertiary,
            },
          ]}
        />
        {/* Progress Arc */}
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
    </View>
  );
}

// Progress bar variant
interface ProgressBarProps {
  progress: number;
  height?: number;
  showLabel?: boolean;
  variant?: 'default' | 'success' | 'warning';
}

export function ProgressBar({
  progress,
  height = 12,
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
      <View style={[styles.barBackground, { height, borderRadius: height / 2 }]}>
        <Animated.View
          style={[
            styles.barFill,
            {
              width: `${Math.min(progress * 100, 100)}%`,
              backgroundColor: color,
              height,
              borderRadius: height / 2,
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
    fontFamily: Fonts.body,
    fontSize: FontSizes.lg,
    fontWeight: '700',
  },
  label: {
    color: MetroColors.text.tertiary,
    fontFamily: Fonts.body,
    fontSize: FontSizes.xs,
    marginTop: 2,
  },
  barContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
  },
  barBackground: {
    flex: 1,
    backgroundColor: MetroColors.background.tertiary,
    overflow: 'hidden',
  },
  barFill: {
    // Styles applied inline
  },
  barLabel: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.sm,
    fontWeight: '700',
    minWidth: 44,
    textAlign: 'right',
  },
});
