/**
 * Union Buy Theme System
 * Clean, professional light-mode navy/white design system
 */

import { Platform } from 'react-native';

// ============================================
// COLOR PALETTE
// ============================================

export const MetroColors = {
  // Base backgrounds (clean, light)
  background: {
    primary: '#F9FAFB',      // Very light gray - page background
    secondary: '#FFFFFF',    // Pure white - cards / panels
    tertiary: '#F3F4F6',     // Light gray - sub-panels / chips
    elevated: '#FFFFFF',     // Modals / overlays
  },

  // Accent colors (navy + blue palette)
  accent: {
    cyan: '#3B6EA5',         // Lighter Navy - primary actions (kept name for compatibility)
    cyanMuted: 'rgba(59, 110, 165, 0.10)',
    cyanDark: '#2B5480',
    orange: '#3B82F6',       // Blue - accent actions (kept name for compatibility)
    orangeMuted: 'rgba(59, 130, 246, 0.10)',
    green: '#10B981',        // Green - success
    greenMuted: '#DCFCE7',   // Light green - discount backgrounds
    greenDark: '#166534',    // Dark green - discount text
    red: '#EF4444',          // Red - errors
    redMuted: 'rgba(239, 68, 68, 0.10)',
    purple: '#8B5CF6',       // Purple - special highlights
    purpleMuted: 'rgba(139, 92, 246, 0.10)',
    yellow: '#F59E0B',       // Amber - warnings
    yellowMuted: 'rgba(245, 158, 11, 0.10)',
    pink: '#EC4899',         // Pink - special offers
    pinkMuted: 'rgba(236, 72, 153, 0.10)',
    indigo: '#6366F1',       // Indigo - premium
    indigoMuted: 'rgba(99, 102, 241, 0.10)',
    teal: '#14B8A6',         // Teal - alternative accent
    tealMuted: 'rgba(20, 184, 166, 0.10)',
  },

  // Text colors - professional and clean
  text: {
    primary: '#111827',      // Dark gray - headlines
    secondary: '#374151',    // Medium gray - body text
    tertiary: '#6B7280',     // Gray - labels
    muted: '#9CA3AF',        // Light gray - placeholders
    inverse: '#FFFFFF',      // On colored surfaces
  },

  // Border colors - subtle
  border: {
    default: '#E5E7EB',      // Light gray - default borders
    muted: '#F3F4F6',        // Very light - subtle dividers
    accent: '#3B6EA5',       // Lighter Navy - highlighted borders
    warning: '#3B82F6',      // Blue - warning state borders
  },

  // Status colors (semantic, clean)
  status: {
    pending: '#F59E0B',      // Amber
    active: '#3B82F6',       // Blue
    confirmed: '#10B981',    // Green
    cancelled: '#EF4444',    // Red
    locked: '#8B5CF6',       // Purple
  },

  // Soft overlays
  glass: {
    background: 'rgba(255, 255, 255, 0.95)',
    border: 'rgba(229, 231, 235, 0.8)',
    highlight: 'rgba(18, 58, 92, 0.05)',
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
// SHADOWS (subtle, clean shadows)
// ============================================

export const Shadows = {
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  glow: (color: string) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  }),
  cyanGlow: {
    shadowColor: MetroColors.accent.cyan,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  orangeGlow: {
    shadowColor: MetroColors.accent.orange,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
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
