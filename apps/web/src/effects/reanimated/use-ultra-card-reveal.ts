/**
 * Ultra Card Reveal Animation
 * Advanced card reveal with 3D transforms, staggered content, and particle effects
 * Migrated to pure Framer Motion - returns MotionValues for direct use in motion components
 */

import { useMotionValue, animate, useTransform, type MotionValue } from 'framer-motion';
import { useEffect } from 'react';
import { isTruthy } from '@/core/guards';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export interface UseUltraCardRevealOptions {
  delay?: number;
  duration?: number;
  enabled?: boolean;
  index?: number;
  perspective?: number;
  rotationIntensity?: number;
}

export interface UseUltraCardRevealReturn {
  progress: MotionValue<number>;
  opacity: MotionValue<number>;
  scale: MotionValue<number>;
  rotateX: MotionValue<number>;
  rotateY: MotionValue<number>;
  translateZ: MotionValue<number>;
  perspective: number;
  animatedStyle: {
    opacity: MotionValue<number>;
    scale: MotionValue<number>;
    rotateX: MotionValue<number>;
    rotateY: MotionValue<number>;
    translateZ: MotionValue<number>;
  };
}

export function useUltraCardReveal(options: UseUltraCardRevealOptions = {}): UseUltraCardRevealReturn {
  const {
    delay = 0,
    duration = 800,
    enabled = true,
    index = 0,
    perspective = 1000,
    rotationIntensity = 15,
  } = options;

  const prefersReducedMotion = useReducedMotion();
  const progress = useMotionValue(0);
  const scale = useMotionValue(0.5);
  const rotateX = useMotionValue(rotationIntensity);
  const rotateY = useMotionValue(-rotationIntensity);
  const translateZ = useMotionValue(-100);

  const opacity = useTransform(progress, [0, 0.3, 1], [0, 0.6, 1]);

  useEffect(() => {
    if (isTruthy(enabled) && !prefersReducedMotion) {
      const staggerDelay = (delay + index * 100) / 1000;

      animate(progress, 1, {
        delay: staggerDelay,
        type: 'spring',
        damping: 20,
        stiffness: 90,
        mass: 1,
      });

      // Sequence animation for scale
      animate(scale, [0.5, 1.1, 1], {
        delay: staggerDelay,
        type: 'spring',
        damping: 15,
        stiffness: 100,
        times: [0, 0.5, 1],
      });

      animate(rotateX, 0, {
        delay: staggerDelay,
        type: 'spring',
        damping: 25,
        stiffness: 80,
      });

      animate(rotateY, 0, {
        delay: staggerDelay,
        type: 'spring',
        damping: 25,
        stiffness: 80,
      });

      animate(translateZ, 0, {
        delay: staggerDelay,
        type: 'spring',
        damping: 20,
        stiffness: 100,
      });
    } else if (isTruthy(enabled) && prefersReducedMotion) {
      // Simplified animation for reduced motion
      const staggerDelay = (delay + index * 100) / 1000;
      progress.set(1);
      scale.set(1);
      rotateX.set(0);
      rotateY.set(0);
      translateZ.set(0);
    } else {
      // Reset to initial state
      progress.set(0);
      scale.set(0.5);
      rotateX.set(rotationIntensity);
      rotateY.set(-rotationIntensity);
      translateZ.set(-100);
    }
  }, [enabled, delay, index, duration, progress, scale, rotateX, rotateY, translateZ, prefersReducedMotion, rotationIntensity]);

  return {
    progress,
    opacity,
    scale,
    rotateX,
    rotateY,
    translateZ,
    perspective,
    animatedStyle: {
      opacity,
      scale,
      rotateX,
      rotateY,
      translateZ,
    },
  };
}
