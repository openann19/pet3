'use client'

import React from 'react'
import { View, Text, StyleSheet, type ViewStyle, type TextStyle } from 'react-native'
import type { ComponentProps } from 'react'
import { colors } from '@mobile/theme/colors'
import { Typography, Dimens } from '@petspark/shared';

export type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline'

export interface BadgeVariantProps {
  variant?: BadgeVariant
}

export interface BadgeProps extends ComponentProps<typeof View> {
  variant?: BadgeVariant
  children?: React.ReactNode
}

const badgeVariants: Record<BadgeVariant, { container: ViewStyle; text: TextStyle }> = {
  default: {
    container: {
      backgroundColor: colors.accent,
      borderColor: 'transparent',
    },
    text: {
      color: colors.textPrimary,
    },
  },
  secondary: {
    container: {
      backgroundColor: colors.surface,
      borderColor: 'transparent',
    },
    text: {
      color: colors.textSecondary,
    },
  },
  destructive: {
    container: {
      backgroundColor: colors.danger,
      borderColor: 'transparent',
    },
    text: {
      color: colors.card,
    },
  },
  outline: {
    container: {
      backgroundColor: 'transparent',
      borderColor: colors.border,
    },
    text: {
      color: colors.textPrimary,
    },
  },
}

export function Badge({
  variant = 'default',
  children,
  style,
  ...props
}: BadgeProps): React.JSX.Element {
  const variantStyles = badgeVariants[variant]

  return (
    <View style={[styles.container, variantStyles.container, style]} {...props}>
      <Text style={[styles.text, variantStyles.text]}>{children}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  borderRadius: Dimens.radius.sm,
  borderWidth: 1,
  paddingHorizontal: Dimens.spacing.sm,
  paddingVertical: Dimens.spacing.xs,
    alignSelf: 'flex-start',
  },
  text: {
  fontSize: Typography.scale.caption.fontSize,
  fontWeight: Typography.scale.h3.fontWeight,
  lineHeight: Typography.scale.caption.lineHeight,
  },
})
