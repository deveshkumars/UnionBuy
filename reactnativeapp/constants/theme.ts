/**
 * Metropolis Theme System
 * A cyberpunk command-center aesthetic for the bulk buy delivery app
 */

import { Platform } from 'react-native';

// ============================================
// COLOR PALETTE
// ============================================

export const MetroColors = {
  // Base backgrounds (light, airy)
  background: {
    primary: '#F5F7FB',      // Page background
    secondary: '#FFFFFF',    // Cards / panels
    tertiary: '#EFF3FA',     // Sub-panels / chips
    elevated: '#E6EDF7',     // Modals / overlays
  },

  // Accent colors (soft neon on light)
  accent: {
    cyan: '#0FB6D9',         // Primary actions
    cyanMuted: 'rgba(15, 182, 217, 0.12)',
    cyanDark: '#0C9EC1',
    orange: '#FF9150',       // Warnings / cutoff
    orangeMuted: 'rgba(255, 145, 80, 0.16)',
    green: '#12B76A',        // Success
    greenMuted: 'rgba(18, 183, 106, 0.16)',
    red: '#F43F5E',          // Errors
    redMuted: 'rgba(244, 63, 94, 0.15)',
    purple: '#7C3AED',       // Special highlights
    purpleMuted: 'rgba(124, 58, 237, 0.12)',
  },

  // Text colors
  text: {
    primary: '#0F172A',      // Headlines
    secondary: '#1F2937',    // Body text
    tertiary: '#475569',     // Labels
    muted: '#94A3B8',        // Placeholders
    inverse: '#FFFFFF',      // On colored surfaces
  },

  // Border colors
  border: {
    default: '#D9E2EC',      // Default borders
    muted: '#E5EAF2',        // Subtle dividers
    accent: '#0FB6D9',       // Highlighted borders
    warning: '#FF9150',      // Warning state borders
  },

  // Status colors (semantic)
  status: {
    pending: '#FF9150',
    active: '#0FB6D9',
    confirmed: '#12B76A',
    cancelled: '#F43F5E',
    locked: '#7C3AED',
  },

  // Glassmorphism
  glass: {
    background: 'rgba(255, 255, 255, 0.86)',
    border: 'rgba(217, 226, 236, 0.8)',
    highlight: 'rgba(15, 182, 217, 0.12)',
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
  xs: 11,
  sm: 13,
  md: 15,
  base: 17,
  lg: 19,
  xl: 22,
  '2xl': 26,
  '3xl': 32,
  '4xl': 38,
  '5xl': 50,
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
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  full: 9999,
} as const;

// ============================================
// SHADOWS & GLOWS
// ============================================

export const Shadows = {
  sm: {
    shadowColor: 'rgba(15, 23, 42, 0.14)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.8,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: 'rgba(15, 23, 42, 0.16)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowColor: 'rgba(15, 23, 42, 0.18)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 12,
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
    backgroundColor: MetroColors.background.secondary,
    borderTopWidth: 1,
    borderTopColor: MetroColors.border.muted,
    height: 78,
    paddingBottom: 18,
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
