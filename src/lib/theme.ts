/**
 * rynk Mobile Design System
 * Based on rynk-web "Cognitive Minimalist" design philosophy
 * Inspired by Notion/Perplexity with neutral, clean aesthetics
 */

// Main background colors
export const colors = {
  // Backgrounds - "True Neutral" (Dark Mode)
  background: {
    primary: '#191919',      // Main app background (Notion-like)
    card: '#1F1F1F',         // Card/surface background
    secondary: '#262626',    // Secondary surfaces
    elevated: '#2E2E2E',     // Hover states, elevated surfaces
  },
  
  // Foreground - Text Colors
  text: {
    primary: '#E5E5E5',      // Primary text (Soft White)
    secondary: '#999999',    // Muted/secondary text
    tertiary: '#666666',     // Placeholder text
    inverse: '#191919',      // Text on accent backgrounds
  },
  
  // Accent - Interactive Elements
  accent: {
    primary: '#4D7DFF',      // Blue accent (brighter for dark mode)
    secondary: '#a855f7',    // Purple for highlights
    success: '#22c55e',      // Green for success states
    warning: '#f59e0b',      // Amber for warnings
    error: '#ef4444',        // Red for errors
  },
  
  // Borders
  border: {
    default: '#2E2E2E',      // Default border
    subtle: 'rgba(255, 255, 255, 0.06)', // Very subtle borders
    focus: 'rgba(77, 125, 255, 0.3)',    // Focus ring
  },
  
  // Surface overlays
  surface: {
    overlay: 'rgba(0, 0, 0, 0.5)',
    glassBg: 'rgba(25, 25, 25, 0.95)',
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

// Border radius scale
export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
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
