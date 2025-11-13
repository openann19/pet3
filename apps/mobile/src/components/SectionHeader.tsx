import { colors } from '@mobile/theme/colors'
import { Typography, Dimens } from '@petspark/shared';

const { spacing } = Dimens;
const { scale: typography } = Typography;
import React, { memo, useMemo } from 'react'
import { StyleSheet, Text, View } from 'react-native'

interface SectionHeaderProps {
  title: string
  description?: string
}

export const SectionHeader = memo(({ title, description }: SectionHeaderProps): React.JSX.Element => {
  const accessibilityLabel = useMemo(
    () => (description !== null && description !== undefined && description !== '' ? `${title}, ${description}` : title),
    [title, description]
  )

  return (
    <View
      style={styles.container}
      accessible={true}
      accessibilityRole="header"
      accessibilityLabel={accessibilityLabel}
    >
      <Text
        style={styles.title}
        accessible={true}
        accessibilityRole="header"
        accessibilityLevel={2}
      >
        {title}
      </Text>
      {description !== null && description !== undefined && description !== '' ? (
        <Text
          style={styles.description}
          accessible={true}
          accessibilityRole="text"
        >
          {description}
        </Text>
      ) : null}
    </View>
  )
})

SectionHeader.displayName = 'SectionHeader'

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.h2.fontSize,
    fontWeight: typography.h2.fontWeight,
    lineHeight: typography.h2.lineHeight,
    color: colors.textPrimary,
  },
  description: {
    fontSize: typography.bodySmall.fontSize,
    lineHeight: typography.bodySmall.lineHeight,
    color: colors.textSecondary,
  },
})
