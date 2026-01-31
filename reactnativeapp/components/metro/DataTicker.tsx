/**
 * DataTicker - Horizontal scrolling ticker for trending items
 * Stock market / trading floor aesthetic
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated } from 'react-native';
import { MetroColors, FontSizes, Fonts, Spacing } from '@/constants/theme';

interface TickerItem {
  id: string;
  name: string;
  value: string | number;
  change?: number; // percentage change, positive or negative
  suffix?: string;
}

interface DataTickerProps {
  items: TickerItem[];
  speed?: number; // pixels per second
  height?: number;
  showChange?: boolean;
}

export function DataTicker({
  items,
  speed = 32,
  height = 44,
  showChange = false,
}: DataTickerProps) {
  const scrollX = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);

  // Double the items for seamless loop
  const tickerItems = [...items, ...items];

  useEffect(() => {
    // Auto-scroll animation
    const totalWidth = items.length * 180; // approximate width per item
    
    const animation = Animated.loop(
      Animated.timing(scrollX, {
        toValue: -totalWidth,
        duration: (totalWidth / speed) * 1000,
        useNativeDriver: true,
      })
    );

    animation.start();

    return () => animation.stop();
  }, [items, speed]);

  return (
    <View style={[styles.container, { height }]}>
      <Animated.View
        style={[
          styles.tickerTrack,
          {
            transform: [{ translateX: scrollX }],
          },
        ]}
      >
        {tickerItems.map((item, index) => (
          <TickerItemView key={`${item.id}-${index}`} item={item} showChange={showChange} />
        ))}
      </Animated.View>

      {/* Edge fades */}
      <View style={[styles.edgeFade, styles.leftFade]} />
      <View style={[styles.edgeFade, styles.rightFade]} />
    </View>
  );
}

function TickerItemView({ item, showChange }: { item: TickerItem; showChange: boolean }) {
  const changeColor = !showChange
    ? undefined
    : item.change
      ? item.change > 0
        ? MetroColors.accent.green
        : item.change < 0
        ? MetroColors.accent.red
        : MetroColors.text.tertiary
      : undefined;

  return (
    <View style={styles.tickerItem}>
      <Text style={styles.itemName} numberOfLines={1}>
        {item.name}
      </Text>
      <Text style={styles.itemValue}>
        {item.value}
        {item.suffix}
      </Text>
      {showChange && item.change !== undefined && (
        <Text style={[styles.itemChange, { color: changeColor }]}>
          {item.change > 0 ? '+' : ''}
          {item.change.toFixed(1)}%
        </Text>
      )}
      <View style={styles.separator} />
    </View>
  );
}

// Static info bar variant (non-scrolling)
interface InfoBarProps {
  items: { label: string; value: string | number; highlight?: boolean }[];
}

export function InfoBar({ items }: InfoBarProps) {
  return (
    <View style={styles.infoBar}>
      {items.map((item, index) => (
        <View key={index} style={styles.infoItem}>
          <Text style={styles.infoLabel}>{item.label}</Text>
          <Text
            style={[
              styles.infoValue,
              item.highlight && { color: MetroColors.accent.cyan },
            ]}
          >
            {item.value}
          </Text>
        </View>
      ))}
    </View>
  );
}

// Mini ticker for single values with blinking update
interface LiveValueProps {
  label: string;
  value: string | number;
  prefix?: string;
  suffix?: string;
  blinking?: boolean;
}

export function LiveValue({ label, value, prefix, suffix, blinking = false }: LiveValueProps) {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (blinking) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 0.3,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
      return () => animation.stop();
    }
  }, [blinking]);

  return (
    <View style={styles.liveValueContainer}>
      <Text style={styles.liveLabel}>{label}</Text>
      <Animated.Text style={[styles.liveValue, { opacity }]}>
        {prefix}
        {value}
        {suffix}
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: MetroColors.background.secondary,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: MetroColors.border.muted,
    overflow: 'hidden',
  },
  tickerTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
  },
  tickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[4],
    height: '100%',
  },
  itemName: {
    color: MetroColors.text.tertiary,
    fontFamily: Fonts.sans,
    fontSize: FontSizes.sm,
    fontWeight: '600',
    marginRight: Spacing[2],
    maxWidth: 140,
  },
  itemValue: {
    color: MetroColors.accent.cyan,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.md,
    fontWeight: '700',
  },
  itemChange: {
    fontFamily: Fonts.mono,
    fontSize: FontSizes.xs,
    marginLeft: Spacing[2],
  },
  separator: {
    width: 1,
    height: 18,
    backgroundColor: MetroColors.border.muted,
    marginLeft: Spacing[4],
  },
  edgeFade: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 40,
    zIndex: 1,
  },
  leftFade: {
    left: 0,
    backgroundColor: MetroColors.background.secondary,
    opacity: 0.8,
  },
  rightFade: {
    right: 0,
    backgroundColor: MetroColors.background.secondary,
    opacity: 0.8,
  },
  infoBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: MetroColors.background.secondary,
    paddingVertical: Spacing[3],
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: MetroColors.border.muted,
  },
  infoItem: {
    alignItems: 'center',
    gap: 2,
  },
  infoLabel: {
    color: MetroColors.text.muted,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.xs,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  infoValue: {
    color: MetroColors.text.primary,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.md,
    fontWeight: '600',
  },
  liveValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  liveLabel: {
    color: MetroColors.text.tertiary,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.xs,
    textTransform: 'uppercase',
  },
  liveValue: {
    color: MetroColors.accent.cyan,
    fontFamily: Fonts.mono,
    fontSize: FontSizes.md,
    fontWeight: '700',
  },
});
