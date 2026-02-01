/**
 * ScanOverlay - Camera viewfinder with rounded corners
 * Clean, friendly design for QR scanning
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { MetroColors, FontSizes, Fonts, Spacing, BorderRadius } from '@/constants/theme';

interface ScanOverlayProps {
  size?: number;
  color?: string;
  label?: string;
  scanning?: boolean;
  success?: boolean;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function ScanOverlay({
  size = SCREEN_WIDTH * 0.7,
  color = MetroColors.accent.cyan,
  label = 'Align QR Code',
  scanning = true,
  success = false,
}: ScanOverlayProps) {
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const displayColor = success ? MetroColors.accent.green : color;

  useEffect(() => {
    if (scanning && !success) {
      const scanAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(scanLineAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(scanLineAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      );
      scanAnimation.start();

      return () => scanAnimation.stop();
    }
  }, [scanning, success]);

  useEffect(() => {
    if (success) {
      const pulseAnimation = Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]);
      pulseAnimation.start();
    }
  }, [success]);

  const scanLineTranslate = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, size - 4],
  });

  return (
    <View style={styles.container}>
      {/* Dark overlay with cutout */}
      <View style={styles.overlay}>
        <View style={[styles.overlaySection, styles.overlayTop]} />
        <View style={styles.middleRow}>
          <View style={[styles.overlaySection, styles.overlaySide]} />
          <Animated.View
            style={[
              styles.scanArea,
              {
                width: size,
                height: size,
                borderRadius: BorderRadius.xl,
                borderColor: displayColor,
                transform: [{ scale: pulseAnim }],
              },
            ]}
          >
            {/* Scan Line */}
            {scanning && !success && (
              <Animated.View
                style={[
                  styles.scanLine,
                  {
                    backgroundColor: displayColor,
                    transform: [{ translateY: scanLineTranslate }],
                  },
                ]}
              />
            )}

            {/* Success Checkmark */}
            {success && (
              <View style={styles.successContainer}>
                <Text style={[styles.successIcon, { color: displayColor }]}>✓</Text>
              </View>
            )}
          </Animated.View>
          <View style={[styles.overlaySection, styles.overlaySide]} />
        </View>
        <View style={[styles.overlaySection, styles.overlayBottom]} />
      </View>

      {/* Label */}
      <View style={styles.labelContainer}>
        <Text style={[styles.label, { color: displayColor }]}>
          {success ? 'Scan Complete' : label}
        </Text>
      </View>
    </View>
  );
}

// Targeting reticle variant for map/location
interface TargetReticleProps {
  size?: number;
  color?: string;
  animated?: boolean;
}

export function TargetReticle({
  size = 60,
  color = MetroColors.accent.cyan,
  animated = true,
}: TargetReticleProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (animated) {
      const scaleAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );

      scaleAnimation.start();

      return () => {
        scaleAnimation.stop();
      };
    }
  }, [animated]);

  return (
    <Animated.View
      style={[
        styles.reticleContainer,
        {
          width: size,
          height: size,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      {/* Outer ring */}
      <View
        style={[
          styles.reticleRing,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderColor: color,
          },
        ]}
      />
      
      {/* Inner ring */}
      <View
        style={[
          styles.reticleRing,
          {
            width: size * 0.6,
            height: size * 0.6,
            borderRadius: (size * 0.6) / 2,
            borderColor: color,
            opacity: 0.4,
          },
        ]}
      />
      
      {/* Center dot */}
      <View style={[styles.reticleDot, { backgroundColor: color }]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  overlaySection: {
    backgroundColor: 'rgba(26, 26, 25, 0.8)',
  },
  overlayTop: {
    flex: 1,
  },
  overlayBottom: {
    flex: 1,
  },
  middleRow: {
    flexDirection: 'row',
  },
  overlaySide: {
    flex: 1,
  },
  scanArea: {
    position: 'relative',
    backgroundColor: 'transparent',
    borderWidth: 3,
    overflow: 'hidden',
  },
  scanLine: {
    position: 'absolute',
    left: 16,
    right: 16,
    height: 2,
    opacity: 0.7,
    borderRadius: 1,
  },
  successContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successIcon: {
    fontSize: 56,
    fontWeight: 'bold',
  },
  labelContainer: {
    position: 'absolute',
    bottom: '25%',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  label: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.md,
    fontWeight: '600',
    backgroundColor: MetroColors.background.secondary,
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[2],
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  reticleContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  reticleRing: {
    position: 'absolute',
    borderWidth: 2,
  },
  reticleDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
