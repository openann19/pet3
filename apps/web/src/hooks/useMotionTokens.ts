/**
 * Centralized Motion Tokens Hook
 * 
 * Provides access to motion tokens (durations, easings, spring configs)
 * with automatic reduced motion support.
 * 
 * Location: apps/web/src/hooks/useMotionTokens.ts
 */

import { useReducedMotion } from '@/hooks/useReducedMotion';
import { motionDurations, springConfigs, easing, transitions } from '@/effects/framer-motion/variants';

export interface MotionTokens {
  durations: typeof motionDurations;
  spring: typeof springConfigs;
  easing: typeof easing;
  transitions: typeof transitions;
  reducedMotion: boolean;
}

/**
 * Hook to access motion tokens with reduced motion support
 * 
 * @returns Motion tokens object with durations, springs, easings, and reduced motion flag
 * 
 * @example
 * ```tsx
 * const tokens = useMotionTokens();
 * 
 * <motion.div
 *   animate={{ opacity: 1 }}
 *   transition={{
 *     duration: tokens.reducedMotion ? 0 : tokens.durations.smooth,
 *     ...tokens.spring.smooth,
 *   }}
 * />
 * ```
 */
export function useMotionTokens(): MotionTokens {
  const reducedMotion = useReducedMotion();

  return {
    durations: motionDurations,
    spring: springConfigs,
    easing,
    transitions,
    reducedMotion,
  };
}

/**
 * Get duration respecting reduced motion
 * 
 * @param baseDuration - Base duration in seconds
 * @param reducedMotion - Whether reduced motion is enabled (optional, will check if not provided)
 * @returns Clamped duration (≤0.12s if reduced, else baseDuration)
 */
export function getReducedMotionDuration(
  baseDuration: number,
  reducedMotion?: boolean
): number {
  if (reducedMotion === undefined) {
    // Check at runtime if not provided
    if (typeof window !== 'undefined' && window.matchMedia) {
      reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } else {
      reducedMotion = false;
    }
  }
  return reducedMotion ? Math.min(0.12, baseDuration) : baseDuration;
}

/**
 * Get spring config respecting reduced motion
 * 
 * @param config - Spring config key or custom config
 * @param reducedMotion - Whether reduced motion is enabled
 * @returns Spring config with adjusted damping/stiffness if reduced motion
 */
export function getReducedMotionSpring(
  config: keyof typeof springConfigs | typeof springConfigs[keyof typeof springConfigs],
  reducedMotion?: boolean
): typeof springConfigs[keyof typeof springConfigs] {
  if (reducedMotion === undefined) {
    if (typeof window !== 'undefined' && window.matchMedia) {
      reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } else {
      reducedMotion = false;
    }
  }

  const baseConfig = typeof config === 'string' ? springConfigs[config] : config;

  if (reducedMotion) {
    // Increase damping and reduce stiffness for less bouncy animations
    return {
      ...baseConfig,
      damping: baseConfig.damping * 1.5,
      stiffness: baseConfig.stiffness * 0.7,
    };
  }

  return baseConfig;
}

