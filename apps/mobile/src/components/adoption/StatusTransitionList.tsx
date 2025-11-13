/**
 * StatusTransitionList Component
 * Displays a list of status transitions with allowed/blocked states
 * Location: apps/mobile/src/components/adoption/StatusTransitionList.tsx
 */

import React, { memo } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { FeatureCard } from '@mobile/components/FeatureCard'
import { colors } from '@mobile/theme/colors'
import { typography, spacing } from '@mobile/theme/tokens'

interface StatusTransition {
  status: string
  allowed: boolean
}

interface StatusTransitionListProps {
  title: string
  transitions: StatusTransition[]
}

const TransitionRow = memo(
  ({ status, allowed }: { status: string; allowed: boolean }): React.ReactElement => {
    return (
      <View
        style={styles.row}
        accessible={true}
        accessibilityRole="summary"
        accessibilityLabel={`${status}: ${allowed ? 'permitted' : 'blocked'}`}
      >
        <Text style={styles.label}>{status}</Text>
        <Text style={[styles.value, allowed ? styles.success : styles.blocked]}>
          {allowed ? 'permitted' : 'blocked'}
        </Text>
      </View>
    )
  }
)

TransitionRow.displayName = 'TransitionRow'

export const StatusTransitionList = memo(
  ({ title, transitions }: StatusTransitionListProps): React.ReactElement => {
    return (
      <FeatureCard title={title}>
        {transitions.map((item) => (
          <TransitionRow key={item.status} status={item.status} allowed={item.allowed} />
        ))}
      </FeatureCard>
    )
  }
)

StatusTransitionList.displayName = 'StatusTransitionList'

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  label: {
    color: colors.textPrimary,
    fontWeight: typography.h3.fontWeight,
    fontSize: typography.bodySm.fontSize,
    lineHeight: typography.bodySm.lineHeight,
  },
  value: {
    textTransform: 'uppercase',
    fontSize: typography.caption.fontSize,
    lineHeight: typography.caption.lineHeight,
  },
  success: {
    color: colors.success,
    fontSize: typography.caption.fontSize,
    lineHeight: typography.caption.lineHeight,
  },
  blocked: {
    color: colors.danger,
    fontSize: typography.caption.fontSize,
    lineHeight: typography.caption.lineHeight,
  },
})

