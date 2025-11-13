/**
 * Framer Motion Value Hook
 * 
 * Migration helper to replace useSharedValue from @petspark/motion
 * with native Framer Motion useMotionValue
 * 
 * This provides a drop-in replacement that returns a MotionValue
 * compatible with Framer Motion's animation system.
 */

'use client';

import { useMotionValue, type MotionValue } from 'framer-motion';
import { useCallback } from 'react';

/**
 * Hook to create a motion value (replacement for useSharedValue)
 * 
 * @param initial - Initial value
 * @returns MotionValue that can be used with Framer Motion animations
 * 
 * @example
 * ```tsx
 * const scale = useFramerMotionValue(1);
 * 
 * // Animate with Framer Motion
 * scale.set(1.2);
 * 
 * // Use in motion.div
 * <motion.div style={{ scale }} />
 * ```
 */
export function useFramerMotionValue<T extends string | number>(
  initial: T
): MotionValue<T> {
  return useMotionValue(initial);
}

/**
 * Get the current value from a MotionValue synchronously
 * Note: This is a convenience function. For reactive updates,
 * use useTransform or useMotionValueEvent instead.
 */
export function getMotionValue<T>(motionValue: MotionValue<T>): T {
  return motionValue.get();
}

/**
 * Set the value of a MotionValue
 */
export function setMotionValue<T>(motionValue: MotionValue<T>, value: T): void {
  motionValue.set(value);
}

/**
 * Animate a MotionValue with spring animation
 * 
 * @param motionValue - The MotionValue to animate
 * @param to - Target value
 * @param config - Spring configuration
 */
export async function animateWithSpring<T extends string | number>(
  motionValue: MotionValue<T>,
  to: T,
  config?: {
    damping?: number;
    stiffness?: number;
    mass?: number;
  }
): Promise<void> {
  const { animate } = await import('framer-motion');
  
  await animate(motionValue, to, {
    type: 'spring',
    damping: config?.damping ?? 25,
    stiffness: config?.stiffness ?? 400,
    mass: config?.mass ?? 1,
  });
}

/**
 * Animate a MotionValue with timing animation
 * 
 * @param motionValue - The MotionValue to animate
 * @param to - Target value
 * @param config - Timing configuration
 */
export async function animateWithTiming<T extends string | number>(
  motionValue: MotionValue<T>,
  to: T,
  config?: {
    duration?: number;
    ease?: number[] | string;
  }
): Promise<void> {
  const { animate } = await import('framer-motion');
  
  await animate(motionValue, to, {
    duration: (config?.duration ?? 300) / 1000, // Convert ms to seconds
    ease: config?.ease ?? [0.2, 0, 0, 1],
  });
}

