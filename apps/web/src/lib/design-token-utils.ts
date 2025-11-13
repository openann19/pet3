/**
 * Design Token Utilities
 * Maps core design tokens (Typography, Dimens, Motion, ColorTokens) to Tailwind CSS classes
 * 
 * This provides type-safe utilities for using design tokens consistently across the app.
 */

import type { Typography } from '@petspark/shared';
import { Dimens } from '@petspark/shared';
import { cn } from './utils';

// Import motion tokens directly from source to avoid module resolution issues
// Using type assertion to handle potential import resolution issues
interface MotionTokensSource {
  durations: {
    instant: number;
    fast: number;
    standard: number;
    enterExit: number;
    slow: number;
    deliberate: number;
  };
  easing: {
    standard: string;
    emphasis: string;
  };
};

let motionTokensSource: MotionTokensSource;

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const motionModule = require('../../../../packages/motion/src/tokens') as { motion?: MotionTokensSource };
  motionTokensSource = motionModule.motion ?? {
    durations: {
      instant: 75,
      fast: 150,
      standard: 260,
      enterExit: 200,
      slow: 300,
      deliberate: 500,
    },
    easing: {
      standard: 'ease-out',
      emphasis: 'cubic-bezier(0.16, 1, 0.3, 1)',
    },
  };
} catch {
  // Fallback values if import fails
  motionTokensSource = {
    durations: {
      instant: 75,
      fast: 150,
      standard: 260,
      enterExit: 200,
      slow: 300,
      deliberate: 500,
    },
    easing: {
      standard: 'ease-out',
      emphasis: 'cubic-bezier(0.16, 1, 0.3, 1)',
    },
  };
}

// Map motionTokens to Motion structure for backward compatibility
interface Motion {
  readonly durations: {
    readonly instant: number;
    readonly fast: number;
    readonly normal: number;
    readonly smooth: number;
    readonly slow: number;
    readonly slower: number;
  };
  readonly easing: {
    readonly standard: string;
    readonly decelerate: string;
    readonly accelerate: string;
    readonly emphasized: string;
  };
}

const Motion: Motion = {
  durations: {
    instant: motionTokensSource.durations.instant,
    fast: motionTokensSource.durations.fast,
    normal: motionTokensSource.durations.standard,
    smooth: motionTokensSource.durations.enterExit,
    slow: motionTokensSource.durations.slow,
    slower: motionTokensSource.durations.deliberate,
  },
  easing: {
    standard: motionTokensSource.easing.standard,
    decelerate: 'ease-out',
    accelerate: 'ease-in',
    emphasized: motionTokensSource.easing.emphasis,
  },
} as const;

/**
 * Typography Utilities
 * Maps Typography.scale tokens to Tailwind classes
 */

type TypographyScale = keyof typeof Typography.scale;

const typographyToTailwind: Record<TypographyScale, string> = {
  display: 'text-[clamp(2.25rem,3vw,3rem)] font-[700] leading-[1.2] tracking-tight',
  h1: 'text-[clamp(1.75rem,2.5vw,2.25rem)] font-[600] leading-[1.25] tracking-tight',
  h2: 'text-[clamp(1.5rem,2.1vw,2rem)] font-semibold leading-[1.3] tracking-normal',
  h3: 'text-[1.25rem] sm:text-[1.5rem] font-medium leading-[1.35] tracking-normal',
  h4: 'text-lg sm:text-xl font-semibold leading-[1.4] tracking-normal',
  body: 'text-base font-normal leading-[1.5] tracking-normal',
  bodySmall: 'text-sm font-normal leading-[1.5] tracking-normal',
  caption: 'text-xs font-normal leading-[1.4] tracking-wide',
  label: 'text-sm font-medium leading-[1.4] tracking-wide',
  button: 'text-sm font-semibold leading-[1.2] tracking-wide',
};

/**
 * Get typography classes from Typography.scale token
 */
export function getTypographyClasses(scale: TypographyScale): string {
  return typographyToTailwind[scale] || typographyToTailwind.body;
}

/**
 * Spacing Utilities
 * Maps Dimens.spacing tokens to Tailwind classes
 */

type SpacingToken = keyof typeof Dimens.spacing;

