/**
 * Segment Button Component
 * 
 * Reusable button for tab/segment selection in feed screen.
 * 
 * Location: apps/mobile/src/components/feed/SegmentButton.tsx
 */

import React, { memo } from 'react'
import { Pressable, Text, StyleSheet } from 'react-native'
import { colors } from '@mobile/theme/colors'
import { typography, spacing, component, radius } from '@mobile/theme/tokens'

export interface SegmentButtonProps {
  label: string
  selected: boolean
  onPress: () => void
}

export const SegmentButton = memo(({ label, selected, onPress }: SegmentButtonProps): React.ReactElement => {
  return (
    <Pressable
      onPress={onPress}
      accessible={true}
      accessibilityRole="tab"
      accessibilityState={{ selected }}
      accessibilityLabel={`${label} tab`}
      accessibilityHint={selected ? `Currently viewing ${label}` : `Switch to ${label} view`}
      style={({ pressed }: { pressed: boolean }) => [
        styles.segmentButton,
        selected && styles.segmentButtonActive,
        pressed && styles.segmentButtonPressed,
      ]}
    >
      <Text
        style={[styles.segmentLabel, selected && styles.segmentLabelActive]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  )
})

SegmentButton.displayName = 'SegmentButton'

const styles = StyleSheet.create({
  segmentButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: component.touchTargetMin,
    zIndex: 1,
  },
  segmentButtonActive: {
    // Active state handled by indicator
  },
  segmentButtonPressed: {
    opacity: 0.7,
  },
  segmentLabel: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontWeight: typography.h3.fontWeight,
    fontSize: typography.bodySm.fontSize,
    lineHeight: typography.bodySm.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  segmentLabelActive: {
    color: colors.textPrimary,
  },
})

