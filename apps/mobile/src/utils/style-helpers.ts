/**
 * Style Helpers for Mobile
 * 
 * Helper functions for common style patterns using design tokens.
 * Ensures consistency across all components and screens.
 * 
 * Location: apps/mobile/src/utils/style-helpers.ts
 */

import { StyleSheet, type ViewStyle, type TextStyle } from 'react-native'
import { spacing, radius, elevation, component, typography } from '@mobile/theme/tokens'
import { colors } from '@mobile/theme/colors'

/**
 * Create a card style using design tokens
 */
export function createCardStyle(overrides?: Partial<ViewStyle>): ViewStyle {
  return {
    padding: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    ...elevation.raised,
    ...overrides,
  }
}

/**
 * Create a button style using design tokens
 */
export function createButtonStyle(
  variant: 'primary' | 'secondary' | 'ghost' | 'destructive' = 'primary',
  size: 'sm' | 'md' | 'lg' = 'md',
  overrides?: Partial<ViewStyle>
): ViewStyle {
  const baseStyle: ViewStyle = {
    minHeight: component.buttonHeight[size],
    minWidth: component.touchTargetMin,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  }

  switch (variant) {
    case 'primary':
      return {
        ...baseStyle,
        backgroundColor: colors.primary,
        ...overrides,
      }
    case 'secondary':
      return {
        ...baseStyle,
        backgroundColor: colors.secondary,
        ...overrides,
      }
    case 'ghost':
      return {
        ...baseStyle,
        backgroundColor: 'transparent',
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.border,
        ...overrides,
      }
    case 'destructive':
      return {
        ...baseStyle,
        backgroundColor: colors.danger,
        ...overrides,
      }
    default:
      return { ...baseStyle, ...overrides }
  }
}

/**
 * Create a text style using typography tokens
 */
export function createTextStyle(
  variant: 'display' | 'h1' | 'h2' | 'h3' | 'body' | 'bodySm' | 'caption' = 'body',
  overrides?: Partial<TextStyle>
): TextStyle {
  const baseStyle = typography[variant]
  return {
    ...baseStyle,
    color: colors.textPrimary,
    ...overrides,
  }
}

/**
 * Create a container style with max width and padding
 */
export function createContainerStyle(overrides?: Partial<ViewStyle>): ViewStyle {
  return {
    maxWidth: 600, // layout.containerMaxWidth equivalent
    width: '100%',
    paddingHorizontal: spacing.lg,
    ...overrides,
  }
}

/**
 * Create a section spacing style
 */
export function createSectionSpacing(multiplier: number = 1): ViewStyle {
  return {
    marginVertical: spacing.lg * multiplier,
  }
}

/**
 * Ensure touch target meets minimum size
 */
export function ensureTouchTarget(
  style: ViewStyle,
  minSize: number = component.touchTargetMin
): ViewStyle {
  return {
    ...style,
    minHeight: Math.max(style.minHeight as number ?? 0, minSize),
    minWidth: Math.max(style.minWidth as number ?? 0, minSize),
  }
}

