import { Platform } from 'react-native';

/**
 * UI polish utilities for making interfaces feel better
 * Based on design engineering principles
 */

// Typography utilities
export const textStyles = {
  // Better text rendering on supported platforms
  antialiased: Platform.select({
    web: {
      WebkitFontSmoothing: 'antialiased',
      MozOsxFontSmoothing: 'grayscale',
    },
    default: {},
  }),
  
  // Text wrapping improvements
  balance: Platform.select({
    web: { textWrap: 'balance' as any },
    default: {},
  }),
  
  pretty: Platform.select({
    web: { textWrap: 'pretty' as any },
    default: {},
  }),
  
  // Tabular numbers for consistent spacing
  tabularNums: {
    fontVariant: ['tabular-nums'],
  },
} as const;

// Animation constants
export const animations = {
  // Spring configurations for natural feel
  spring: {
    gentle: { damping: 20, stiffness: 300 },
    snappy: { damping: 15, stiffness: 400 },
    bouncy: { damping: 12, stiffness: 300 },
  },
  
  // Timing configurations
  timing: {
    fast: 200,
    normal: 300,
    slow: 400,
  },
  
  // Easing curves
  easing: {
    // Standard easing for most interactions
    standard: 'cubic-bezier(0.2, 0, 0, 1)',
    // For enter animations
    enter: 'cubic-bezier(0, 0, 0.2, 1)',
    // For exit animations  
    exit: 'cubic-bezier(0.4, 0, 1, 1)',
  },
  
  // Scale values for press feedback
  scale: {
    press: 0.97,
    hover: 1.02,
  },
} as const;

// Shadow configurations for depth
export const shadows = {
  // Light shadows for subtle depth
  sm: {
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  
  // Medium shadows for cards
  md: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  
  // Large shadows for prominent elements
  lg: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  
  // For colored shadows (accent colors)
  colored: (opacity = 0.2) => ({
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: opacity,
    shadowRadius: 4,
    elevation: 4,
  }),
} as const;

// Hit area utilities
export const hitAreas = {
  // Minimum 40x40px hit areas
  minimum: {
    minHeight: 40,
    minWidth: 40,
  },
  
  // Larger hit areas for important actions
  large: {
    minHeight: 48,
    minWidth: 48,
  },
  
  // Hit slop for extending touch areas
  slop: {
    small: 8,
    medium: 12,
    large: 16,
  },
} as const;

// Border radius utilities for concentric design
export const borderRadius = {
  // Calculate concentric border radius
  concentric: (inner: number, padding: number) => inner + padding,
  
  // Standard radius values
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 20,
  
  // Special cases
  pill: 9999,
  circle: (size: number) => size / 2,
} as const;

// Opacity values for consistent layering
export const opacity = {
  disabled: 0.5,
  muted: 0.7,
  subtle: 0.8,
  overlay: 0.9,
  
  // For colored overlays
  tint: {
    light: 0.1,
    medium: 0.2,
    strong: 0.3,
  },
} as const;

// Spacing multipliers for consistent rhythm
export const spacing = {
  // Stagger delays for enter animations (in ms)
  stagger: {
    items: 50,
    sections: 100,
    pages: 150,
  },
} as const;