/**
 * Design Token Hooks
 * Convenient hooks for accessing design tokens with theme awareness
 */

import { useThemeSystem } from '@/contexts/ThemeContext';
import type {
  SpacingKey,
  RadiiKey,
  ShadowKey,
  ColorKey,
  ZIndexKey,
  GradientKey,
  MotionDurationKey,
  MotionEasingKey,
  BreakpointKey,
  FontSizeKey,
  FontWeightKey,
  LineHeightKey,
  LetterSpacingKey,
} from '@/lib/types/design-tokens';

/**
 * Hook to access spacing tokens
 * @returns Function to get spacing token value
 * 
 * @example
 * ```tsx
 * const spacing = useSpacing();
 * const padding = spacing('4'); // Returns spacing token value
 * ```
 */
export function useSpacing() {
  const { tokens } = useThemeSystem();
  return tokens.spacing;
}

/**
 * Hook to access color tokens with current theme
 * @returns Function to get color token value for current theme
 * 
 * @example
 * ```tsx
 * const colors = useColors();
 * const primary = colors('primary'); // Returns primary color for current theme
 * ```
 */
export function useColors() {
  const { tokens } = useThemeSystem();
  return tokens.color;
}

/**
 * Hook to access shadow tokens
 * @returns Function to get shadow token value
 * 
 * @example
 * ```tsx
 * const shadows = useShadows();
 * const glow = shadows('glow.primary'); // Returns glow shadow
 * ```
 */
export function useShadows() {
  const { tokens } = useThemeSystem();
  return tokens.shadow;
}

/**
 * Hook to access radius tokens
 * @returns Function to get radius token value
 * 
 * @example
 * ```tsx
 * const radius = useRadius();
 * const rounded = radius('lg'); // Returns large radius
 * ```
 */
export function useRadius() {
  const { tokens } = useThemeSystem();
  return tokens.radius;
}

/**
 * Hook to access all design tokens with current theme
 * @returns Object with all token getters
 * 
 * @example
 * ```tsx
 * const tokens = useDesignTokens();
 * const primary = tokens.color('primary');
 * const spacing = tokens.spacing('4');
 * const shadow = tokens.shadow('raised');
 * ```
 */
export function useDesignTokens() {
  const { tokens, mode } = useThemeSystem();
  return {
    spacing: tokens.spacing,
    color: tokens.color,
    shadow: tokens.shadow,
    radius: tokens.radius,
    zIndex: tokens.zIndex,
    gradient: tokens.gradient,
    motionDuration: tokens.motionDuration,
    motionEasing: tokens.motionEasing,
    breakpoint: tokens.breakpoint,
    fontSize: tokens.fontSize,
    fontWeight: tokens.fontWeight,
    lineHeight: tokens.lineHeight,
    letterSpacing: tokens.letterSpacing,
    fontFamily: tokens.fontFamily,
    hitAreaMinimum: tokens.hitAreaMinimum,
    mode,
  };
}

/**
 * Type-safe color with opacity utility
 * Converts hex color to rgba with specified opacity
 * 
 * @param color - Hex color string (e.g., '#ff0000' or 'rgb(255, 0, 0)')
 * @param opacity - Opacity value between 0 and 1
 * @returns rgba color string
 */
export function colorWithOpacity(color: string, opacity: number): string {
  // Handle hex colors
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  
  // Handle rgb colors
  if (color.startsWith('rgb')) {
    const rgbMatch = color.match(/\d+/g);
    if (rgbMatch && rgbMatch.length >= 3) {
      const [r, g, b] = rgbMatch.map(Number);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
  }
  
  // Fallback: return as-is if format not recognized
  return color;
}

