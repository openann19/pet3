/**
 * Framer Motion API: Unified Hooks
 * Hooks that work with Framer Motion on web, providing compatibility with Reanimated patterns
 */

import { useMotionValue, useTransform, animate, type MotionValue, type Transition } from 'framer-motion'
import { useEffect, useState, useCallback } from 'react'
import type { CSSProperties } from 'react'
import {
  convertSpringToFramer,
  convertTimingToFramer,
  withDelayTransition,
  withRepeatTransition,
  type ReanimatedSpringConfig,
  type ReanimatedTimingConfig,
} from './animations'
import { convertTransformToStyle } from './useMotionStyle'

/**
 * SharedValue type for compatibility with Reanimated
 * Wraps MotionValue to provide .value getter/setter
 */
export interface SharedValue<T> {
  value: T | (T extends number ? { target: number; transition: Transition; callback?: (finished?: boolean) => void } : never)
  get(): T
  set(v: T | (T extends number ? { target: number; transition: Transition; callback?: (finished?: boolean) => void } : never)): void
  // Include other MotionValue methods for full compatibility
  [key: string]: unknown
}

/**
 * Type guard to check if a value is a transition object
 */
function isTransitionObject(
  value: unknown
): value is { target: number; transition: Transition; callback?: (finished?: boolean) => void } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'target' in value &&
    'transition' in value &&
    typeof (value as { target: unknown }).target === 'number'
  )
}

/**
 * Equivalent to useSharedValue from Reanimated
 * Returns a value wrapper with a .value property for compatibility
 */
export function useSharedValue<T = number>(
  initial: T
): SharedValue<T> {
  // For number types, use MotionValue with widened type
  if (typeof initial === 'number') {
    const mv = useMotionValue(initial as number) as MotionValue<number>
    return new Proxy(mv as unknown as SharedValue<T>, {
      get(target, prop) {
        if (prop === 'value') {
          return (target as unknown as MotionValue<number>).get()
        }
        return Reflect.get(target, prop)
      },
      set(target, prop, value) {
        if (prop === 'value') {
          // Handle transition objects from withSpring/withTiming
          if (isTransitionObject(value)) {
            const motionValue = target as unknown as MotionValue<number>
            // Handle callback if provided
            if (value.callback) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              void animate(motionValue, value.target as any, value.transition as any).then(() => {
                value.callback?.(true)
              }).catch(() => {
                value.callback?.(false)
              })
            } else {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              void animate(motionValue, value.target as any, value.transition as any)
            }
            return true
          }
          // Regular number assignment
          if (typeof value === 'number') {
            (target as unknown as MotionValue<number>).set(value)
            return true
          }
          // Fallback: try to set directly
          try {
            (target as unknown as MotionValue<number>).set(value as number)
          } catch {
            // Ignore type errors for now
          }
          return true
        }
        return Reflect.set(target, prop, value)
      }
    })
  }
  
  // For non-number types, create a simple wrapper
  let currentValue = initial
  return {
    get value() { return currentValue },
    set value(v: T) { currentValue = v },
    get() { return currentValue },
    set(v: T) { currentValue = v },
  } as SharedValue<T>
}

/**
 * Animate a motion value with spring physics
 * Equivalent to: sharedValue.value = withSpring(target, config)
 */
export function animateWithSpring<T extends number>(
  motionValue: MotionValue<T>,
  target: number,
  config?: ReanimatedSpringConfig
): ReturnType<typeof animate> {
  const transition = convertSpringToFramer(config)
  const mv = motionValue as unknown as MotionValue<number>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return animate(mv, target as any, transition as any)
}

/**
 * Animate a motion value with timing
 * Equivalent to: sharedValue.value = withTiming(target, config)
 */
export function animateWithTiming<T extends number>(
  motionValue: MotionValue<T>,
  target: number,
  config?: ReanimatedTimingConfig
): ReturnType<typeof animate> {
  const transition = convertTimingToFramer(config)
  const mv = motionValue as unknown as MotionValue<number>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return animate(mv, target as any, transition as any)
}

