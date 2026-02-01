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
    primary: '#EEF4FF',      // Page background
    secondary: '#FFFFFF',    // Cards / panels
    tertiary: '#E6EEFF',     // Sub-panels / chips
    elevated: '#DDE7FF',     // Modals / overlays
  },

  // Accent colors (vibrant, modern palette)
  accent: {
    cyan: '#00D1FF',         // Primary actions
    cyanMuted: 'rgba(0, 209, 255, 0.16)',
    cyanDark: '#00A6D1',
    orange: '#FF7A18',       // Warnings / cutoff - neon orange
    orangeMuted: 'rgba(255, 122, 24, 0.2)',
    green: '#00E5A8',        // Success - neon mint
    greenMuted: 'rgba(0, 229, 168, 0.2)',
    red: '#FF4D6D',          // Errors - neon coral
    redMuted: 'rgba(255, 77, 109, 0.2)',
    purple: '#B14CFF',       // Special highlights - violet
    purpleMuted: 'rgba(177, 76, 255, 0.18)',
    yellow: '#FFD400',       // Hot deals - neon amber
    yellowMuted: 'rgba(255, 212, 0, 0.2)',
    pink: '#FF4FB0',         // Special offers - hot pink
    pinkMuted: 'rgba(255, 79, 176, 0.2)',
    indigo: '#5B7CFF',       // Premium - electric indigo
    indigoMuted: 'rgba(91, 124, 255, 0.18)',
  },

  // Text colors - improved contrast
  text: {
    primary: '#0B1220',      // Headlines - near black
    secondary: '#1E293B',    // Body text - deep slate
    tertiary: '#5B6B8C',     // Labels - medium slate
    muted: '#8A9BBF',        // Placeholders
    inverse: '#FFFFFF',      // On colored surfaces
  },

  // Border colors
  border: {
    default: '#C6D3EC',      // Default borders - slightly darker
    muted: '#DDE6F8',        // Subtle dividers
    accent: '#00D1FF',       // Highlighted borders
    warning: '#FF7A18',      // Warning state borders
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
    background: 'rgba(255, 255, 255, 0.88)',
    border: 'rgba(160, 176, 210, 0.55)',
    highlight: 'rgba(0, 209, 255, 0.12)',
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
    sans: 'system-ui',           // Clean, readable system font
    sansBold: 'system-ui',       // Bold variant
    body: '-apple-system',        // Body text
    heading: 'system-ui',         // Headings
    rounded: 'ui-rounded',        // Softer rounded variant
    mono: 'Menlo',               // Monospace for data
  },
  android: {
    sans: 'Roboto',
    sansBold: 'Roboto',
    body: 'Roboto',
    heading: 'Roboto Medium',
    rounded: 'Roboto',
    mono: 'monospace',
  },
  default: {
    sans: 'System',
    sansBold: 'System',
    body: 'System',
    heading: 'System',
    rounded: 'System',
    mono: 'monospace',
  },
  web: {
    sans: "'Inter', system-ui, -apple-system, sans-serif",
    sansBold: "'Inter', system-ui, -apple-system, sans-serif",
    body: "'Inter', system-ui, sans-serif",
    heading: "'Inter', -apple-system, sans-serif",
    rounded: "'SF Pro Rounded', system-ui, sans-serif",
    mono: "'SF Mono', Consolas, monospace",
  },
});

export const FontSizes = {
  xs: 12,     // Increased from 11 - minimum readable size
  sm: 14,     // Increased from 13 - body text
  md: 16,     // Increased from 15 - default body
  base: 17,   // Standard iOS size
  lg: 20,     // Increased from 19 - subheadings
  xl: 24,     // Increased from 22 - headings
  '2xl': 28,  // Increased from 26 - large headings
  '3xl': 34,  // Increased from 32 - hero text
  '4xl': 40,  // Increased from 38 - display
  '5xl': 52,  // Increased from 50 - extra large
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
    boxShadow: '0 1px 3px 0 rgba(15, 23, 42, 0.12)',
  },
  md: {
    boxShadow: '0 4px 6px -1px rgba(15, 23, 42, 0.14)',
  },
  lg: {
    boxShadow: '0 6px 12px -2px rgba(15, 23, 42, 0.16)',
  },
  glow: (color: string) => ({
    boxShadow: `0 0 14px ${color}`,
  }),
  cyanGlow: {
    boxShadow: `0 0 12px ${MetroColors.accent.cyan}`,
  },
  orangeGlow: {
    boxShadow: `0 0 12px ${MetroColors.accent.orange}`,
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
    borderTopWidth: 1.5,
    borderTopColor: MetroColors.border.accent,
    height: 80,
    paddingBottom: 16,
    paddingTop: 8,
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
