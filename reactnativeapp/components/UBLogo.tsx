/**
 * UB Logo Component
 * Clean, professional Union Buy logo for headers
 */

import { MetroColors, FontSizes } from '@/constants/theme';
import React from 'react';
import { Image, ImageSourcePropType, StyleSheet, Text, View } from 'react-native';

interface UBLogoProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'navy' | 'white';
  source?: ImageSourcePropType;
}

const sizeConfig = {
  sm: { fontSize: 18, containerSize: 36 },
  md: { fontSize: 22, containerSize: 44 },
  lg: { fontSize: 28, containerSize: 56 },
};

export function UBLogo({ size = 'md', variant = 'navy', source }: UBLogoProps) {
  const config = sizeConfig[size];
  const isNavy = variant === 'navy';

  // If image source is provided, render image instead of text
  if (source) {
    return (
      <View
        style={[
          styles.imageContainer,
          {
            width: config.containerSize,
            height: config.containerSize,
          },
        ]}
      >
        <Image
          source={source}
          style={[
            styles.image,
            {
              width: config.containerSize,
              height: config.containerSize,
            },
          ]}
          resizeMode="contain"
        />
      </View>
    );
  }

  // Fallback to text logo
  return (
    <View
      style={[
        styles.container,
        {
          width: config.containerSize,
          height: config.containerSize,
          backgroundColor: isNavy ? MetroColors.accent.cyan : MetroColors.background.secondary,
        },
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            fontSize: config.fontSize,
            color: isNavy ? MetroColors.text.inverse : MetroColors.accent.cyan,
          },
        ]}
      >
        UB
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  imageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    borderRadius: 8,
  },
  text: {
    fontWeight: '800',
    letterSpacing: -0.5,
  },
});