/**
 * Animate a motion value with delay
 * Equivalent to: sharedValue.value = withDelay(delay, animation)
 */
export function animateWithDelay(
  motionValue: MotionValue<number>,
  target: number,
  delay: number,
  transition: Transition
): ReturnType<typeof animate> {
  const delayedTransition = withDelayTransition(delay, transition)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return animate(motionValue, target as any, delayedTransition as any)
}

/**
 * Animate a motion value with repeat
 * Equivalent to: sharedValue.value = withRepeat(animation, repeat, reverse)
 */
export function animateWithRepeat(
  motionValue: MotionValue<number>,
  target: number,
  transition: Transition,
  repeat?: number,
  reverse?: boolean
): ReturnType<typeof animate> {
  const repeatTransition = withRepeatTransition(
    transition,
    repeat,
    reverse ? 'reverse' : 'loop'
  )
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return animate(motionValue, target as any, repeatTransition as any)
}

/**
 * Hook to animate a motion value when it changes
 */
export function useAnimateValue(
  motionValue: MotionValue<number>,
  target: number,
  transition?: Transition
) {
  useEffect(() => {
    if (motionValue.get() !== target) {
      const defaultTransition = { type: 'tween' as const, duration: 0.3 }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      void animate(motionValue, target as any, (transition ?? defaultTransition) as any)
    }
  }, [motionValue, target, transition])
}

/**
 * Transform a motion value using a function
 * Equivalent to useDerivedValue from Reanimated
 */
export function useDerivedValue<T extends number | string, U>(
  motionValue: MotionValue<T>,
  transform: (value: T) => U
): MotionValue<U> {
  return useTransform(motionValue, transform)
}

/**
 * Equivalent to useAnimatedStyle from Reanimated
 * Returns a style object that updates when motion values change
 */
