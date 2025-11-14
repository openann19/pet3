/**
 * SegmentControl Component
 * Tab switching UI for Feed screen
 * Location: apps/mobile/src/components/feed/SegmentControl.tsx
 */

import React, { memo, useCallback } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { colors } from '@mobile/theme/colors'
import { typography, spacing, radius, component, motion } from '@mobile/theme/tokens'

type Tab = 'discovery' | 'map'

interface SegmentControlProps {
  selectedTab: Tab
  onTabChange: (tab: Tab) => void
}

interface SegmentBtnProps {
  label: string
  selected: boolean
  onPress: () => void
}

const SegmentBtn = memo(({ label, selected, onPress }: SegmentBtnProps): React.ReactElement => {
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

SegmentBtn.displayName = 'SegmentBtn'

export function SegmentControl({ selectedTab, onTabChange }: SegmentControlProps): React.ReactElement {
  const x = useSharedValue(selectedTab === 'discovery' ? 0 : 1)

  const handleTabChange = useCallback(
    (next: Tab): void => {
      if (next === selectedTab) return
      try {
        void Haptics.selectionAsync()
      } catch {
        // Haptics may not be available
      }
      onTabChange(next)
      x.value = withTiming(next === 'discovery' ? 0 : 1, { duration: motion.normal })
    },
    [selectedTab, onTabChange, x]
  )

  const indicator = useAnimatedStyle(() => {
    const translateX = x.value * 100
    return {
      transform: [{ translateX }],
    }
  })

  return (
    <View style={styles.segment} accessibilityRole="tablist">
      <View style={styles.segmentTrack}>
        <Animated.View style={[styles.segmentIndicator, indicator]} />
        <SegmentBtn
          label="Discover"
          selected={selectedTab === 'discovery'}
          onPress={() => {
            handleTabChange('discovery')
          }}
        />
        <SegmentBtn
          label="Map"
          selected={selectedTab === 'map'}
          onPress={() => {
            handleTabChange('map')
          }}
        />
      </View>
    </View>
  )
}

SegmentControl.displayName = 'SegmentControl'

const styles = StyleSheet.create({
  segment: { paddingHorizontal: spacing.lg, marginBottom: spacing.sm },
  segmentTrack: {
    height: component.buttonHeight.md,
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'space-between',
    flexDirection: 'row',
    paddingHorizontal: spacing.sm,
    overflow: 'hidden',
  },
  segmentIndicator: {
    position: 'absolute',
    height: component.buttonHeight.md - spacing.xs,
    width: '50%',
    left: spacing.xs / 2,
    top: spacing.xs / 2,
    borderRadius: radius.full,
    backgroundColor: colors.card,
  },
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
    opacity: 0.7, // Standard pressed state opacity
  },
  segmentLabel: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontWeight: typography.h3.fontWeight,
    fontSize: typography.bodySm.fontSize,
    lineHeight: typography.bodySm.lineHeight,
    textTransform: 'uppercase',
    letterSpacing: typography.bodySm.letterSpacing ?? 0.5, // Use token if available
  },
  segmentLabelActive: { color: colors.textPrimary },
})

