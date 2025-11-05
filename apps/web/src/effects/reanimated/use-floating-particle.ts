'use client'

import { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming } from 'react-native-reanimated'
import { useEffect } from 'react'
import { timingConfigs } from '@/effects/reanimated/transitions'
import type { AnimatedStyle } from '@/effects/reanimated/animated-view'

export interface UseFloatingParticleOptions {
  initialX?: number
  initialY?: number
  width?: number
  height?: number
  duration?: number
  delay?: number
  opacity?: number
}

export interface UseFloatingParticleReturn {
  x: ReturnType<typeof useSharedValue<number>>
  y: ReturnType<typeof useSharedValue<number>>
  opacity: ReturnType<typeof useSharedValue<number>>
  scale: ReturnType<typeof useSharedValue<number>>
  style: AnimatedStyle
}

export function useFloatingParticle(
  options: UseFloatingParticleOptions = {}
): UseFloatingParticleReturn {
  const {
    initialX = 0,
    initialY = 0,
    width = 1920,
    height = 1080,
    duration = 15,
    opacity = 0.6
  } = options

  const x = useSharedValue(initialX)
  const y = useSharedValue(initialY)
  const opacityValue = useSharedValue(0)
  const scale = useSharedValue(0.5)

  useEffect(() => {
    const randomX1 = Math.random() * width
    const randomX2 = Math.random() * width
    const randomX3 = Math.random() * width
    const randomY1 = Math.random() * height
    const randomY2 = Math.random() * height
    const randomY3 = Math.random() * height

    x.value = withRepeat(
      withSequence(
        withTiming(randomX1, timingConfigs.smooth),
        withTiming(randomX2, timingConfigs.smooth),
        withTiming(randomX3, timingConfigs.smooth),
        withTiming(randomX1, timingConfigs.smooth)
      ),
      -1,
      false
    )

    y.value = withRepeat(
      withSequence(
        withTiming(randomY1, timingConfigs.smooth),
        withTiming(randomY2, timingConfigs.smooth),
        withTiming(randomY3, timingConfigs.smooth),
        withTiming(randomY1, timingConfigs.smooth)
      ),
      -1,
      false
    )

    opacityValue.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 0 }),
        withTiming(opacity, { duration: duration * 0.2 }),
        withTiming(opacity * 0.5, { duration: duration * 0.2 }),
        withTiming(opacity, { duration: duration * 0.2 }),
        withTiming(0, { duration: duration * 0.4 })
      ),
      -1,
      false
    )

    scale.value = withRepeat(
      withSequence(
        withTiming(0.5, { duration: duration * 0.2 }),
        withTiming(1, { duration: duration * 0.2 }),
        withTiming(0.8, { duration: duration * 0.2 }),
        withTiming(1, { duration: duration * 0.2 }),
        withTiming(0.5, { duration: duration * 0.2 })
      ),
      -1,
      false
    )
  }, [width, height, duration, opacity, x, y, opacityValue, scale])

  const style = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: x.value },
        { translateY: y.value },
        { scale: scale.value }
      ],
      opacity: opacityValue.value
    }
  }) as AnimatedStyle

  return {
    x,
    y,
    opacity: opacityValue,
    scale,
    style
  }
}