export function useAnimatedStyle(
  styleFactory: () => {
    opacity?: number | MotionValue<number> | { target: number; transition: Transition; callback?: (finished?: boolean) => void }
    transform?: Array<Record<string, number | string | MotionValue<number> | { target: number; transition: Transition; callback?: (finished?: boolean) => void } | undefined>>
    backgroundColor?: string | number | MotionValue<string | number>
    color?: string | number | MotionValue<string | number>
    width?: number | string | MotionValue<number | string>
    height?: number | string | MotionValue<number | string>
    [key: string]: unknown
  } | Record<string, unknown> | CSSProperties
): CSSProperties {
  const [style, setStyle] = useState<CSSProperties>(() => {
    try {
      const computed = styleFactory()
      // If it's already CSSProperties, return it directly (for nested useAnimatedStyle calls)
      if (computed && typeof computed === 'object' && !Array.isArray(computed)) {
        // Check if it's a plain CSSProperties object (has standard CSS properties)
        if ('opacity' in computed || 'transform' in computed || 'backgroundColor' in computed || 'width' in computed || 'height' in computed) {
          // Try to convert it, but if it fails, use it as-is
          try {
            return convertReanimatedStyleToCSS(computed as Parameters<typeof convertReanimatedStyleToCSS>[0])
          } catch {
            return computed as CSSProperties
          }
        }
        return convertReanimatedStyleToCSS(computed as Parameters<typeof convertReanimatedStyleToCSS>[0])
      }
      return {}
    } catch {
      return {}
    }
  })

  useEffect(() => {
    let rafId: number
    let isActive = true
    
    const updateStyle = () => {
      if (!isActive) return
      
      try {
        const computed = styleFactory()
        // If it's already CSSProperties, return it directly (for nested useAnimatedStyle calls)
        if (computed && typeof computed === 'object' && !Array.isArray(computed)) {
          // Check if it's a plain CSSProperties object (has standard CSS properties)
          if ('opacity' in computed || 'transform' in computed || 'backgroundColor' in computed || 'width' in computed || 'height' in computed) {
            // Try to convert it, but if it fails, use it as-is
            try {
              const newStyle = convertReanimatedStyleToCSS(computed as Parameters<typeof convertReanimatedStyleToCSS>[0])
              setStyle(newStyle)
            } catch {
              setStyle(computed as CSSProperties)
            }
          } else {
            const newStyle = convertReanimatedStyleToCSS(computed as Parameters<typeof convertReanimatedStyleToCSS>[0])
            setStyle(newStyle)
          }
        }
      } catch {
        // Ignore errors
      }
      
      if (isActive) {
        rafId = requestAnimationFrame(updateStyle)
      }
    }

    rafId = requestAnimationFrame(updateStyle)
    return () => {
      isActive = false
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [styleFactory])

  return style
}

/**
 * Convert Reanimated-style object to CSS properties
 * Handles both regular values and MotionValues
 */
function convertReanimatedStyleToCSS(
  style: {
    opacity?: number | MotionValue<number> | { target: number; transition: Transition; callback?: (finished?: boolean) => void }
    transform?: Array<{ [key: string]: number | string | MotionValue<number> | { target: number; transition: Transition; callback?: (finished?: boolean) => void } }>
    backgroundColor?: string | number | MotionValue<string | number>
    color?: string | number | MotionValue<string | number>
    width?: number | string | MotionValue<number | string>
    height?: number | string | MotionValue<number | string>
    [key: string]: unknown
  } | CSSProperties | Record<string, unknown>
): CSSProperties {
  const css: CSSProperties = {}
  
  // Type guard to check if style has the expected shape
  const styleObj = style as Record<string, unknown>
  
  // Helper to extract value from motion value or transition object
  const extractValue = (val: unknown): number | string | undefined => {
    if (val === undefined || val === null) return undefined
    // Check if it's a transition object
    if (isTransitionObject(val)) {
      return val.target
    }
    // Check if it's a MotionValue
    if (val instanceof Object && 'get' in val && typeof (val as { get?: () => unknown }).get === 'function') {
      return (val as MotionValue<number>).get() as number
    }
    // Regular number or string
    return val as number | string
  }

  if (styleObj.opacity !== undefined) {
    const value = extractValue(styleObj.opacity)
    if (value !== undefined && typeof value === 'number') {
      css.opacity = value
    }
  }

  if (styleObj.backgroundColor !== undefined) {
    const value = styleObj.backgroundColor instanceof Object && 'get' in styleObj.backgroundColor
      ? (styleObj.backgroundColor as MotionValue<string | number>).get()
      : styleObj.backgroundColor
    css.backgroundColor = String(value)
  }

  if (styleObj.color !== undefined) {
    const value = styleObj.color instanceof Object && 'get' in styleObj.color
      ? (styleObj.color as MotionValue<string | number>).get()
      : styleObj.color
    css.color = String(value)
  }

  if (styleObj.width !== undefined) {
    const value = styleObj.width instanceof Object && 'get' in styleObj.width
      ? (styleObj.width as MotionValue<number | string>).get()
      : styleObj.width
    if (value !== undefined && value !== null) {
      css.width = typeof value === 'number' ? `${value}px` : String(value)
    }
  }

  if (styleObj.height !== undefined) {
    const value = styleObj.height instanceof Object && 'get' in styleObj.height
      ? (styleObj.height as MotionValue<number | string>).get()
      : styleObj.height
    if (value !== undefined && value !== null) {
      css.height = typeof value === 'number' ? `${value}px` : String(value)
    }
  }

  if (styleObj.transform && Array.isArray(styleObj.transform)) {
    const processedTransforms = styleObj.transform
      .map(t => {
        if (!t || typeof t !== 'object') return null
        const processed: { [key: string]: number | string } = {}
        for (const [key, val] of Object.entries(t)) {
          // Skip undefined values
          if (val === undefined) continue
          const extracted = extractValue(val)
          if (extracted !== undefined) {
            processed[key] = extracted
          }
        }
        return Object.keys(processed).length > 0 ? processed : null
      })
      .filter((t): t is { [key: string]: number | string } => t !== null) // Remove null/empty transform objects
    if (processedTransforms.length > 0) {
      const transformStyle = convertTransformToStyle(processedTransforms)
      Object.assign(css, transformStyle)
    }
  }
  
  // Copy any other CSS properties that might be in the style object
  for (const [key, val] of Object.entries(styleObj)) {
    if (!['opacity', 'transform', 'backgroundColor', 'color', 'width', 'height'].includes(key)) {
      if (val !== undefined && val !== null) {
        if (val instanceof Object && 'get' in val && typeof (val as { get?: () => unknown }).get === 'function') {
          // It's a MotionValue, extract the value
          css[key as keyof CSSProperties] = (val as MotionValue<unknown>).get() as never
        } else if (!isTransitionObject(val) && (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean')) {
          // It's a regular CSS value
          css[key as keyof CSSProperties] = val as never
        }
      }
    }
  }

  return css
}

/**
 * withSpring - Animate a motion value with spring physics
 * Equivalent to Reanimated's withSpring
 */
export function withSpring(
  target: number,
  config?: ReanimatedSpringConfig
): { target: number; transition: Transition; callback?: (finished?: boolean) => void } {
  return {
    target,
    transition: convertSpringToFramer(config),
  }
}

/**
 * withTiming - Animate a motion value with timing
 * Equivalent to Reanimated's withTiming
 */
export function withTiming(
  target: number,
  config?: ReanimatedTimingConfig
): { target: number; transition: Transition; callback?: (finished?: boolean) => void } {
  return {
    target,
    transition: convertTimingToFramer(config),
    callback: config?.callback,
  }
}

/**
 * withRepeat - Repeat an animation
 * Equivalent to Reanimated's withRepeat
 */
export function withRepeat(
  animation: { target: number; transition: Transition; callback?: (finished?: boolean) => void },
  repeat?: number,
  reverse?: boolean
): { target: number; transition: Transition; callback?: (finished?: boolean) => void } {
  return {
    target: animation.target,
    transition: withRepeatTransition(
      animation.transition,
      repeat,
      reverse ? 'reverse' : 'loop'
    ),
    callback: animation.callback,
  }
}

/**
 * withSequence - Sequence multiple animations
 * Equivalent to Reanimated's withSequence
 */
export function withSequence(
  ...animations: Array<{ target: number; transition?: Transition; callback?: (finished?: boolean) => void }>
): { target: number; transition: Transition; callback?: (finished?: boolean) => void } {
  if (animations.length === 0) {
    return { target: 0, transition: { type: 'tween', duration: 0.3 } }
  }

  const last = animations[animations.length - 1]
  if (!last) {
    return { target: 0, transition: { type: 'tween', duration: 0.3 } }
  }
  
  return {
    target: last.target,
    transition: last.transition ?? { type: 'tween', duration: 0.3 },
    callback: last.callback,
  }
}

/**
 * withDelay - Add delay to an animation
 * Equivalent to Reanimated's withDelay
 */
export function withDelay(
  delayMs: number,
  animation: { target: number; transition: Transition; callback?: (finished?: boolean) => void }
): { target: number; transition: Transition; callback?: (finished?: boolean) => void } {
  return {
    target: animation.target,
    transition: withDelayTransition(delayMs, animation.transition),
    callback: animation.callback,
  }
}

/**
 * withDecay - Decay animation (not directly supported in Framer Motion, use timing as fallback)
 */
export function withDecay(
  config?: { velocity?: number; deceleration?: number }
): { target: number; transition: Transition } {
  // Framer Motion doesn't have decay, use a custom easing that approximates it
  return {
    target: 0,
    transition: {
      type: 'tween',
      duration: 1,
      ease: [0.2, 0, 0.2, 1], // Approximate decay
    },
  }
}

