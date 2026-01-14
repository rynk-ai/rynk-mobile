/**
 * rynk Mobile Design System
 * Based on rynk-web "Cognitive Minimalist" design philosophy
 * "Swiss Modern" - Precision. Clarity. Bold Typography.
 */

// Main background colors - Strictly Dark Mode (Swiss Modern)
export const colors = {
  // Backgrounds
  background: {
    primary: '#0A0A0A',      // True Black
    card: '#0F0F0F',         // Surface / Card
    secondary: '#1A1A1A',    // Secondary elements
    elevated: '#242424',     // Modals / Elevated surfaces
    tertiary: '#242424',     // Tertiary
  },
  
  // Foreground - Text Colors
  text: {
    primary: '#F0F0F0',      // Primary Text
    secondary: '#A1A1AA',    // Muted Text
    tertiary: '#71717A',     // Tertiary Text
    inverse: '#0A0A0A',      // Inverse Text (for primary buttons)
  },
  
  // Accent - Monochrome Action
  accent: {
    primary: '#F5F5F5',      // White (Primary Action)
    secondary: '#242424',    // Dark Grey (Secondary Action)
    success: '#10B981',      // Emerald Green (Keep for functional states)
    warning: '#F59E0B',      // Amber
    error: '#EF4444',        // Red
  },
  
  // Borders
  border: {
    default: '#242424',      // Default Border
    subtle: '#1A1A1A',       // Subtle Border
    focus: '#F5F5F5',        // Focus ring (White)
  },
  
  // Surface overlays
  surface: {
    overlay: 'rgba(0, 0, 0, 0.8)',
    glassBg: 'rgba(10, 10, 10, 0.95)',
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

// Border radius scale - Sharp (Swiss)
export const borderRadius = {
  sm: 0,
  md: 0,
  lg: 0,
  xl: 0,
  full: 0, // Enforce sharp even for "pills" where possible, or use specific component overrides if needed
};

// Typography
export const typography = {
  // Font families
  fontFamily: {
    sans: 'System',  // Uses system font
    mono: 'Menlo',   // Monospace
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
