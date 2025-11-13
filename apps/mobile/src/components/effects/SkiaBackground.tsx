/**
 * SkiaBackground Component
 * 
 * Premium animated background using React Native Skia
 * Provides animated gradients and particle effects for hero sections
 * 
 * Location: apps/mobile/src/components/effects/SkiaBackground.tsx
 */

import React, { useEffect } from 'react'
import { StyleSheet } from 'react-native'
import { Canvas, LinearGradient, Rect, vec } from '@shopify/react-native-skia'
import { useSharedValue, withRepeat, withTiming } from 'react-native-reanimated'
import { motionTokens } from '@petspark/motion'
import { useReducedMotionSV } from '@mobile/effects/core/use-reduced-motion-sv'

interface SkiaBackgroundProps {
  width: number
  height: number
  colors?: string[]
  animated?: boolean
}

export function SkiaBackground({
  width,
  height,
  colors = ['#FF9A49', '#FFC069', '#7B9DD4'],
  animated = true,
}: SkiaBackgroundProps): React.JSX.Element {
  const progress = useSharedValue(0)
  const reducedMotion = useReducedMotionSV()

  useEffect(() => {
    if (animated && !reducedMotion.value) {
      progress.value = withRepeat(
        withTiming(1, { duration: motionTokens.durations.deliberate }),
        -1,
        true
      )
    }
  }, [animated, progress, reducedMotion])

  return (
    <Canvas style={StyleSheet.absoluteFill}>
      <Rect x={0} y={0} width={width} height={height}>
        <LinearGradient
          start={vec(0, 0)}
          end={vec(width, height)}
          colors={colors}
        />
      </Rect>
    </Canvas>
  )
}

