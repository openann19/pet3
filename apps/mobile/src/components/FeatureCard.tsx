import { colors } from '../theme/colors'
import { Typography, Dimens } from '@petspark/shared';
import { elevation } from '../theme/tokens';

const { spacing, radius } = Dimens;
const { scale: typography } = Typography;
import React, { memo, useMemo } from 'react'
import type { ReactNode } from 'react'
import { StyleSheet, Text, View } from 'react-native'

interface FeatureCardProps {
  title: string
  subtitle?: string
  children?: ReactNode
}

export const FeatureCard = memo(({ title, subtitle, children }: FeatureCardProps): React.JSX.Element => {
  const accessibilityLabel = useMemo(
    () => (subtitle !== null && subtitle !== undefined && subtitle !== '' ? `${title}, ${subtitle}` : title),
    [title, subtitle]
  )

  return (
    <View
      style={styles.container}
      accessible={true}
      accessibilityRole="article"
      accessibilityLabel={accessibilityLabel}
    >
      <Text
        style={styles.title}
        accessible={true}
        accessibilityRole="text"
      >
        {title}
      </Text>
      {subtitle !== null && subtitle !== undefined && subtitle !== '' ? (
        <Text
          style={styles.subtitle}
          accessible={true}
          accessibilityRole="text"
        >
          {subtitle}
        </Text>
      ) : null}
      {children !== null && children !== undefined ? (
        <View
          style={styles.content}
          accessible={false}
        >
          {children}
        </View>
      ) : null}
    </View>
  )
})

FeatureCard.displayName = 'FeatureCard'

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: StyleSheet.hairlineWidth ?? 0.5,
    borderColor: colors.border,
    ...elevation.raised,
  },
  title: {
    fontSize: typography.h3.fontSize,
    fontWeight: typography.h3.fontWeight,
    lineHeight: typography.h3.lineHeight,
    color: colors.textPrimary,
  },
  subtitle: {
    marginTop: spacing.xs,
    fontSize: typography.bodySmall.fontSize,
    lineHeight: typography.bodySmall.lineHeight,
    color: colors.textSecondary,
  },
  content: {
    marginTop: spacing.md,
    gap: spacing.md,
  },
})
