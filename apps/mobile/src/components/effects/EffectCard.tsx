/**
 * Effect Card Component
 * 
 * Reusable card for displaying effect demos in the playground.
 * 
 * Location: apps/mobile/src/components/effects/EffectCard.tsx
 */

import React, { memo, type ReactNode } from 'react'
import { View, StyleSheet } from 'react-native'
import { FeatureCard } from '@mobile/components/FeatureCard'
import { colors } from '@mobile/theme/colors'
import { spacing, radius } from '@mobile/theme/tokens'

export interface EffectCardProps {
  title: string
  subtitle: string
  children: ReactNode
}

export const EffectCard = memo(({ title, subtitle, children }: EffectCardProps): React.ReactElement => {
  return (
    <FeatureCard title={title} subtitle={subtitle}>
      <View style={styles.canvasContainer}>{children}</View>
    </FeatureCard>
  )
})

EffectCard.displayName = 'EffectCard'

const styles = StyleSheet.create({
  canvasContainer: {
    marginTop: spacing.md,
  },
})

