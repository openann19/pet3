/**
 * Liquid Dots Typing Indicator — Web
 * - Reanimated-driven sine chain (UI thread)
 * - Deterministic phases via seeded RNG
 * - Reduced motion: instant subtle pulse (≤120ms)
 * - Premium glow + slight blur (web-only)
 */

import React, { useEffect, useMemo } from 'react'
import { motion, useMotionValue, animate, useTransform } from 'framer-motion'
import { useReducedMotion, getReducedMotionDuration } from '@/effects/chat/core/reduced-motion'
import { createSeededRNG } from '@/effects/chat/core/seeded-rng'

interface DotConfig {
  readonly phase: number
  readonly amplitude: number
}

export interface LiquidDotsProps {
  readonly enabled?: boolean
  readonly dotSize?: number
  readonly dotColor?: string
  readonly className?: string
  readonly dots?: number
  readonly seed?: number | string
}

export function LiquidDots({
  enabled = true,
  dotSize = 6,
  dotColor = '#6b7280',
  className,
  dots = 3,
  seed = 'liquid-dots'
}: LiquidDotsProps) {
  const reduced = useReducedMotion()
  const sharedTime = useMotionValue(0)
  const duration = getReducedMotionDuration(1200, reduced)

  useEffect(() => {
    sharedTime.set(0)

    if (!enabled || reduced) {
      return () => {
        sharedTime.set(0)
      }
    }

    void animate(sharedTime, 1, {
      duration: duration / 1000,
      ease: 'linear',
      repeat: Infinity,
      repeatType: 'loop',
    })

    return () => {
      sharedTime.set(0)
    }
  }, [duration, enabled, reduced, sharedTime])

  const dotConfigs = useMemo<DotConfig[]>(() => {
    const rng = createSeededRNG(seed)
    return Array.from({ length: dots }, () => ({
      phase: rng.range(0, Math.PI * 2),
      amplitude: rng.range(3, 7)
    }))
  }, [dots, seed])

  const omega = 2 * Math.PI

  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-center gap-1 ${className ?? ''}`}
      style={{ flexDirection: 'row' }}
    >
      {dotConfigs.map((dot, index) => {
        const translateY = useTransform(sharedTime, (time) => {
          if (reduced) return 0
          return Math.sin(omega * time + dot.phase + index * 0.5) * dot.amplitude
        })

        const opacity = useTransform(sharedTime, (time) => {
          if (reduced) return 1
          return 0.6 + 0.4 * Math.sin(omega * time + dot.phase + index * 0.5 + Math.PI / 3)
        })

        return (
          <motion.div
            key={`${dot.phase}-${index}`}
            style={{
              width: dotSize,
              height: dotSize,
              borderRadius: dotSize / 2,
              backgroundColor: dotColor,
              filter: 'blur(0.4px)',
              boxShadow: `0 0 ${dotSize * 0.6}px ${dotColor}40`,
              y: translateY,
              opacity,
            }}
          />
        )
      })}
    </div>
  )
}
