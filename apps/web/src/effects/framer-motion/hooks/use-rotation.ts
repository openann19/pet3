'use client';

import { useMotionValue, animate, type MotionValue, type Variants } from 'framer-motion';
import { useEffect } from 'react';

export interface UseRotationOptions {
  enabled?: boolean;
  duration?: number;
  repeat?: number | boolean;
  from?: number;
  to?: number;
}

export interface UseRotationReturn {
  rotation: MotionValue<number>;
  variants: Variants;
  rotationStyle: { rotate: MotionValue<number> };
}

/**
 * Framer Motion hook for rotation animations
 * Provides smooth continuous or finite rotation
 */
export function useRotation(options: UseRotationOptions = {}): UseRotationReturn {
  const { enabled = true, duration = 1000, repeat = true, from = 0, to = 360 } = options;

  const rotation = useMotionValue(from);

  const variants: Variants = {
    initial: {
      rotate: from,
    },
    rotating: {
      rotate: to,
      transition: {
        duration: duration / 1000,
        ease: 'linear',
        repeat: repeat === true ? Infinity : repeat === false ? 0 : repeat,
        repeatType: 'loop',
      },
    },
  };

  useEffect(() => {
    if (!enabled) {
      rotation.set(from);
      return;
    }

    void animate(rotation, to, {
      duration: duration / 1000,
      ease: 'linear',
      repeat: repeat === true ? Infinity : repeat === false ? 0 : repeat,
      repeatType: 'loop',
    });
  }, [enabled, duration, repeat, from, to, rotation]);

  return {
    rotation,
    variants,
    rotationStyle: { rotate: rotation },
  };
}
