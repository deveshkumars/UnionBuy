/**
 * Union Buy Theme System
 * A warm, community-focused aesthetic inspired by Airbnb & Duolingo
 */

import { Platform } from 'react-native';

// ============================================
// COLOR PALETTE
// ============================================

export const MetroColors = {
  // Base backgrounds (warm, inviting)
  background: {
    primary: '#FAFAF8',      // Warm white - page background
    secondary: '#FFFFFF',    // Pure white - cards / panels
    tertiary: '#F5F5F3',     // Warm gray - sub-panels / chips
    elevated: '#FFFFFF',     // Modals / overlays
  },

  // Accent colors (warm, approachable palette)
  accent: {
    cyan: '#E05A47',         // Warm Coral - primary actions (renamed for compatibility)
    cyanMuted: 'rgba(224, 90, 71, 0.12)',
    cyanDark: '#C74A3A',
    orange: '#E8A54B',       // Warm Amber - warnings / cutoff
    orangeMuted: 'rgba(232, 165, 75, 0.15)',
    green: '#6B9080',        // Sage Green - success
    greenMuted: 'rgba(107, 144, 128, 0.15)',
    red: '#D94F4F',          // Soft Red - errors
    redMuted: 'rgba(217, 79, 79, 0.12)',
    purple: '#8B7EC8',       // Soft Lavender - special highlights
    purpleMuted: 'rgba(139, 126, 200, 0.12)',
    yellow: '#E8A54B',       // Warm Amber - hot deals
    yellowMuted: 'rgba(232, 165, 75, 0.15)',
    pink: '#E07A9A',         // Soft Rose - special offers
    pinkMuted: 'rgba(224, 122, 154, 0.12)',
    indigo: '#6B7EC8',       // Soft Periwinkle - premium
    indigoMuted: 'rgba(107, 126, 200, 0.12)',
  },

  // Text colors - warm and readable
  text: {
    primary: '#1A1A19',      // Near black - headlines
    secondary: '#4A4A48',    // Warm dark gray - body text
    tertiary: '#6B6B6A',     // Medium warm gray - labels
    muted: '#9B9B9A',        // Light warm gray - placeholders
    inverse: '#FFFFFF',      // On colored surfaces
  },

  // Border colors - subtle and warm
  border: {
    default: '#EBEBEA',      // Light warm gray - default borders
    muted: '#F5F5F3',        // Very light - subtle dividers
    accent: '#E05A47',       // Coral - highlighted borders
    warning: '#E8A54B',      // Amber - warning state borders
  },

  // Status colors (semantic, warm)
  status: {
    pending: '#E8A54B',      // Amber
    active: '#E05A47',       // Coral
    confirmed: '#6B9080',    // Sage
    cancelled: '#D94F4F',    // Soft red
    locked: '#8B7EC8',       // Lavender
  },

  // Soft overlays (replacing glassmorphism)
  glass: {
    background: 'rgba(255, 255, 255, 0.95)',
    border: 'rgba(235, 235, 234, 0.8)',
    highlight: 'rgba(224, 90, 71, 0.08)',
  },
} as const;

// Legacy Colors export for compatibility
export const Colors = {
  light: {
    text: MetroColors.text.primary,
    background: MetroColors.background.primary,
    tint: MetroColors.accent.cyan,
    icon: MetroColors.text.tertiary,
    tabIconDefault: MetroColors.text.muted,
    tabIconSelected: MetroColors.accent.cyan,
  },
  dark: {
    text: MetroColors.text.primary,
    background: MetroColors.background.primary,
    tint: MetroColors.accent.cyan,
    icon: MetroColors.text.tertiary,
    tabIconDefault: MetroColors.text.muted,
    tabIconSelected: MetroColors.accent.cyan,
  },
};

// ============================================
// TYPOGRAPHY
// ============================================

export const Fonts = Platform.select({
  ios: {
    sans: 'System',              // Clean system font
    sansBold: 'System',          // Bold variant
    body: 'System',              // Body text
    heading: 'System',           // Headings with weight
    rounded: 'System',           // Rounded variant
    mono: 'System',              // Use system for cleaner look
  },
  android: {
    sans: 'Roboto',
    sansBold: 'Roboto',
    body: 'Roboto',
    heading: 'Roboto',
    rounded: 'Roboto',
    mono: 'Roboto',
  },
  default: {
    sans: 'System',
    sansBold: 'System',
    body: 'System',
    heading: 'System',
    rounded: 'System',
    mono: 'System',
  },
  web: {
    sans: "'Plus Jakarta Sans', -apple-system, system-ui, sans-serif",
    sansBold: "'Plus Jakarta Sans', -apple-system, system-ui, sans-serif",
    body: "'Plus Jakarta Sans', -apple-system, system-ui, sans-serif",
    heading: "'Plus Jakarta Sans', -apple-system, system-ui, sans-serif",
    rounded: "'Plus Jakarta Sans', -apple-system, system-ui, sans-serif",
    mono: "'Plus Jakarta Sans', -apple-system, system-ui, sans-serif",
  },
});

