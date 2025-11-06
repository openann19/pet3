/**
 * Reduced Motion Detection (Web + RN) — SSR-safe, worklet-friendly
 * 
 * Unified reduced motion hooks for both web and mobile platforms.
 * Respects system accessibility settings and provides SharedValue for worklets.
 */

import { useEffect, useState } from 'react';
import { useSharedValue, type SharedValue } from 'react-native-reanimated';

// Optional RN import (lazy/try-catch for web)
let AccessibilityInfo: {
  isReduceMotionEnabled?: () => Promise<boolean>;
  addEventListener?: (event: string, handler: (enabled: boolean) => void) => { remove: () => void };
} | null = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  AccessibilityInfo = require('react-native').AccessibilityInfo;
} catch {
  // Web environment - AccessibilityInfo not available
}

const MEDIA_QUERY = '(prefers-reduced-motion: reduce)';

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
      return window.matchMedia(MEDIA_QUERY).matches;
    } catch {
      return false;
    }
  }
  
  return false;
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
  const [reduced, setReduced] = useState<boolean>(() => isReduceMotionEnabled());

  useEffect(() => {
    let mounted = true;

    // RN listener (preferred on native)
    if (AccessibilityInfo?.isReduceMotionEnabled) {
      AccessibilityInfo.isReduceMotionEnabled()
        .then((v: boolean) => {
          if (mounted) {
            setReduced(!!v);
          }
        })
        .catch(() => {
          // Silent fail - default to false
        });
      
      const sub = AccessibilityInfo.addEventListener?.('reduceMotionChanged', (v: boolean) => {
        if (mounted) {
          setReduced(!!v);
        }
      });

      return () => {
        mounted = false;
        sub?.remove?.();
      };
    }

    // Web listener
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mq = window.matchMedia(MEDIA_QUERY);

      const handler = (e: MediaQueryListEvent) => {
        if (mounted) {
          setReduced(!!e.matches);
        }
      };

      try {
        if (mq.addEventListener) {
          mq.addEventListener('change', handler);
        } else if (mq.addListener) {
          // Fallback for older browsers
          mq.addListener(handler);
        }
        setReduced(mq.matches);

        return () => {
          mounted = false;
          if (mq.removeEventListener) {
            mq.removeEventListener('change', handler);
          } else if (mq.removeListener) {
            mq.removeListener(handler);
          }
        };
      } catch {
        // Silent fail
      }
    }

    return () => {
      mounted = false;
    };
  }, []);

  return reduced;
}

/**
 * SharedValue version for use in worklets.
 * Updates reactively when preference changes and can be used in animated styles.
 * 
 * @returns SharedValue<boolean> - true if reduced motion is enabled
 * 
 * @example
 * ```typescript
 * const reducedMotion = useReducedMotionSV()
 * 
 * const animatedStyle = useAnimatedStyle(() => {
 *   if (reducedMotion.value) {
 *     return { opacity: 1 } // Instant, no animation
 *   }
 *   return { opacity: withSpring(1) }
 * })
 * ```
 */
export function useReducedMotionSV(): SharedValue<boolean> {
  const sv = useSharedValue<boolean>(isReduceMotionEnabled());
  const reduced = useReducedMotion();

  useEffect(() => {
    sv.value = reduced;
  }, [reduced, sv]);

  return sv;
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
    reduced = isReduceMotionEnabled();
  }
  return reduced ? Math.min(120, baseMs) : baseMs;
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
    reduced = isReduceMotionEnabled();
  }
  return reduced ? 0 : 1;
}
