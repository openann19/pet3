/**
 * Liquid Dots Typing Indicator — Web
 * - Reanimated-driven sine chain (UI thread)
 * - Deterministic phases via seeded RNG
 * - Reduced motion: instant subtle pulse (≤120ms)
 * - Premium glow + slight blur (web-only)
 */

import { useEffect, useMemo } from 'react'
import { cancelAnimation, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated'
import { useReducedMotion, getReducedMotionDuration } from '@/effects/chat/core/reduced-motion'
import { createSeededRNG } from '@/effects/chat/core/seeded-rng'
import { View } from 'react-native'
import { AnimatedView } from '@/effects/reanimated/animated-view'
interface DotCfg {
  readonly phase: number
  readonly amplitude: number
}

export interface LiquidDotsProps {
  enabled?: boolean
  dotSize?: number
  dotColor?: string
  className?: string
  dots?: number
  seed?: number | string
}

export function LiquidDots({
  enabled = true,
  dotSize = 6,
  dotColor = '#6b7280', // slate-500
  className,
  dots = 3,
  seed = 'liquid-dots'
}: LiquidDotsProps) {
  const reduced = useReducedMotion()

  // shared clock loops 0..1
  const t = useSharedValue(0)
  const enabledShared = useSharedValue(enabled ? 1 : 0)
  const reducedShared = useSharedValue(reduced ? 1 : 0)
  const dur = getReducedMotionDuration(1200, reduced)
  // Looping timing; reduced motion short-circuits in styles below
  useEffect(() => {
    enabledShared.value = enabled ? 1 : 0
  }, [enabled, enabledShared])

  useEffect(() => {
    reducedShared.value = reduced ? 1 : 0
  }, [reduced, reducedShared])

  useEffect(() => {
    cancelAnimation(t)
    t.value = 0

    if (!enabled) {
      return () => {
        cancelAnimation(t)
        t.value = 0
      }
    }

    t.value = withRepeat(withTiming(1, { duration: dur }), -1, false)

    return () => {
      cancelAnimation(t)
      t.value = 0
    }
  }, [dur, enabled, t])

  // Build deterministic phases/amps
  const config = useMemo<DotCfg[]>(() => {
    const rng = createSeededRNG(seed)
    return Array.from({ length: dots }, () => ({
      phase: rng.range(0, Math.PI * 2),
      amplitude: rng.range(3, 7)
    }))
  }, [dots, seed])

  const omega = 2 * Math.PI

  return (
    <View
      accessibilityRole="status"
      aria-live="polite"
      className={`flex items-center gap-1 ${className ?? ''}`}
      style={{ flexDirection: 'row' }}
    >
      {config.map((dot, index) => {
        const animatedStyle = useAnimatedStyle(() => {
          const isEnabled = enabledShared.value === 1
          const isReduced = reducedShared.value === 1

          if (!isEnabled || isReduced) {
            return {
              width: dotSize,
              height: dotSize,
              borderRadius: dotSize / 2,
              backgroundColor: dotColor,
              filter: 'blur(0.4px)',
              boxShadow: `0 0 ${dotSize * 0.6}px ${dotColor}40`,
              transform: [{ translateY: 0 }],
              opacity: 1
            }
          }

          const tt = t.value
          const translateY = Math.sin(omega * tt + dot.phase + index * 0.5) * dot.amplitude
          const opacity = 0.6 + 0.4 * Math.sin(omega * tt + dot.phase + index * 0.5 + Math.PI / 3)

          return {
            width: dotSize,
            height: dotSize,
            borderRadius: dotSize / 2,
            backgroundColor: dotColor,
            filter: 'blur(0.4px)',
            boxShadow: `0 0 ${dotSize * 0.6}px ${dotColor}40`,
            transform: [{ translateY }],
            opacity
          }
        })

        return <AnimatedView key={`${dot.phase}-${index}`} style={animatedStyle} />
      })}
    </View>
  )
}
