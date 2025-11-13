'use client'

import React, { type ReactNode } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import type { ComponentProps } from 'react'
import { colors } from '@mobile/theme/colors'
import { Typography, Dimens } from '@petspark/shared';
import { elevation } from '@mobile/theme/tokens';

const { spacing, radius } = Dimens;
const { scale: typography } = Typography;

export interface CardProps extends ComponentProps<typeof View> {
  children?: ReactNode
}

export function Card({ children, style, ...props }: CardProps): React.JSX.Element {
  return (
    <View
      style={[styles.card, style]}
      accessible={false}
      {...props}
    >
      {children}
    </View>
  )
}

export interface CardHeaderProps extends ComponentProps<typeof View> {
  children?: ReactNode
}

export function CardHeader({ children, style, ...props }: CardHeaderProps): React.JSX.Element {
  return (
    <View style={[styles.cardHeader, style]} {...props}>
      {children}
    </View>
  )
}

export interface CardTitleProps extends ComponentProps<typeof Text> {
  children?: ReactNode
}

export function CardTitle({ children, style, ...props }: CardTitleProps): React.JSX.Element {
  return (
    <Text
      style={[styles.cardTitle, style]}
      accessible
      accessibilityRole="header"
      {...props}
    >
      {children}
    </Text>
  )
}

export interface CardDescriptionProps extends ComponentProps<typeof Text> {
  children?: ReactNode
}

export function CardDescription({
  children,
  style,
  ...props
}: CardDescriptionProps): React.JSX.Element {
  return (
    <Text style={[styles.cardDescription, style]} {...props}>
      {children}
    </Text>
  )
}

export interface CardContentProps extends ComponentProps<typeof View> {
  children?: ReactNode
}

export function CardContent({ children, style, ...props }: CardContentProps): React.JSX.Element {
  return (
    <View style={[styles.cardContent, style]} {...props}>
      {children}
    </View>
  )
}

export interface CardFooterProps extends ComponentProps<typeof View> {
  children?: ReactNode
}

export function CardFooter({ children, style, ...props }: CardFooterProps): React.JSX.Element {
  return (
    <View style={[styles.cardFooter, style]} {...props}>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...elevation.raised,
    padding: 0,
    gap: spacing.xl,
  },
  cardHeader: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: 0,
    gap: spacing.sm,
  },
  cardTitle: {
    fontSize: typography.h3.fontSize,
    fontWeight: typography.h3.fontWeight,
    lineHeight: typography.h3.lineHeight,
    color: colors.textPrimary,
  },
  cardDescription: {
    fontSize: typography.bodySmall.fontSize,
    lineHeight: typography.bodySmall.lineHeight,
    color: colors.textSecondary,
  },
  cardContent: {
    paddingHorizontal: spacing.xl,
    paddingVertical: 0,
  },
  cardFooter: {
    paddingHorizontal: spacing.xl,
    paddingTop: 0,
    paddingBottom: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
  },
})