const spacingToTailwind: Record<SpacingToken, {
  gap: string;
  padding: string;
  paddingX: string;
  paddingY: string;
  margin: string;
  marginX: string;
  marginY: string;
  spaceY: string;
  spaceX: string;
}> = {
  xs: { gap: 'gap-0.5', padding: 'p-0.5', paddingX: 'px-0.5', paddingY: 'py-0.5', margin: 'm-0.5', marginX: 'mx-0.5', marginY: 'my-0.5', spaceY: 'space-y-0.5', spaceX: 'space-x-0.5' },
  sm: { gap: 'gap-1', padding: 'p-1', paddingX: 'px-1', paddingY: 'py-1', margin: 'm-1', marginX: 'mx-1', marginY: 'my-1', spaceY: 'space-y-1', spaceX: 'space-x-1' },
  md: { gap: 'gap-2', padding: 'p-2', paddingX: 'px-2', paddingY: 'py-2', margin: 'm-2', marginX: 'mx-2', marginY: 'my-2', spaceY: 'space-y-2', spaceX: 'space-x-2' },
  lg: { gap: 'gap-3', padding: 'p-3', paddingX: 'px-3', paddingY: 'py-3', margin: 'm-3', marginX: 'mx-3', marginY: 'my-3', spaceY: 'space-y-3', spaceX: 'space-x-3' },
  xl: { gap: 'gap-4', padding: 'p-4', paddingX: 'px-4', paddingY: 'py-4', margin: 'm-4', marginX: 'mx-4', marginY: 'my-4', spaceY: 'space-y-4', spaceX: 'space-x-4' },
  '2xl': { gap: 'gap-6', padding: 'p-6', paddingX: 'px-6', paddingY: 'py-6', margin: 'm-6', marginX: 'mx-6', marginY: 'my-6', spaceY: 'space-y-6', spaceX: 'space-x-6' },
  '3xl': { gap: 'gap-8', padding: 'p-8', paddingX: 'px-8', paddingY: 'py-8', margin: 'm-8', marginX: 'mx-8', marginY: 'my-8', spaceY: 'space-y-8', spaceX: 'space-x-8' },
  '4xl': { gap: 'gap-10', padding: 'p-10', paddingX: 'px-10', paddingY: 'py-10', margin: 'm-10', marginX: 'mx-10', marginY: 'my-10', spaceY: 'space-y-10', spaceX: 'space-x-10' },
  '5xl': { gap: 'gap-12', padding: 'p-12', paddingX: 'px-12', paddingY: 'py-12', margin: 'm-12', marginX: 'mx-12', marginY: 'my-12', spaceY: 'space-y-12', spaceX: 'space-x-12' },
  '6xl': { gap: 'gap-16', padding: 'p-16', paddingX: 'px-16', paddingY: 'py-16', margin: 'm-16', marginX: 'mx-16', marginY: 'my-16', spaceY: 'space-y-16', spaceX: 'space-x-16' },
  '7xl': { gap: 'gap-20', padding: 'p-20', paddingX: 'px-20', paddingY: 'py-20', margin: 'm-20', marginX: 'mx-20', marginY: 'my-20', spaceY: 'space-y-20', spaceX: 'space-x-20' },
  '8xl': { gap: 'gap-24', padding: 'p-24', paddingX: 'px-24', paddingY: 'py-24', margin: 'm-24', marginX: 'mx-24', marginY: 'my-24', spaceY: 'space-y-24', spaceX: 'space-x-24' },
  '9xl': { gap: 'gap-32', padding: 'p-32', paddingX: 'px-32', paddingY: 'py-32', margin: 'm-32', marginX: 'mx-32', marginY: 'my-32', spaceY: 'space-y-32', spaceX: 'space-x-32' },
  '10xl': { gap: 'gap-40', padding: 'p-40', paddingX: 'px-40', paddingY: 'py-40', margin: 'm-40', marginX: 'mx-40', marginY: 'my-40', spaceY: 'space-y-40', spaceX: 'space-x-40' },
};

type SpacingType = 'gap' | 'padding' | 'paddingX' | 'paddingY' | 'margin' | 'marginX' | 'marginY' | 'spaceY' | 'spaceX';

/**
 * Get spacing class from Dimens.spacing token
 */
export function getSpacingClasses(token: SpacingToken, type: SpacingType): string {
  return spacingToTailwind[token]?.[type] || '';
}

/**
 * Get multiple spacing classes
 */
export function getSpacingClassesMultiple(token: SpacingToken, types: SpacingType[]): string {
  return types.map(type => getSpacingClasses(token, type)).filter(Boolean).join(' ');
}

/**
 * Spacing configuration interface
 */
export interface SpacingConfig {
  gap?: SpacingToken;
  padding?: SpacingToken;
  paddingX?: SpacingToken;
  paddingY?: SpacingToken;
  margin?: SpacingToken;
  marginX?: SpacingToken;
  marginY?: SpacingToken;
  spaceY?: SpacingToken;
  spaceX?: SpacingToken;
}

/**
 * Get spacing classes from configuration object
 * Convenience function for applying multiple spacing types at once
 */
