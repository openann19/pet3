'use client';

import { useMotionValue, animate, type MotionValue, type Variants } from 'framer-motion';
import { useCallback } from 'react';

export interface UseMagneticEffectOptions {
  strength?: number;
  damping?: number;
  stiffness?: number;
  enabled?: boolean;
  maxDistance?: number;
}

export interface UseMagneticEffectReturn {
  translateX: MotionValue<number>;
  translateY: MotionValue<number>;
  variants: Variants;
  handleMove: (x: number, y: number) => void;
  handleLeave: () => void;
}

const DEFAULT_STRENGTH = 20;
const DEFAULT_DAMPING = 15;
const DEFAULT_STIFFNESS = 150;
const DEFAULT_MAX_DISTANCE = 50;

/**
 * Framer Motion hook for magnetic effects
 * Elements move towards cursor with spring physics
 */
export function useMagneticEffect(options: UseMagneticEffectOptions = {}): UseMagneticEffectReturn {
  const {
    strength = DEFAULT_STRENGTH,
    damping = DEFAULT_DAMPING,
    stiffness = DEFAULT_STIFFNESS,
    enabled = true,
    maxDistance = DEFAULT_MAX_DISTANCE,
  } = options;

  const translateX = useMotionValue(0);
  const translateY = useMotionValue(0);

  const variants: Variants = {
    rest: {
      x: 0,
      y: 0,
      transition: {
        type: 'spring',
        damping,
        stiffness,
      },
    },
    magnetic: {
      transition: {
        type: 'spring',
        damping,
        stiffness,
      },
    },
  };

  const handleMove = useCallback(
    (x: number, y: number) => {
      if (!enabled) return;

      const distance = Math.sqrt(x * x + y * y);
      
      if (distance > 0 && distance < maxDistance) {
        const normalizedX = x / distance;
        const normalizedY = y / distance;
        const magneticX = Math.min(normalizedX * strength, maxDistance);
        const magneticY = Math.min(normalizedY * strength, maxDistance);

        void animate(translateX, magneticX, {
          type: 'spring',
          damping,
          stiffness,
        });
        void animate(translateY, magneticY, {
          type: 'spring',
          damping,
          stiffness,
        });
      }
    },
    [enabled, strength, maxDistance, damping, stiffness, translateX, translateY]
  );

  const handleLeave = useCallback(() => {
    if (!enabled) return;
    void animate(translateX, 0, {
      type: 'spring',
      damping,
      stiffness,
    });
    void animate(translateY, 0, {
      type: 'spring',
      damping,
      stiffness,
    });
  }, [enabled, damping, stiffness, translateX, translateY]);

  return {
    translateX,
    translateY,
    variants,
    handleMove,
    handleLeave,
  };
}
