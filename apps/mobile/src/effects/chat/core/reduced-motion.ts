/**
 * Reduced Motion Detection for Chat Effects
 * 
 * Provides hooks and utilities to detect and respect user's reduced motion preference.
 * All effects must check this and provide instant fallbacks (≤120ms) when enabled.
 * 
 * Location: apps/mobile/src/effects/chat/core/reduced-motion.ts
 */

import { useEffect, useState } from 'react'
import { AccessibilityInfo, Platform } from 'react-native'
import { useSharedValue, type SharedValue } from 'react-native-reanimated'
import { createLogger } from '../../../utils/logger'

const logger = createLogger('reduced-motion')

/**
 * Check if reduced motion is enabled on the device
 * Uses React Native's AccessibilityInfo API
 */
export function isReduceMotionEnabled(): boolean {
  // For React Native, we use AccessibilityInfo
  // This respects system-level preferences on both iOS and Android
  // Note: AccessibilityInfo.isReduceMotionEnabled() returns a Promise in RN
  // For synchronous check, we default to false and let hooks handle async updates
  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    // Synchronous check (may return false if not yet initialized)
    return false
  }
  
  return false
}

/**
 * Hook to detect reduced motion preference
 * Updates reactively when the preference changes
 */
export function useReducedMotion(): boolean {
  const [reducedMotion, setReducedMotion] = useState<boolean>(() => {
    return isReduceMotionEnabled()
  })

  useEffect(() => {
    let mounted = true

    // Get initial value
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      AccessibilityInfo.isReduceMotionEnabled()
        .then((enabled) => {
          if (mounted) {
            setReducedMotion(enabled)
          }
        })
        .catch((error) => {
          logger.warn('Failed to check reduced motion preference', error)
          if (mounted) {
            setReducedMotion(false)
          }
        })

      // Listen for changes (iOS/Android may not support this, but try anyway)
      const subscription = AccessibilityInfo.addEventListener(
        'reduceMotionChanged',
        (enabled: boolean) => {
          if (mounted) {
            setReducedMotion(enabled)
            logger.debug('Reduced motion preference changed', { enabled })
          }
        }
      )

      return () => {
        mounted = false
        subscription.remove()
      }
    }

    return () => {
      mounted = false
    }
  }, [])

  return reducedMotion
}

/**
 * Reanimated SharedValue version of reduced motion
 * Can be used in worklets for frame-by-frame checks
 */
export function useReducedMotionSV(): SharedValue<boolean> {
  const reducedMotion = useSharedValue<boolean>(isReduceMotionEnabled())

  useEffect(() => {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      AccessibilityInfo.isReduceMotionEnabled()
        .then((enabled) => {
          reducedMotion.value = enabled
        })
        .catch((error) => {
          logger.warn('Failed to check reduced motion preference', error)
          reducedMotion.value = false
        })

      const subscription = AccessibilityInfo.addEventListener(
        'reduceMotionChanged',
        (enabled: boolean) => {
          reducedMotion.value = enabled
          logger.debug('Reduced motion preference changed', { enabled })
        }
      )

      return () => {
        subscription.remove()
      }
    }
    // No-op cleanup when platform doesn't support reduced motion
    return () => {
      // Platform doesn't support reduced motion
    }
  }, [reducedMotion])

  return reducedMotion
}

/**
 * Get animation duration based on reduced motion preference
 * If reduced motion is enabled, returns instant duration (≤120ms)
 * Otherwise returns the provided base duration
 */
export function getReducedMotionDuration(
  baseDuration: number,
  reducedMotion: boolean
): number {
  if (reducedMotion) {
    // Instant state changes (≤120ms per spec)
    return Math.min(baseDuration, 120)
  }
  return baseDuration
}

/**
 * Get animation duration multiplier based on reduced motion
 * Returns 0 for instant (reduced motion) or 1 for normal
 */
export function getReducedMotionMultiplier(reducedMotion: boolean): number {
  return reducedMotion ? 0 : 1
}