export function getSpacingClassesFromConfig(config: SpacingConfig): string {
  const classes: string[] = [];
  
  if (config.gap) classes.push(getSpacingClasses(config.gap, 'gap'));
  if (config.padding) classes.push(getSpacingClasses(config.padding, 'padding'));
  if (config.paddingX) classes.push(getSpacingClasses(config.paddingX, 'paddingX'));
  if (config.paddingY) classes.push(getSpacingClasses(config.paddingY, 'paddingY'));
  if (config.margin) classes.push(getSpacingClasses(config.margin, 'margin'));
  if (config.marginX) classes.push(getSpacingClasses(config.marginX, 'marginX'));
  if (config.marginY) classes.push(getSpacingClasses(config.marginY, 'marginY'));
  if (config.spaceY) classes.push(getSpacingClasses(config.spaceY, 'spaceY'));
  if (config.spaceX) classes.push(getSpacingClasses(config.spaceX, 'spaceX'));
  
  return classes.join(' ');
}

/**
 * Radius Utilities
 * Maps Dimens.radius tokens to Tailwind classes
 */

type RadiusToken = keyof typeof Dimens.radius;

const radiusToTailwind: Record<string, string> = {
  none: 'rounded-none',
  xs: 'rounded-sm',
  sm: 'rounded',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
  '3xl': 'rounded-3xl',
  full: 'rounded-full',
};

/**
 * Get radius class from Dimens.radius token
 */
export function getRadiusClasses(token: RadiusToken): string {
  // Handle nested tokens like 'button.sm' or simple tokens like 'md'
  if (typeof Dimens.radius[token] === 'number') {
    const value = Dimens.radius[token] as number;
    // Map numeric values to Tailwind classes
    if (value === 0) return 'rounded-none';
    if (value <= 2) return 'rounded-sm';
    if (value <= 4) return 'rounded';
    if (value <= 8) return 'rounded-md';
    if (value <= 12) return 'rounded-lg';
    if (value <= 16) return 'rounded-xl';
    if (value <= 20) return 'rounded-2xl';
    if (value <= 24) return 'rounded-3xl';
    if (value >= 999) return 'rounded-full';
    return `rounded-[${value}px]`;
  }
  return radiusToTailwind[token] ?? 'rounded-md';
}

/**
 * Color Utilities
 * Maps ColorTokens to Tailwind classes
 * Uses semantic color names that map to Tailwind theme colors
 */

type ColorToken = 'background' | 'foreground' | 'primary' | 'primaryForeground' | 'secondary' | 'secondaryForeground' | 'accent' | 'accentForeground' | 'muted' | 'mutedForeground' | 'destructive' | 'destructiveForeground' | 'border' | 'input' | 'ring';

const colorToTailwind: Record<ColorToken, {
  text: string;
  bg: string;
  border: string;
}> = {
  background: { text: 'text-background', bg: 'bg-background', border: 'border-background' },
  foreground: { text: 'text-foreground', bg: 'bg-foreground', border: 'border-foreground' },
  primary: { text: 'text-primary', bg: 'bg-primary', border: 'border-primary' },
  primaryForeground: { text: 'text-primary-foreground', bg: 'bg-primary-foreground', border: 'border-primary-foreground' },
  secondary: { text: 'text-secondary', bg: 'bg-secondary', border: 'border-secondary' },
  secondaryForeground: { text: 'text-secondary-foreground', bg: 'bg-secondary-foreground', border: 'border-secondary-foreground' },
  accent: { text: 'text-accent', bg: 'bg-accent', border: 'border-accent' },
  accentForeground: { text: 'text-accent-foreground', bg: 'bg-accent-foreground', border: 'border-accent-foreground' },
  muted: { text: 'text-muted', bg: 'bg-muted', border: 'border-muted' },
  mutedForeground: { text: 'text-muted-foreground', bg: 'bg-muted-foreground', border: 'border-muted-foreground' },
  destructive: { text: 'text-destructive', bg: 'bg-destructive', border: 'border-destructive' },
  destructiveForeground: { text: 'text-destructive-foreground', bg: 'bg-destructive-foreground', border: 'border-destructive-foreground' },
  border: { text: 'text-border', bg: 'bg-border', border: 'border-border' },
  input: { text: 'text-input', bg: 'bg-input', border: 'border-input' },
  ring: { text: 'text-ring', bg: 'bg-ring', border: 'border-ring' },
};

type ColorUsage = 'text' | 'bg' | 'border';

/**
 * Get color class from ColorToken
 */
export function getColorClasses(token: ColorToken, usage: ColorUsage): string {
  return colorToTailwind[token]?.[usage] || '';
}

/**
 * Motion Utilities
 * Maps Motion tokens to Tailwind classes or CSS custom properties
 */

type MotionDurationKey = keyof typeof Motion.durations;
type MotionEasingKey = keyof typeof Motion.easing;

const durationToTailwind: Record<MotionDurationKey, string> = {
  instant: 'duration-0',
  fast: 'duration-150',
  normal: 'duration-[240ms]',
  smooth: 'duration-[320ms]',
  slow: 'duration-[400ms]',
  slower: 'duration-[600ms]',
};

