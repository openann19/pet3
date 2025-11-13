/**
 * Global Design Tokens for Mobile
 * 
 * This file imports base tokens from @petspark/shared/tokens and creates
 * React Native style adapters. This ensures consistency with web while
 * providing platform-specific formatting.
 * 
 * Location: apps/mobile/src/theme/tokens.ts
 */

import { Typography as SharedTypography, Dimens as SharedDimens } from '@petspark/shared';
// Import motion tokens - using relative path since @petspark/motion path may not be configured
import { motion as motionTokens } from '../../../../packages/motion/src/tokens';
import type { TextStyle } from 'react-native';

/**
 * Typography Scale
 * Adapter from shared Typography to React Native TextStyle format
 */
export const typography = {
  // Display / Hero: clamp(2.25rem, 3vw, 3rem); weight 700-800
  display: {
    fontSize: SharedTypography.scale.display.fontSize,
    fontWeight: `${SharedTypography.scale.display.fontWeight}` as const,
    lineHeight: Math.round(SharedTypography.scale.display.fontSize * SharedTypography.scale.display.lineHeight),
    letterSpacing: SharedTypography.scale.display.letterSpacing,
  } as TextStyle,
  
  // H1: clamp(1.75rem, 2.5vw, 2.25rem); weight 600-700
  h1: {
    fontSize: SharedTypography.scale.h1.fontSize,
    fontWeight: `${SharedTypography.scale.h1.fontWeight}` as const,
    lineHeight: Math.round(SharedTypography.scale.h1.fontSize * SharedTypography.scale.h1.lineHeight),
    letterSpacing: SharedTypography.scale.h1.letterSpacing,
  } as TextStyle,
  
  // H2: clamp(1.5rem, 2.1vw, 2rem); weight 600
  h2: {
    fontSize: SharedTypography.scale.h2.fontSize,
    fontWeight: `${SharedTypography.scale.h2.fontWeight}` as const,
    lineHeight: Math.round(SharedTypography.scale.h2.fontSize * SharedTypography.scale.h2.lineHeight),
    letterSpacing: SharedTypography.scale.h2.letterSpacing,
  } as TextStyle,
  
  // H3: 1.25rem-1.5rem; weight 500-600
  h3: {
    fontSize: SharedTypography.scale.h3.fontSize,
    fontWeight: `${SharedTypography.scale.h3.fontWeight}` as const,
    lineHeight: Math.round(SharedTypography.scale.h3.fontSize * SharedTypography.scale.h3.lineHeight),
    letterSpacing: SharedTypography.scale.h3.letterSpacing,
  } as TextStyle,
  
  // Body: 1rem; line-height ≥ 1.5
  body: {
    fontSize: SharedTypography.scale.body.fontSize,
    fontWeight: `${SharedTypography.scale.body.fontWeight}` as const,
    lineHeight: Math.round(SharedTypography.scale.body.fontSize * SharedTypography.scale.body.lineHeight),
    letterSpacing: SharedTypography.scale.body.letterSpacing,
  } as TextStyle,
  
  // Body-sm: 0.875rem; line-height ≥ 1.4
  bodySm: {
    fontSize: SharedTypography.scale.bodySmall.fontSize,
    fontWeight: `${SharedTypography.scale.bodySmall.fontWeight}` as const,
    lineHeight: Math.round(SharedTypography.scale.bodySmall.fontSize * SharedTypography.scale.bodySmall.lineHeight),
    letterSpacing: SharedTypography.scale.bodySmall.letterSpacing,
  } as TextStyle,
  
  // Caption/hint: 0.75rem; line-height ≥ 1.4 (minimal text size)
  caption: {
    fontSize: SharedTypography.scale.caption.fontSize,
    fontWeight: `${SharedTypography.scale.caption.fontWeight}` as const,
    lineHeight: Math.round(SharedTypography.scale.caption.fontSize * SharedTypography.scale.caption.lineHeight),
    letterSpacing: SharedTypography.scale.caption.letterSpacing,
  } as TextStyle,
} as const;

/**
 * Spacing Scale
 * Adapter from shared Dimens.spacing to React Native numeric values
 * Global spacing tokens: 4, 8, 12, 16, 24, 32, 40, 48px
 */
export const spacing = {
  xs: SharedDimens.spacing.xs,
  sm: SharedDimens.spacing.sm,
  md: SharedDimens.spacing.md,
  lg: SharedDimens.spacing.lg,
  xl: SharedDimens.spacing.xl,
  '2xl': SharedDimens.spacing['2xl'],
  '3xl': SharedDimens.spacing['3xl'],
  '4xl': SharedDimens.spacing['4xl'],
} as const;

/**
 * Border Radius Scale
 * Adapter from shared Dimens.radius to React Native numeric values
 */
export const radius = {
  sm: SharedDimens.radius.sm,
  md: SharedDimens.radius.md,
  lg: SharedDimens.radius.lg,
  xl: SharedDimens.radius.xl,
  '2xl': SharedDimens.radius['2xl'],
  '3xl': SharedDimens.radius['3xl'],
  full: SharedDimens.radius.full,
} as const;

/**
 * Elevation/Shadow Levels
 * React Native shadow styles - at most 3-4 elevation levels for consistency
 */
export const elevation = {
  base: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: SharedDimens.elevation.sm,
  },
  raised: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: SharedDimens.elevation.md,
  },
  overlay: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: SharedDimens.elevation.lg,
  },
  modal: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: SharedDimens.elevation['3xl'],
  },
} as const;

/**
 * Motion Durations
 * Adapter from shared motionTokens to React Native duration values
 * Enter/exit: 150-300ms
 * Hover/press: 75-150ms
 */
export const motion = {
  fast: motionTokens.durations.hoverPress,
  normal: motionTokens.durations.fast,
  smooth: motionTokens.durations.enterExit,
  slow: motionTokens.durations.slow,
} as const;

/**
 * Component Sizes
 * Adapter from shared Dimens.component to React Native numeric values
 */
export const component = {
  touchTargetMin: SharedDimens.component.touchTargetMin,
  buttonHeight: {
    sm: 36,
    md: SharedDimens.component.touchTargetMin,
    lg: 52,
  },
  inputHeight: {
    sm: 40,
    md: SharedDimens.component.touchTargetMin,
    lg: 56,
  },
} as const;

/**
 * Layout Constants
 * Adapter from shared Dimens.layout to React Native numeric values
 */
export const layout = {
  containerMaxWidth: 600, // Max content width for comfortable reading
  sectionSpacing: SharedDimens.layout.verticalRhythm.section, // Vertical rhythm between sections (32-48px)
  sectionSpacingLarge: 48,
  contentPadding: SharedDimens.component.pageGutter, // Standard content padding
  contentPaddingLarge: 20,
} as const;
