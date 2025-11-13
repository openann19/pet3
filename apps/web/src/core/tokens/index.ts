/**
 * Design Tokens - Centralized Export (DEPRECATED)
 * 
 * @deprecated This file is kept for backward compatibility only.
 * Please import from @petspark/shared/tokens instead:
 * 
 * import { Typography, Dimens } from '@petspark/shared/tokens';
 * import { motionTokens } from '@petspark/shared';
 * 
 * This file will be removed in a future version.
 */

// Re-export from shared package
export { Dimens, Typography } from '@petspark/shared';

// Import motion tokens from motion package
// The motion package exports motionTokens from its main index
import { motionTokens } from '@petspark/motion';

export { motionTokens };
export const Motion = {
  durations: {
    instant: motionTokens.durations.instant,
    fast: motionTokens.durations.fast,
    normal: motionTokens.durations.standard,
    smooth: motionTokens.durations.enterExit,
    slow: motionTokens.durations.slow,
    slower: motionTokens.durations.deliberate,
  },
  easing: {
    standard: motionTokens.easing.standard,
    decelerate: 'ease-out',
    accelerate: 'ease-in',
    emphasized: motionTokens.easing.emphasis,
  },
} as const;

// Keep platform-specific exports
export { buttonTokens, getButtonTokens } from './button-colors';
export type { ButtonTokenSet } from '../types/button-tokens';
export { getColorToken, getColorTokenWithOpacity, getColorCSSVar, ColorTokens } from './colors';

/**
 * Focus ring utilities
 * Standardized focus styles for accessibility
 */
export const FocusRing = {
  /**
   * Standard focus ring class for interactive elements
   * Uses coral primary color with proper offset
   */
  standard: 'focus:outline-none focus:ring-2 focus:ring-[var(--coral-primary)] focus:ring-offset-2',

  /**
   * Focus ring with reduced offset for compact components
   */
  compact: 'focus:outline-none focus:ring-2 focus:ring-[var(--coral-primary)] focus:ring-offset-1',

  /**
   * Focus ring for buttons (uses button token focus ring)
   */
  button: 'focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:ring-offset-2',

  /**
   * Focus ring for inputs
   */
  input: 'focus:outline-none focus:ring-2 focus:ring-[var(--coral-primary)] focus:ring-opacity-20',
} as const;

/**
 * Spacing utilities
 * Convert token values to Tailwind classes
 */
export const Spacing = {
  /**
   * Get spacing value in pixels
   */
  px: (token: keyof typeof import('./dimens').Dimens.spacing): string => {
    const { Dimens } = require('./dimens');
    return `${Dimens.spacing[token]}px`;
  },

  /**
   * Get component spacing
   */
  component: (path: string): string => {
    const { Dimens } = require('./dimens');
    const parts = path.split('.');
    let value: number | undefined;
    let current: unknown = Dimens.component;

    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = (current as Record<string, unknown>)[part];
      } else {
        return '0px';
      }
    }

    if (typeof current === 'number') {
      return `${current}px`;
    }

    return '0px';
  },
} as const;

/**
 * Border radius utilities
 */
export const Radius = {
  /**
   * Get radius value in pixels
   */
  px: (token: keyof typeof import('./dimens').Dimens.radius): string => {
    const { Dimens } = require('./dimens');
    const value = Dimens.radius[token];
    if (typeof value === 'number') {
      return `${value}px`;
    }
    return '0px';
  },
} as const;
