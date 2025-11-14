/**
 * SkiaParticles Component
 * 
 * Premium particle effects using React Native Skia
 * Used for celebrations, match animations, and special moments
 * 
 * Location: apps/mobile/src/components/effects/SkiaParticles.tsx
 */

import React, { useEffect, useMemo } from 'react'
import { StyleSheet, View } from 'react-native'
import { Canvas, Circle, Group } from '@shopify/react-native-skia'
import { useSharedValue, withTiming, useDerivedValue } from 'react-native-reanimated'
import { Skia } from '@shopify/react-native-skia'
import { motionTokens } from '@petspark/motion'
import { useReducedMotionSV } from '@mobile/effects/core/use-reduced-motion-sv'

interface Particle {
  x: number
  y: number
  radius: number
  color: string
  speed: number
}

interface SkiaParticlesProps {
  width: number
  height: number
  particleCount?: number
  colors?: string[]
  duration?: number
  onComplete?: () => void
}

export function SkiaParticles({
  width,
  height,
  particleCount = 20,
  colors = ['#FF9A49', '#FFC069', '#7B9DD4', '#FF6B6B', '#4ECDC4'],
  duration = 2000,
  onComplete,
}: SkiaParticlesProps): React.JSX.Element | null {
  const progress = useSharedValue(0)
  const reducedMotion = useReducedMotionSV()
  const actualDuration = reducedMotion.value ? motionTokens.durations.fast : duration

  const particles = useMemo<Particle[]>(() => {
    if (reducedMotion.value) {
      return []
    }
    return Array.from({ length: particleCount }, (_, i) => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: 2 + Math.random() * 4,
      color: colors[Math.floor(Math.random() * colors.length)] ?? colors[0] ?? '#FF9A49',
      speed: 0.5 + Math.random() * 1.5,
    }))
  }, [particleCount, width, height, colors, reducedMotion])

  useEffect(() => {
    if (!reducedMotion.value) {
      progress.value = withTiming(1, { duration: actualDuration }, () => {
        onComplete?.()
      })
    } else {
      onComplete?.()
    }
  }, [actualDuration, onComplete, progress, reducedMotion])

  if (particles.length === 0) {
    return null
  }

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Canvas style={StyleSheet.absoluteFill}>
        <Group>
          {particles.map((particle, index) => {
            const skiaColor = Skia.Color(particle.color)
            
            return (
              <Circle
                key={index}
                cx={particle.x}
                cy={particle.y}
                r={particle.radius}
                color={skiaColor}
              />
            )
          })}
        </Group>
      </Canvas>
    </View>
  )
}

