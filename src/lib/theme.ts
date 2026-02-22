/**
 * rynk Mobile Design System
 * Based on rynk-web "Cognitive Minimalist" design philosophy
 * "Swiss Modern" - Precision. Clarity. Bold Typography.
 */

// Main background colors - Strictly Dark Mode (Swiss Modern)
export const colors = {
  // Backgrounds
  background: {
    primary: '#131315',      // True Black -> Deep Charcoal (Web: 240 5% 8%)
    card: '#1A1A1C',         // Surface / Card (Web: 240 5% 10%)
    secondary: '#262629',    // Secondary elements (Web: 240 5% 14%)
    elevated: '#2B2B2E',     // Modals / Elevated surfaces (Web: 240 4% 16%)
    tertiary: '#2B2B2E',     // Tertiary
  },

  // Foreground - Text Colors
  text: {
    primary: '#F2F2F2',      // Primary Text (Web: 0 0% 95%)
    secondary: '#999999',    // Muted Text (Web: 240 5% 60%)
    tertiary: '#666666',     // Tertiary Text
    inverse: '#131315',      // Inverse Text (for primary buttons)
  },

  // Accent - Monochrome Action
  accent: {
    primary: '#F2F2F2',      // White (Primary Action)
    secondary: '#262629',    // Dark Grey (Secondary Action)
    success: '#10B981',      // Emerald Green (Keep for functional states)
    warning: '#F59E0B',      // Amber
    error: '#7C2D2D',        // Red (Web: 0 62% 30% - Desaturated Red)
  },

  // Borders
  border: {
    default: '#2E2E33',      // Default Border (Web: 240 5% 18%)
    subtle: '#262629',       // Subtle Border
    focus: '#F2F2F2',        // Focus ring (White)
  },

  // Surface overlays
  surface: {
    overlay: 'rgba(0, 0, 0, 0.8)',
    glassBg: 'rgba(19, 19, 21, 0.85)', // Updated for new bg
  },
};

// Spacing scale (in pixels)
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

// Border radius scale - Rounded (Modern)
export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  full: 9999, // Pill shape
};

// Typography
export const typography = {
  // Font families
  fontFamily: {
    sans: 'Manrope_400Regular',
    mono: 'JetBrainsMono_400Regular',
  },

  // Font sizes
  fontSize: {
    xs: 10,
    sm: 12,
    base: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    display: 40,
  },

  // Font weights
  fontWeight: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },

  // Line heights
  lineHeight: {
    tight: 1.1,
    snug: 1.3,
    normal: 1.5,
    relaxed: 1.625,
  },

  // Letter spacing - Tighter for Swiss Headings
  letterSpacing: {
    tighter: -0.8,    // -0.05em approx
    tight: -0.4,      // -0.025em approx
    normal: 0,
    wide: 0.4,
  },
};

// Shadows - Removed/Minimized for Flat Style
export const shadows = {
  sm: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  md: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  lg: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
};

// Animation timings
export const animation = {
  fast: 150,
  normal: 200,
  slow: 300,
  verySlow: 500,
};

// Common style patterns
export const commonStyles = {
  // Card styles - Flat, Bordered
  card: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
  },

  // Input styles - Sharp, Minimal
  input: {
    backgroundColor: 'transparent',
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: typography.fontSize.md,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.border.default,
  },

  // Button primary - White Background, Black Text
  buttonPrimary: {
    backgroundColor: colors.accent.primary,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },

  // Button secondary - Transparent, White Border
  buttonSecondary: {
    backgroundColor: 'transparent',
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },

  // Badge styles - Sharp, Outlined
  badge: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
};

// Export theme object for easy access
export const theme = {
  colors,
  spacing,
  borderRadius,
  typography,
  shadows,
  animation,
  commonStyles,
};

export default theme;
