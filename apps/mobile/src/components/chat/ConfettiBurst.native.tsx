/**
 * Confetti Burst — Mobile (Reanimated v3)
 * - Physics-like: upward impulse + gravity + lateral drift + spin
 * - Deterministic seeding, reduced motion fast fallback
 * 
 * Location: apps/mobile/src/components/chat/ConfettiBurst.native.tsx
 */

import React, { useCallback, useEffect, useMemo } from 'react'
import { View, StyleSheet } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withRepeat,
  Easing,
  runOnJS,
  type SharedValue,
  makeMutable,
} from 'react-native-reanimated'
import { useReducedMotion, getReducedMotionDuration } from '@/effects/chat/core/reduced-motion'
import { createSeededRNG } from '@/effects/chat/core/seeded-rng'
import { isTruthy } from '@petspark/shared'

export interface ConfettiParticle {
  id: string
  x: SharedValue<number>
  y: SharedValue<number>
  r: SharedValue<number>
  s: SharedValue<number>
  o: SharedValue<number>
  color: string
  w: number
  h: number
  delay: number
  vx: number
}

export interface ConfettiBurstProps {
  enabled?: boolean
  particleCount?: number
  colors?: string[]
  duration?: number
  onComplete?: () => void
  seed?: number | string
}
// Maximum particle count for pre-allocation
const MAX_CONFETTI_PARTICLES = 100

export function ConfettiBurst({
  enabled = true,
  particleCount = 100,
  colors = ['#22c55e', '#3b82f6', '#eab308', '#ef4444', '#a855f7'],
  duration = 1400,
  onComplete,
  seed = 'confetti-burst',
}: ConfettiBurstProps): React.ReactElement {
  const reduced = useReducedMotion()
  const dur = getReducedMotionDuration(duration, reduced)
  const finished = useSharedValue(0)
  const notifyComplete = useCallback(() => {
    onComplete?.()
  }, [onComplete])

  // Pre-allocate all SharedValues at top level (hooks must be called unconditionally)
  const xValues = useMemo(
    () => Array.from({ length: MAX_CONFETTI_PARTICLES }, () => makeMutable(0)),
    []
  )
  const yValues = useMemo(
    () => Array.from({ length: MAX_CONFETTI_PARTICLES }, () => makeMutable(0)),
    []
  )
  const rValues = useMemo(
    () => Array.from({ length: MAX_CONFETTI_PARTICLES }, () => makeMutable(0)),
    []
  )
  const sValues = useMemo(
    () => Array.from({ length: MAX_CONFETTI_PARTICLES }, () => makeMutable(1)),
    []
  )
  const oValues = useMemo(
    () => Array.from({ length: MAX_CONFETTI_PARTICLES }, () => makeMutable(0)),
    []
  )

  // Create particle metadata (without SharedValues) in useMemo
  const particles = useMemo<ConfettiParticle[]>(() => {
    const rng = createSeededRNG(seed)
    const colorCount = Math.max(1, colors.length)
    const actualCount = Math.min(particleCount, MAX_CONFETTI_PARTICLES)

    return Array.from({ length: actualCount }, (_, i) => {
      const color = colors[Math.floor(rng.range(0, colorCount))] ?? colors[0] ?? '#ffffff'
      const w = Math.max(6, Math.floor(rng.range(6, 12)))
      const h = Math.max(6, Math.floor(rng.range(6, 12)))
      const delay = Math.floor(rng.range(0, reduced ? 0 : 400))
      const vx = rng.range(-30, 30)
      const scale = rng.range(0.85, 1.25)

      // Set initial scale value
      sValues[i]!.value = scale

      return {
        id: `${seed}-${i}`,
        x: xValues[i]!,
        y: yValues[i]!,
        r: rValues[i]!,
        s: sValues[i]!,
        o: oValues[i]!,
        color,
        w,
        h,
        delay,
        vx,
      }
    })
  }, [colors, particleCount, reduced, seed, xValues, yValues, rValues, sValues, oValues])

  useEffect(() => {
    if (!enabled) return

    finished.value = 0

    const total = particles.length

    for (const particle of particles) {
      if (isTruthy(reduced)) {
        particle.o.value = withTiming(1, { duration: 0 })
        particle.y.value = withTiming(40, { duration: getReducedMotionDuration(120, true) }, () => {
          particle.o.value = withTiming(0, { duration: 120 }, () => {
            finished.value += 1
            if (finished.value === total) {
              runOnJS(notifyComplete)()
            }
          })
        })
        continue
      }

      particle.o.value = withDelay(particle.delay, withTiming(1, { duration: 100 }))
      particle.x.value = withDelay(particle.delay, withTiming(particle.vx, { duration: dur }))
      particle.y.value = withDelay(
        particle.delay,
        withTiming(160, { duration: dur, easing: Easing.inOut(Easing.cubic) }, () => {
          particle.o.value = withTiming(0, { duration: 180 }, () => {
            finished.value += 1
            if (finished.value === total) {
              runOnJS(notifyComplete)()
            }
          })
        })
      )
      particle.r.value = withDelay(
        particle.delay,
        withRepeat(withTiming(360, { duration: Math.max(600, dur * 0.6), easing: Easing.linear }), -1, false)
      )
    }
  }, [enabled, particles, dur, reduced, finished, notifyComplete])

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {particles.map((particle) => (
        <ConfettiParticleView key={particle.id} particle={particle} />
      ))}
    </View>
  )
}

interface ConfettiParticleViewProps {
  particle: ConfettiParticle
}

const ConfettiParticleView = React.memo(({ particle }: ConfettiParticleViewProps) => {
  const style = useAnimatedStyle(() => ({
    position: 'absolute',
    left: '50%',
    top: '50%',
    opacity: particle.o.value,
    transform: [
      { translateX: particle.x.value },
      { translateY: particle.y.value },
      { rotate: `${String(particle.r.value ?? '')}deg` },
      { scale: particle.s.value },
    ],
    width: particle.w,
    height: particle.h,
    backgroundColor: particle.color,
    borderRadius: 2,
  }))

  return <Animated.View style={style} />
})

ConfettiParticleView.displayName = 'ConfettiParticleView'

