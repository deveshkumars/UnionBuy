/**
 * PulseRadar - Animated pulse effect for location/scanning
 * Clean, friendly design for finding neighbors
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { MetroColors, FontSizes, Fonts, Spacing } from '@/constants/theme';

interface PulseRadarProps {
  size?: number;
  color?: string;
  pulseCount?: number;
  duration?: number;
  label?: string;
  showCenter?: boolean;
  children?: React.ReactNode;
}

export function PulseRadar({
  size = 200,
  color = MetroColors.accent.cyan,
  pulseCount = 3,
  duration = 3000,
  label,
  showCenter = true,
  children,
}: PulseRadarProps) {
  const pulseAnims = useRef(
    Array.from({ length: pulseCount }, () => new Animated.Value(0))
  ).current;

  useEffect(() => {
    const animations = pulseAnims.map((anim, index) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay((duration / pulseCount) * index),
          Animated.timing(anim, {
            toValue: 1,
            duration: duration,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      );
    });

    animations.forEach((anim) => anim.start());

    return () => animations.forEach((anim) => anim.stop());
  }, [pulseCount, duration]);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Pulse Rings */}
      {pulseAnims.map((anim, index) => {
        const scale = anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0.3, 1],
        });
        const opacity = anim.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0.6, 0.3, 0],
        });

        return (
          <Animated.View
            key={index}
            style={[
              styles.pulseRing,
              {
                width: size,
                height: size,
                borderRadius: size / 2,
                borderColor: color,
                transform: [{ scale }],
                opacity,
              },
            ]}
          />
        );
      })}

      {/* Static rings for depth */}
      {[0.3, 0.5, 0.7].map((scale, index) => (
        <View
          key={`static-${index}`}
          style={[
            styles.staticRing,
            {
              width: size * scale,
              height: size * scale,
              borderRadius: (size * scale) / 2,
              borderColor: color,
            },
          ]}
        />
      ))}

      {/* Center point */}
      {showCenter && (
        <View style={[styles.centerDot, { backgroundColor: color }]}>
          <View style={[styles.centerDotInner, { backgroundColor: color }]} />
        </View>
      )}

      {/* Custom children */}
      {children}

      {/* Label */}
      {label && (
        <View style={styles.labelContainer}>
          <Text style={[styles.label, { color }]}>{label}</Text>
        </View>
      )}
    </View>
  );
}

// Blip marker for radar display
interface RadarBlipProps {
  angle: number;
  distance: number;
  size?: number;
  color?: string;
  label?: string;
  pulse?: boolean;
}

export function RadarBlip({
  angle,
  distance,
  size: blipSize = 12,
  color = MetroColors.accent.orange,
  label,
  pulse = false,
}: RadarBlipProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (pulse) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.5,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
      return () => animation.stop();
    }
  }, [pulse]);

  const radians = ((angle - 90) * Math.PI) / 180;
  const maxRadius = 50;
  const x = Math.cos(radians) * distance * maxRadius;
  const y = Math.sin(radians) * distance * maxRadius;

  return (
    <Animated.View
      style={[
        styles.blip,
        {
          width: blipSize,
          height: blipSize,
          borderRadius: blipSize / 2,
          backgroundColor: color,
          transform: [
            { translateX: x },
            { translateY: y },
            { scale: pulse ? pulseAnim : 1 },
          ],
        },
      ]}
    >
      {label && (
        <Text style={[styles.blipLabel, { color }]} numberOfLines={1}>
          {label}
        </Text>
      )}
    </Animated.View>
  );
}

// Scanning animation overlay
interface ScanningOverlayProps {
  active?: boolean;
  color?: string;
}

export function ScanningOverlay({ active = true, color = MetroColors.accent.cyan }: ScanningOverlayProps) {
  const sweepAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (active) {
      const animation = Animated.loop(
        Animated.timing(sweepAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      animation.start();
      return () => animation.stop();
    }
  }, [active]);

  const rotate = sweepAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  if (!active) return null;

  return (
    <Animated.View
      style={[
        styles.sweepContainer,
        { transform: [{ rotate }] },
      ]}
    >
      <View style={[styles.sweepLine, { backgroundColor: color }]} />
    </Animated.View>
  );
}

// Mini location indicator
interface LocationIndicatorProps {
  size?: number;
  color?: string;
  active?: boolean;
}

export function LocationIndicator({
  size = 24,
  color = MetroColors.accent.cyan,
  active = true,
}: LocationIndicatorProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (active) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 2,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
      return () => animation.stop();
    }
  }, [active]);

  const opacity = pulseAnim.interpolate({
    inputRange: [1, 2],
    outputRange: [0.5, 0],
  });

  return (
    <View style={[styles.locationContainer, { width: size, height: size }]}>
      <Animated.View
        style={[
          styles.locationPulse,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderColor: color,
            transform: [{ scale: pulseAnim }],
            opacity,
          },
        ]}
      />
      <View
        style={[
          styles.locationDot,
          {
            width: size / 2,
            height: size / 2,
            borderRadius: size / 4,
            backgroundColor: color,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  pulseRing: {
    position: 'absolute',
    borderWidth: 2,
  },
  staticRing: {
    position: 'absolute',
    borderWidth: 1,
    opacity: 0.15,
  },
  centerDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.25,
  },
  centerDotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    opacity: 1,
  },
  labelContainer: {
    position: 'absolute',
    bottom: -30,
  },
  label: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.sm,
    fontWeight: '500',
  },
  blip: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  blipLabel: {
    position: 'absolute',
    top: '100%',
    marginTop: 4,
    fontFamily: Fonts.body,
    fontSize: 10,
    fontWeight: '500',
  },
  sweepContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  sweepLine: {
    width: '50%',
    height: 2,
    opacity: 0.4,
    marginLeft: '50%',
  },
  locationContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationPulse: {
    position: 'absolute',
    borderWidth: 2,
  },
  locationDot: {
    position: 'absolute',
  },
});
