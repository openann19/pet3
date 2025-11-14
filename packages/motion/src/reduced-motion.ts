/**
 * Reduced Motion Detection (Web + RN) — SSR-safe, worklet-friendly
 *
 * Unified reduced motion hooks for both web and mobile platforms.
 * Respects system accessibility settings and provides SharedValue for worklets.
 */

import { useEffect, useState } from 'react'
import { useMotionValue, type MotionValue } from 'framer-motion'

// Optional RN import (lazy/try-catch for web)
interface ReactNativeAccessibilityInfo {
  isReduceMotionEnabled?: () => Promise<boolean>
  addEventListener?: (event: string, handler: (enabled: boolean) => void) => { remove: () => void }
}

interface ReactNativeModule {
  AccessibilityInfo?: ReactNativeAccessibilityInfo
}

function isReactNativeModule(module: unknown): module is ReactNativeModule {
  return typeof module === 'object' && module !== null && 'AccessibilityInfo' in module
}

let AccessibilityInfo: ReactNativeAccessibilityInfo | null = null
let accessibilityInfoLoadPromise: Promise<ReactNativeAccessibilityInfo | null> | null = null

async function loadAccessibilityInfo(): Promise<ReactNativeAccessibilityInfo | null> {
  if (AccessibilityInfo !== null) return AccessibilityInfo
  if (accessibilityInfoLoadPromise) return accessibilityInfoLoadPromise

  accessibilityInfoLoadPromise = import('react-native')
    .then(module => {
      if (isReactNativeModule(module)) {
        AccessibilityInfo = module.AccessibilityInfo ?? null
      }
      return AccessibilityInfo
    })
    .catch(() => {
      // Web environment - AccessibilityInfo not available
      return null
    })

  return accessibilityInfoLoadPromise
}

// Initialize on module load (non-blocking)
loadAccessibilityInfo().catch(() => {
  // Expected on web or when react-native is not available
})

const MEDIA_QUERY = '(prefers-reduced-motion: reduce)'

/**
 * Synchronous check for reduced motion preference (non-reactive)
 * Returns best guess - use hooks for reactive updates
 */
export function isReduceMotionEnabled(): boolean {
  // RN path: prefer AccessibilityInfo snapshot if available (non-blocking)
  // Note: We can't await here (sync API), so return false and let hooks update

  // Web path
  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    try {
      return window.matchMedia(MEDIA_QUERY).matches
    } catch {
      return false
    }
  }

  return false
}

/**
 * Reactive hook (Web + RN) that updates on preference changes.
 *
 * @returns boolean - true if reduced motion is enabled
 *
 * @example
 * ```typescript
 * const reducedMotion = useReducedMotion()
 * const duration = reducedMotion ? 120 : 300
 * ```
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState<boolean>(() => isReduceMotionEnabled())

  useEffect(() => {
    let mounted = true
    let subscription: { remove: () => void } | null = null

    // Load AccessibilityInfo and set up RN listener (preferred on native)
    loadAccessibilityInfo()
      .then(info => {
        if (!mounted || !info) {
          // Fall through to web listener if RN not available
          return
        }

        if (info.isReduceMotionEnabled) {
          info
            .isReduceMotionEnabled()
            .then((v: boolean) => {
              if (mounted) {
                setReduced(!!v)
              }
            })
            .catch(() => {
              // Silent fail
            })

          subscription =
            info.addEventListener?.('reduceMotionChanged', (v: boolean) => {
              if (mounted) {
                setReduced(!!v)
              }
            }) ?? null
        }
      })
      .catch(() => {
        // Expected on web or when react-native is not available
        // Fall through to web listener
      })

    // Web listener (always set up as fallback or primary on web)
    let webCleanup: (() => void) | null = null

    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      try {
        const mq = window.matchMedia(MEDIA_QUERY)
        if (!mq) {
          return
        }

        const handler = (e: unknown): void => {
          const mediaEvent = e as MediaQueryListEvent
          if (mounted) {
            setReduced(!!mediaEvent.matches)
          }
        }

        if (typeof mq.addEventListener === 'function') {
          mq.addEventListener('change', handler)
          webCleanup = (): void => {
            if (mq && typeof mq.removeEventListener === 'function') {
              mq.removeEventListener('change', handler)
            }
          }
        }
        setReduced(mq.matches)
      } catch {
        // Silent fail
      }
    }

    return () => {
      mounted = false
      subscription?.remove?.()
      webCleanup?.()
    }
  }, [])

  return reduced
}

/**
 * MotionValue version for use with Framer Motion.
 * Updates reactively when preference changes and can be used in animated styles.
 *
 * @returns MotionValue<boolean> - true if reduced motion is enabled
 *
 * @example
 * ```typescript
 * const reducedMotion = useReducedMotionSV()
 *
 * const opacity = useMotionValue(reducedMotion.get() ? 1 : 0)
 * useEffect(() => {
 *   if (!reducedMotion.get()) {
 *     animate(opacity, 1, { type: 'spring' })
 *   }
 * }, [opacity, reducedMotion])
 * ```
 */
export function useReducedMotionSV(): MotionValue<boolean> {
  const mv = useMotionValue(isReduceMotionEnabled())
  const reduced = useReducedMotion()

  useEffect(() => {
    mv.set(reduced)
  }, [reduced, mv])

  return mv
}

/**
 * Clamp duration for reduced motion (≤120ms), else pass through.
 *
 * @param baseMs - Base duration in milliseconds
 * @param reduced - Whether reduced motion is enabled (optional, will check if not provided)
 * @returns Clamped duration (≤120ms if reduced, else baseMs)
 *
 * @example
 * ```typescript
 * const duration = getReducedMotionDuration(300, useReducedMotion()) // Returns 120 if reduced, 300 otherwise
 * ```
 */
export function getReducedMotionDuration(baseMs: number, reduced?: boolean): number {
  if (reduced === undefined) {
    reduced = isReduceMotionEnabled()
  }
  return reduced ? Math.min(120, baseMs) : baseMs
}

/**
 * Multiplier helper (0 for instant when reduced, 1 otherwise).
 * Useful for scaling animation values.
 *
 * @param reduced - Whether reduced motion is enabled (optional, will check if not provided)
 * @returns 0 if reduced, 1 otherwise
 */
export function getReducedMotionMultiplier(reduced?: boolean): number {
  if (reduced === undefined) {
    reduced = isReduceMotionEnabled()
  }
  return reduced ? 0 : 1
}
