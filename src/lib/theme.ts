/**
 * rynk Mobile Design System
 * Based on rynk-web "Cognitive Minimalist" design philosophy
 * Inspired by Notion/Perplexity with neutral, clean aesthetics
 */

// Main background colors
export const colors = {
  // Backgrounds - "Swiss Modern" (True Black like Web)
  background: {
    primary: '#0A0A0A',      // True Black (Web match)
    card: '#0F0F0F',         // Surface (Web match)
    secondary: '#1A1A1A',    // Secondary (Web match)
    elevated: '#242424',     // Elevated
    tertiary: '#242424',     // Tertiary
  },
  
  // Foreground - Text Colors
  text: {
    primary: '#F0F0F0',      // Primary (Web match)
    secondary: '#A1A1AA',    // Muted foreground (Web match approx)
    tertiary: '#71717A',     // Tertiary
    inverse: '#0A0A0A',      // Inverse
  },
  
  // Accent - Interactive Elements
  accent: {
    primary: '#3B82F6',      // Swiss Blue
    secondary: '#F5F5F5',    // Secondary
    success: '#10B981',      // Emerald Green
    warning: '#F59E0B',      // Amber
    error: '#EF4444',        // Red
  },
  
  // Borders
  border: {
    default: '#242424',      // Web border color
    subtle: '#242424',       // Subtle
    focus: '#3B82F6',        // Focus ring
  },
  
  // Surface overlays
  surface: {
    overlay: 'rgba(0, 0, 0, 0.7)',
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

// Border radius scale - Swiss Style (Sharp)
export const borderRadius = {
  sm: 0,
  md: 0,
  lg: 0,
  xl: 0,
  full: 0, // Even pills are sharp in strict Swiss, but we might check if 'full' acts as pill. Web has --radius: 0.
};

// Typography
export const typography = {
  // Font families (system fonts similar to web)
  fontFamily: {
    sans: 'System',  // Uses system font on iOS/Android
    mono: 'Menlo',   // Monospace for code
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
    tight: 1.2,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
  },
  
  // Letter spacing
  letterSpacing: {
    tighter: -0.05,
    tight: -0.025,
    normal: 0,
    wide: 0.025,
  },
};

// Shadows (subtle for minimalist design)
export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
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
  // Card styles
  card: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  
  // Input styles
  input: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: typography.fontSize.md,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  
  // Button primary
  buttonPrimary: {
    backgroundColor: colors.text.primary,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  
  // Button secondary
  buttonSecondary: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  
  // Badge styles
  badge: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.full,
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
