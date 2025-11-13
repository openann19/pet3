/**
 * Glassmorphism Effects Utility
 * 
 * Standardized glass effect classes using design tokens
 * 
 * Location: apps/web/src/lib/glass-effects.ts
 */

import { cn } from '@/lib/utils';
import { getRadiusClasses, getSpacingClassesFromConfig } from '@/lib/design-token-utils';

export interface GlassEffectOptions {
  intensity?: 'light' | 'medium' | 'strong';
  blur?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  border?: boolean;
  borderIntensity?: 'subtle' | 'medium' | 'strong';
  padding?: boolean;
  rounded?: boolean;
}

const BLUR_CLASSES = {
  sm: 'backdrop-blur-sm',
  md: 'backdrop-blur-md',
  lg: 'backdrop-blur-lg',
  xl: 'backdrop-blur-xl',
  '2xl': 'backdrop-blur-2xl',
} as const;

const INTENSITY_CLASSES = {
  light: 'bg-white/10 dark:bg-black/10',
  medium: 'bg-white/20 dark:bg-black/20',
  strong: 'bg-white/30 dark:bg-black/30',
} as const;

const BORDER_CLASSES = {
  subtle: 'border border-white/10 dark:border-white/5',
  medium: 'border border-white/20 dark:border-white/10',
  strong: 'border-2 border-white/30 dark:border-white/20',
} as const;

/**
 * Get glassmorphism effect classes
 * 
 * @param options - Glass effect configuration
 * @returns Combined class string for glass effect
 * 
 * @example
 * ```tsx
 * <div className={glassEffect({ intensity: 'strong', blur: 'xl' })}>
 *   Content
 * </div>
 * ```
 */
export function glassEffect(options: GlassEffectOptions = {}): string {
  const {
    intensity = 'medium',
    blur = 'xl',
    border = true,
    borderIntensity = 'medium',
    padding = false,
    rounded = true,
  } = options;

  return cn(
    INTENSITY_CLASSES[intensity],
    BLUR_CLASSES[blur],
    border && BORDER_CLASSES[borderIntensity],
    rounded && getRadiusClasses('lg'),
    padding && getSpacingClassesFromConfig({ padding: 'lg' }),
    'shadow-xl shadow-black/10 dark:shadow-black/20'
  );
}

/**
 * Premium glass card effect
 */
export const glassCard = glassEffect({
  intensity: 'strong',
  blur: '2xl',
  border: true,
  borderIntensity: 'strong',
  rounded: true,
});

/**
 * Light glass overlay effect
 */
export const glassOverlay = glassEffect({
  intensity: 'light',
  blur: 'md',
  border: false,
  rounded: false,
});

/**
 * Medium glass panel effect
 */
export const glassPanel = glassEffect({
  intensity: 'medium',
  blur: 'xl',
  border: true,
  borderIntensity: 'medium',
  rounded: true,
  padding: true,
});

