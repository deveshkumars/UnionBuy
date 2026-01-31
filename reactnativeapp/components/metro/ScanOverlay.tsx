/**
 * ScanOverlay - Camera viewfinder with corner brackets
 * Used for QR scanning and visual verification
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { MetroColors, FontSizes, Fonts, Spacing } from '@/constants/theme';

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
  label = 'ALIGN QR CODE',
  scanning = true,
  success = false,
}: ScanOverlayProps) {
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const displayColor = success ? MetroColors.accent.green : color;

  useEffect(() => {
    if (scanning && !success) {
      // Scan line animation
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
      // Success pulse animation
      const pulseAnimation = Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
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
                transform: [{ scale: pulseAnim }],
              },
            ]}
          >
            {/* Corner Brackets */}
            <CornerBracket position="topLeft" color={displayColor} />
            <CornerBracket position="topRight" color={displayColor} />
            <CornerBracket position="bottomLeft" color={displayColor} />
            <CornerBracket position="bottomRight" color={displayColor} />

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
          {success ? 'SCAN COMPLETE' : label}
        </Text>
      </View>
    </View>
  );
}

// Corner bracket component
interface CornerBracketProps {
  position: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';
  color: string;
  size?: number;
  thickness?: number;
}

function CornerBracket({
  position,
  color,
  size = 30,
  thickness = 3,
}: CornerBracketProps) {
  const positionStyles = {
    topLeft: { top: 0, left: 0, borderTopWidth: thickness, borderLeftWidth: thickness },
    topRight: { top: 0, right: 0, borderTopWidth: thickness, borderRightWidth: thickness },
    bottomLeft: { bottom: 0, left: 0, borderBottomWidth: thickness, borderLeftWidth: thickness },
    bottomRight: { bottom: 0, right: 0, borderBottomWidth: thickness, borderRightWidth: thickness },
  };

  return (
    <View
      style={[
        styles.cornerBracket,
        { width: size, height: size, borderColor: color },
        positionStyles[position],
      ]}
    />
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
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (animated) {
      // Slow rotation
      const rotateAnimation = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 8000,
          useNativeDriver: true,
        })
      );

      // Pulse scale
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

      rotateAnimation.start();
      scaleAnimation.start();

      return () => {
        rotateAnimation.stop();
        scaleAnimation.stop();
      };
    }
  }, [animated]);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      style={[
        styles.reticleContainer,
        {
          width: size,
          height: size,
          transform: [{ rotate }, { scale: scaleAnim }],
        },
      ]}
    >
      {/* Cross hairs */}
      <View style={[styles.crosshairH, { backgroundColor: color }]} />
      <View style={[styles.crosshairV, { backgroundColor: color }]} />
      
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
            opacity: 0.5,
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
    backgroundColor: 'rgba(10, 14, 20, 0.85)',
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
  },
  cornerBracket: {
    position: 'absolute',
    borderColor: MetroColors.accent.cyan,
  },
  scanLine: {
    position: 'absolute',
    left: 10,
    right: 10,
    height: 2,
    opacity: 0.8,
  },
  successContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successIcon: {
    fontSize: 60,
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
    fontFamily: Fonts.mono,
    fontSize: FontSizes.sm,
    fontWeight: '600',
    letterSpacing: 2,
    textTransform: 'uppercase',
    backgroundColor: MetroColors.background.primary,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
  },
  reticleContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  crosshairH: {
    position: 'absolute',
    width: '100%',
    height: 1,
    opacity: 0.6,
  },
  crosshairV: {
    position: 'absolute',
    width: 1,
    height: '100%',
    opacity: 0.6,
  },
  reticleRing: {
    position: 'absolute',
    borderWidth: 1,
  },
  reticleDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});

