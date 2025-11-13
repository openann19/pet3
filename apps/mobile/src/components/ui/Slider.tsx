/**
 * Mobile Slider Component
 * 
 * Accessible, token-aligned slider component with haptic feedback.
 * Supports reduced motion preferences and meets WCAG touch target requirements.
 * 
 * Location: apps/mobile/src/components/ui/Slider.tsx
 */

import React, { useState, useCallback, useMemo, useRef } from 'react'
import {
  View,
  StyleSheet,
  PanResponder,
  Dimensions,
  type StyleProp,
  type ViewStyle,
} from 'react-native'
import Animated, { useSharedValue, useAnimatedStyle, runOnJS, withTiming } from 'react-native-reanimated'
import { useReducedMotionSV } from '@/effects/core/use-reduced-motion-sv'
import * as Haptics from 'expo-haptics'
import { colors } from '@mobile/theme/colors'
import { spacing, component, elevation, motion, radius } from '@mobile/theme/tokens'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

// Track height from design tokens (4px = spacing.xs)
const TRACK_HEIGHT = spacing.xs
// Thumb size to meet 44px touch target minimum
const THUMB_SIZE = component.touchTargetMin
// Container padding uses spacing tokens
const CONTAINER_PADDING = spacing.xl * 2 // Total horizontal padding

export interface SliderProps {
  min?: number
  max?: number
  value?: number
  onValueChange?: (value: number) => void
  step?: number
  disabled?: boolean
  style?: StyleProp<ViewStyle>
  accessibilityLabel?: string
  accessibilityHint?: string
  testID?: string
}

export function Slider({
  min = 0,
  max = 100,
  value: externalValue,
  onValueChange,
  step = 1,
  disabled = false,
  style,
  accessibilityLabel,
  accessibilityHint,
  testID = 'slider',
}: SliderProps): React.JSX.Element {
  const [internalValue, setInternalValue] = useState((min + max) / 2)
  const reduced = useReducedMotionSV()
  const containerRef = useRef<View>(null)
  const [trackLayout, setTrackLayout] = useState({ width: 0, x: 0 })

  const value = externalValue ?? internalValue
  const percentage = useMemo(() => {
    const clamped = Math.max(min, Math.min(max, value))
    return ((clamped - min) / (max - min)) * 100
  }, [value, min, max])

  const thumbPosition = useSharedValue(percentage)
  const isDragging = useSharedValue(false)

  // Update thumb position when value changes externally
  // Note: isDragging and thumbPosition are Reanimated SharedValues (useSharedValue)
  // SharedValues are stable references and should not be in dependency arrays.
  // The check for isDragging.value happens synchronously inside the effect.
  React.useEffect(() => {
    // Check if dragging using a worklet-safe approach
    const currentDragging = isDragging.value
    if (!currentDragging) {
      thumbPosition.value = reduced
        ? percentage
        : withTiming(percentage, { duration: motion.normal })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- isDragging and thumbPosition are Reanimated SharedValues (stable refs)
  }, [percentage, reduced])

  const handleValueChange = useCallback(
    (newValue: number) => {
      const clamped = Math.max(min, Math.min(max, newValue))
      const stepped = Math.round(clamped / step) * step

      if (externalValue === undefined) {
        setInternalValue(stepped)
      }
      onValueChange?.(stepped)

      if (!reduced) {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {
          // Haptics may not be available
        })
      }
    },
    [min, max, step, externalValue, onValueChange, reduced]
  )

  const handleLayout = useCallback((event: { nativeEvent: { layout: { width: number; x: number } } }) => {
    const { width, x } = event.nativeEvent.layout
    setTrackLayout({ width, x })
  }, [])

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !disabled,
        onMoveShouldSetPanResponder: () => !disabled,
        onPanResponderGrant: () => {
          isDragging.value = true
        },
        onPanResponderMove: (_, gesture) => {
          const trackWidth = trackLayout.width || SCREEN_WIDTH - CONTAINER_PADDING
          const relativeX = gesture.moveX - trackLayout.x
          const clampedX = Math.max(0, Math.min(trackWidth, relativeX))
          const newPercentage = (clampedX / trackWidth) * 100
          const newValue = min + (newPercentage / 100) * (max - min)

          thumbPosition.value = newPercentage
          runOnJS(handleValueChange)(newValue)
        },
        onPanResponderRelease: () => {
          isDragging.value = false
        },
        onPanResponderTerminate: () => {
          isDragging.value = false
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- isDragging and thumbPosition are Reanimated SharedValues (stable refs), should not be in deps
    [disabled, trackLayout, min, max, handleValueChange]
  )

  const animatedThumbStyle = useAnimatedStyle(() => {
    const scale = reduced ? 1 : isDragging.value ? 1.15 : 1
    return {
      left: `${thumbPosition.value}%`,
      transform: [{ scale }],
    }
  })

  const animatedTrackStyle = useAnimatedStyle(() => {
    const width = thumbPosition.value ?? 0
    return {
      width: `${width}%`,
    }
  })

  // Accessibility label
  const defaultLabel = useMemo(() => {
    return accessibilityLabel ?? `Slider, value ${Math.round(value)} of ${max}`
  }, [accessibilityLabel, value, max])

  return (
    <View
      ref={containerRef}
      style={[styles.container, style]}
      accessible={true}
      accessibilityRole="adjustable"
      accessibilityLabel={defaultLabel}
      accessibilityHint={accessibilityHint ?? 'Double tap and hold to adjust value'}
      accessibilityValue={{
        min,
        max,
        now: Math.round(value),
      }}
      accessibilityState={{ disabled }}
      testID={testID}
    >
      <View
        style={styles.track}
        onLayout={handleLayout}
        accessible={false}
        importantForAccessibility="no"
      >
        <Animated.View style={[styles.trackFill, animatedTrackStyle]} />
      </View>
      <Animated.View
        style={[styles.thumb, animatedThumbStyle]}
        {...panResponder.panHandlers}
        accessible={false}
        importantForAccessibility="no"
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    height: component.touchTargetMin,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    minHeight: component.touchTargetMin,
  },
  track: {
    height: TRACK_HEIGHT,
    backgroundColor: colors.border,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  trackFill: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: radius.sm,
  },
  thumb: {
    position: 'absolute',
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: radius.full,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.accent,
    ...elevation.raised,
    // Center thumb on track (thumb size - track height) / 2
    top: (component.touchTargetMin - TRACK_HEIGHT) / 2 - THUMB_SIZE / 2,
    // Offset by half thumb width to center on track
    marginLeft: -THUMB_SIZE / 2,
  },
})
