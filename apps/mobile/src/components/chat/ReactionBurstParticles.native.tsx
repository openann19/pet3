/**
 * Reaction Burst Particles — Mobile (Reanimated v3, UI-thread)
 * - Ring emission with subtle jitter
 * - Deterministic phases via seeded RNG
 * - Reduced motion → fast micro-pop (≤120ms)
 * 
 * Location: apps/mobile/src/components/chat/ReactionBurstParticles.native.tsx
 */

import React, { useCallback, useEffect, useMemo } from 'react'
import { View, StyleSheet } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  Easing,
  runOnJS,
  type SharedValue,
  makeMutable,
} from 'react-native-reanimated'
import { useReducedMotion, getReducedMotionDuration } from '@/effects/chat/core/reduced-motion'
import { createSeededRNG } from '@/effects/chat/core/seeded-rng'
import { isTruthy } from '@petspark/shared'

export interface ReactionBurstParticlesProps {
  enabled?: boolean
  onComplete?: () => void
  count?: number
  radius?: number
  seed?: number | string
  color?: string
  size?: number
  staggerMs?: number
}

interface Particle {
  id: string
  progress: SharedValue<number>
  scale: SharedValue<number>
  opacity: SharedValue<number>
  tx: number
  ty: number
  delay: number
}

// Maximum particle count for pre-allocation
const MAX_PARTICLES = 50

export function ReactionBurstParticles({
  enabled = true,
  onComplete,
  count = 18,
  radius = 48,
  seed = 'reaction-burst',
  color = '#3B82F6',
  size = 6,
  staggerMs = 8,
}: ReactionBurstParticlesProps): React.ReactElement {
  const reduced = useReducedMotion()
  const dur = getReducedMotionDuration(600, reduced)
  const finished = useSharedValue(0)
  const notifyComplete = useCallback(() => {
    onComplete?.()
  }, [onComplete])

  // Pre-allocate all SharedValues at top level (hooks must be called unconditionally)
  const progressValues = useMemo(
    () => Array.from({ length: MAX_PARTICLES }, () => makeMutable(0)),
    []
  )
  const scaleValues = useMemo(
    () => Array.from({ length: MAX_PARTICLES }, () => makeMutable(0.7)),
    []
  )
  const opacityValues = useMemo(
    () => Array.from({ length: MAX_PARTICLES }, () => makeMutable(0)),
    []
  )

  // Create particle metadata (without SharedValues) in useMemo
  const particles = useMemo<Particle[]>(() => {
    const rng = createSeededRNG(seed)
    const actualCount = Math.min(count, MAX_PARTICLES)

    return Array.from({ length: actualCount }, (_, i) => {
      const base = (i / actualCount) * Math.PI * 2 + rng.range(-0.08, 0.08)
      const tx = Math.cos(base) * radius * rng.range(0.9, 1.05)
      const ty = Math.sin(base) * radius * rng.range(0.9, 1.05)

      return {
        id: `${seed}-${i}`,
        progress: progressValues[i]!,
        scale: scaleValues[i]!,
        opacity: opacityValues[i]!,
        tx,
        ty,
        delay: i * staggerMs,
      }
    })
  }, [count, radius, seed, staggerMs, progressValues, scaleValues, opacityValues])

  useEffect(() => {
    if (!enabled) return

    finished.value = 0

    const total = particles.length

    for (const particle of particles) {
      if (isTruthy(reduced)) {
        particle.opacity.value = withTiming(1, { duration: 0 })
        particle.scale.value = withTiming(1, { duration: 0 })
        particle.progress.value = withTiming(1, { duration: getReducedMotionDuration(120, true) }, () => {
          finished.value += 1
          if (finished.value === total) {
            runOnJS(notifyComplete)()
          }
        })
        continue
      }

      particle.opacity.value = withDelay(particle.delay, withTiming(1, { duration: Math.max(80, dur * 0.25) }))
      particle.scale.value = withDelay(particle.delay, withSpring(1, { stiffness: 220, damping: 22 }))
      particle.progress.value = withDelay(
        particle.delay,
        withTiming(1, { duration: dur, easing: Easing.out(Easing.cubic) }, () => {
          particle.opacity.value = withTiming(0, { duration: Math.max(100, dur * 0.35) }, () => {
            finished.value += 1
            if (finished.value === total) {
              runOnJS(notifyComplete)()
            }
          })
        })
      )
    }
  }, [enabled, particles, dur, reduced, finished, notifyComplete])

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {particles.map((particle) => (
        <ReactionParticle key={particle.id} particle={particle} color={color} size={size} />
      ))}
    </View>
  )
}

interface ReactionParticleProps {
  particle: Particle
  color: string
  size: number
}

const ReactionParticle = React.memo(({ particle, color, size }: ReactionParticleProps) => {
  const style = useAnimatedStyle(() => ({
    position: 'absolute',
    left: '50%',
    top: '50%',
    transform: [
      { translateX: particle.progress.value * particle.tx },
      { translateY: particle.progress.value * particle.ty },
      { scale: particle.scale.value },
    ],
    opacity: particle.opacity.value,
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: color,
  }))

  return <Animated.View style={style} />
})

ReactionParticle.displayName = 'ReactionParticle'