export const FontSizes = {
  xs: 12,
  sm: 14,
  md: 16,
  base: 17,
  lg: 18,
  xl: 22,
  '2xl': 26,
  '3xl': 32,
  '4xl': 38,
  '5xl': 48,
} as const;

export const FontWeights = {
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

export const LineHeights = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.7,
} as const;

// ============================================
// SPACING (4px base unit)
// ============================================

export const Spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
  24: 96,
} as const;

// ============================================
// BORDER RADIUS (friendlier, rounder shapes)
// ============================================

export const BorderRadius = {
  none: 0,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 28,
  full: 9999,
} as const;

// ============================================
// SHADOWS (soft, warm shadows)
// ============================================

export const Shadows = {
  sm: {
    shadowColor: '#1A1A19',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#1A1A19',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#1A1A19',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  glow: (color: string) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  }),
  cyanGlow: {
    shadowColor: MetroColors.accent.cyan,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  orangeGlow: {
    shadowColor: MetroColors.accent.orange,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
} as const;

// ============================================
// ANIMATION DURATIONS
// ============================================

export const Durations = {
  fast: 150,
  normal: 250,
  slow: 400,
  pulse: 2000,
  scan: 1500,
} as const;

// ============================================
// Z-INDEX LAYERS
// ============================================

export const ZIndex = {
  base: 0,
  card: 10,
  header: 100,
  overlay: 500,
  modal: 1000,
  toast: 1500,
} as const;

// ============================================
// COMPONENT STYLES
// ============================================

export const MetroStyles = {
  // Card style with soft shadow
  boundingBox: {
    backgroundColor: MetroColors.background.secondary,
    borderRadius: BorderRadius.lg,
    ...Shadows.sm,
  },
  
  // Highlighted card
  boundingBoxActive: {
    backgroundColor: MetroColors.background.secondary,
    borderWidth: 2,
    borderColor: MetroColors.accent.cyan,
    borderRadius: BorderRadius.lg,
  },
  
  // Elevated panel
  glassPanel: {
    backgroundColor: MetroColors.glass.background,
    borderRadius: BorderRadius.lg,
    ...Shadows.md,
  },
  
  // Header text style (no uppercase)
  headerText: {
    color: MetroColors.text.primary,
    fontSize: FontSizes['2xl'],
    fontWeight: FontWeights.bold,
    fontFamily: Fonts.heading,
    letterSpacing: -0.5,
  },
  
  // Data text style (cleaner, not monospace)
  dataText: {
    color: MetroColors.accent.cyan,
    fontSize: FontSizes.md,
    fontFamily: Fonts.body,
    fontWeight: FontWeights.semibold,
  },
  
  // Label text style (subtle, not uppercase)
  labelText: {
    color: MetroColors.text.tertiary,
    fontSize: FontSizes.sm,
    fontFamily: Fonts.body,
    fontWeight: FontWeights.medium,
  },
  
  // Corner accent decoration (removed - keeping for API compatibility)
  cornerAccent: {
    position: 'absolute' as const,
    width: 0,
    height: 0,
    borderColor: 'transparent',
  },
} as const;

// ============================================
// TAB BAR CONFIGURATION
// ============================================

export const TabBarConfig = {
  style: {
    backgroundColor: MetroColors.background.secondary,
    borderTopWidth: 1,
    borderTopColor: MetroColors.border.default,
    height: 88,
    paddingBottom: 24,
    paddingTop: 8,
  },
  activeTintColor: MetroColors.accent.cyan,
  inactiveTintColor: MetroColors.text.muted,
  labelStyle: {
    fontFamily: Fonts.body,
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.medium,
  },
} as const;

// ============================================
// SCREEN DEFAULTS
// ============================================

export const ScreenDefaults = {
  container: {
    flex: 1,
    backgroundColor: MetroColors.background.primary,
  },
  padding: Spacing[4],
  headerHeight: 100,
} as const;