const easingToTailwind: Record<string, string> = {
  standard: 'ease-out',
  decelerate: 'ease-out',
  accelerate: 'ease-in',
  emphasized: 'ease-in-out',
};

/**
 * Get motion duration class
 */
export function getMotionDurationClass(duration: MotionDurationKey): string {
  return durationToTailwind[duration] ?? 'duration-150';
}

/**
 * Get motion easing class
 */
export function getMotionEasingClass(easing: MotionEasingKey): string {
  return easingToTailwind[easing] ?? 'ease-out';
}

/**
 * Get motion transition class
 */
export function getMotionClasses(duration: MotionDurationKey, easing?: MotionEasingKey): string {
  const durationClass = getMotionDurationClass(duration);
  const easingClass = easing ? getMotionEasingClass(easing) : '';
  return cn(durationClass, easingClass, 'transition-all');
}

/**
 * Combined utility function for common use cases
 */
export interface DesignTokenConfig {
  typography?: TypographyScale;
  spacing?: { token: SpacingToken; types: SpacingType[] };
  radius?: RadiusToken;
  color?: { token: ColorToken; usage: ColorUsage };
  motion?: { duration: MotionDurationKey; easing?: MotionEasingKey };
  className?: string;
}

/**
 * Get combined design token classes
 */
export function getDesignTokenClasses(config: DesignTokenConfig): string {
  const classes: string[] = [];
  
  if (config.typography) {
    classes.push(getTypographyClasses(config.typography));
  }
  
  if (config.spacing) {
    classes.push(getSpacingClassesMultiple(config.spacing.token, config.spacing.types));
  }
  
  if (config.radius) {
    classes.push(getRadiusClasses(config.radius));
  }
  
  if (config.color) {
    classes.push(getColorClasses(config.color.token, config.color.usage));
  }
  
  if (config.motion) {
    classes.push(getMotionClasses(config.motion.duration, config.motion.easing));
  }
  
  if (config.className) {
    classes.push(config.className);
  }
  
  return cn(...classes);
}

/**
 * Shadow Utilities
 * Maps design token shadows to Tailwind classes
 */
type ShadowToken = 'base' | 'raised' | 'overlay' | 'modal' | 'glow-primary' | 'glow-accent' | 'glow-secondary';

const shadowToTailwind: Record<ShadowToken, string> = {
  base: 'shadow-[0_1px_3px_0_rgba(0,0,0,0.1),0_1px_2px_-1px_rgba(0,0,0,0.1)]',
  raised: 'shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-2px_rgba(0,0,0,0.1)]',
  overlay: 'shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1),0_4px_6px_-4px_rgba(0,0,0,0.1)]',
  modal: 'shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)]',
  'glow-primary': 'shadow-[0_0_20px_rgba(255,154,73,0.4),0_0_40px_rgba(255,154,73,0.2)]',
  'glow-accent': 'shadow-[0_0_20px_rgba(255,192,105,0.4),0_0_40px_rgba(255,192,105,0.2)]',
  'glow-secondary': 'shadow-[0_0_20px_rgba(123,157,212,0.4),0_0_40px_rgba(123,157,212,0.2)]',
};

/**
 * Get shadow class from shadow token
 */
export function getShadowClasses(token: ShadowToken): string {
  return shadowToTailwind[token] || '';
}

/**
 * Focus ring utility (accessibility)
 */
export const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

/**
 * Minimum touch target (accessibility)
 */
export const minTouchTarget = 'min-h-[44px] min-w-[44px]';

/**
 * Get minimum touch target size from design tokens
 * Returns the minimum touch target size (44px) as a CSS value
 * Uses the hitArea.minimum token from design tokens
 */
export function getMinTouchTarget(): string {
  // Import getHitAreaMinimum from design-tokens using dynamic import to avoid circular dependency
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { getHitAreaMinimum } = require('./design-tokens') as { getHitAreaMinimum: () => string };
  return getHitAreaMinimum();
}

/**
 * Get size token for common size patterns
 * Maps size names to spacing tokens
 * Returns spacing value as CSS string (e.g., "16px")
 */
export function getSizeToken(size: 'sm' | 'md' | 'lg' | 'xl'): string {
  // Import getSpacing from design-tokens using dynamic import to avoid circular dependency
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { getSpacing } = require('./design-tokens') as { getSpacing: (key: string) => string };
  const sizeMap: Record<'sm' | 'md' | 'lg' | 'xl', SpacingToken> = {
    sm: '4',  // 16px
    md: '6',  // 24px
    lg: '8',  // 32px
    xl: '10', // 40px
  };
  return getSpacing(sizeMap[size]);
}

/**
 * Get minimum touch target classes
 * Returns Tailwind classes for minimum touch target (44x44px)
 */
export function getMinTouchTargetClasses(): string {
  return minTouchTarget;
}

