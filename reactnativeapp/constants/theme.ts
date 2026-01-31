/**
 * Metropolis Theme System
 * A cyberpunk command-center aesthetic for the bulk buy delivery app
 */

import { Platform } from 'react-native';

// ============================================
// COLOR PALETTE
// ============================================

export const MetroColors = {
  // Base backgrounds
  background: {
    primary: '#0A0E14',      // Deep slate - main background
    secondary: '#0D1117',    // Slightly lighter for cards
    tertiary: '#161B22',     // Elevated surfaces
    elevated: '#1C2128',     // Modal/overlay backgrounds
  },
  
  // Accent colors
  accent: {
    cyan: '#00D9FF',         // Electric cyan - confirmed/safe/primary actions
    cyanMuted: '#00D9FF40',  // Cyan with transparency for glows
    cyanDark: '#0891B2',     // Darker cyan for hover states
    orange: '#FF6B35',       // Warning/pending/traffic
    orangeMuted: '#FF6B3540',
    green: '#00FF88',        // Success/completed
    greenMuted: '#00FF8840',
    red: '#FF3366',          // Error/danger/destructive
    redMuted: '#FF336640',
    purple: '#A855F7',       // Special/premium features
    purpleMuted: '#A855F740',
  },
  
  // Text colors
  text: {
    primary: '#FFFFFF',      // Headers, important text
    secondary: '#E6EDF3',    // Body text
    tertiary: '#8B949E',     // Labels, captions
    muted: '#484F58',        // Disabled, placeholder
    inverse: '#0A0E14',      // Text on light backgrounds
  },
  
  // Border colors
  border: {
    default: '#30363D',      // Default borders
    muted: '#21262D',        // Subtle borders
    accent: '#00D9FF',       // Highlighted borders
    warning: '#FF6B35',      // Warning state borders
  },
  
  // Status colors (semantic)
  status: {
    pending: '#FF6B35',
    active: '#00D9FF',
    confirmed: '#00FF88',
    cancelled: '#FF3366',
    locked: '#A855F7',
  },
  
  // Glassmorphism
  glass: {
    background: 'rgba(13, 17, 23, 0.8)',
    border: 'rgba(48, 54, 61, 0.5)',
    highlight: 'rgba(0, 217, 255, 0.1)',
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
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  android: {
    sans: 'Roboto',
    serif: 'serif',
    rounded: 'Roboto',
    mono: 'monospace',
  },
  default: {
    sans: 'System',
    serif: 'serif',
    rounded: 'System',
    mono: 'monospace',
  },
  web: {
    sans: "'Rajdhani', 'Exo 2', system-ui, -apple-system, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', system-ui, sans-serif",
    mono: "'JetBrains Mono', 'Fira Code', 'SF Mono', Consolas, monospace",
  },
});

export const FontSizes = {
  xs: 10,
  sm: 12,
  md: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
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
  tight: 1.1,
  normal: 1.4,
  relaxed: 1.6,
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
// BORDER RADIUS
// ============================================

export const BorderRadius = {
  none: 0,
  sm: 2,
  md: 4,
  lg: 6,
  xl: 8,
  full: 9999,
} as const;

// ============================================
// SHADOWS & GLOWS
// ============================================

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  glow: (color: string) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 12,
  }),
  cyanGlow: {
    shadowColor: MetroColors.accent.cyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  orangeGlow: {
    shadowColor: MetroColors.accent.orange,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
} as const;

// ============================================
// ANIMATION DURATIONS
// ============================================

export const Durations = {
  fast: 150,
  normal: 300,
  slow: 500,
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
  // Bounding box card style
  boundingBox: {
    backgroundColor: MetroColors.background.secondary,
    borderWidth: 1,
    borderColor: MetroColors.border.default,
    borderRadius: BorderRadius.sm,
  },
  
  // Highlighted bounding box
  boundingBoxActive: {
    backgroundColor: MetroColors.background.secondary,
    borderWidth: 1,
    borderColor: MetroColors.accent.cyan,
    borderRadius: BorderRadius.sm,
  },
  
  // Glass panel
  glassPanel: {
    backgroundColor: MetroColors.glass.background,
    borderWidth: 1,
    borderColor: MetroColors.glass.border,
    borderRadius: BorderRadius.md,
  },
  
  // Header text style
  headerText: {
    color: MetroColors.text.primary,
    fontSize: FontSizes['2xl'],
    fontWeight: FontWeights.bold,
    fontFamily: Fonts.sans,
    letterSpacing: 1,
    textTransform: 'uppercase' as const,
  },
  
  // Data/monospace text style
  dataText: {
    color: MetroColors.accent.cyan,
    fontSize: FontSizes.md,
    fontFamily: Fonts.mono,
    letterSpacing: 0.5,
  },
  
  // Label text style
  labelText: {
    color: MetroColors.text.tertiary,
    fontSize: FontSizes.xs,
    fontFamily: Fonts.mono,
    letterSpacing: 1,
    textTransform: 'uppercase' as const,
  },
  
  // Corner accent decoration
  cornerAccent: {
    position: 'absolute' as const,
    width: 12,
    height: 12,
    borderColor: MetroColors.accent.cyan,
  },
} as const;

// ============================================
// TAB BAR CONFIGURATION
// ============================================

export const TabBarConfig = {
  style: {
    backgroundColor: MetroColors.background.primary,
    borderTopWidth: 1,
    borderTopColor: MetroColors.border.muted,
    height: 80,
    paddingBottom: 20,
    paddingTop: 10,
  },
  activeTintColor: MetroColors.accent.cyan,
  inactiveTintColor: MetroColors.text.muted,
  labelStyle: {
    fontFamily: Fonts.mono,
    fontSize: FontSizes.xs,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
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
