'use client';

import { useMotionValue, animate, type MotionValue } from 'framer-motion';
import { useEffect } from 'react';
import type { CSSProperties } from 'react';

export interface UseRotationOptions {
  enabled?: boolean;
  duration?: number;
  repeat?: number | boolean;
}

export interface UseRotationReturn {
  rotation: MotionValue<number>;
  rotationStyle: CSSProperties;
}

/**
 * Hook for continuous rotation animation
 * Uses React Reanimated for smooth 60fps animations on UI thread
 */
export function useRotation(options: UseRotationOptions = {}): UseRotationReturn {
  const { enabled = true, duration = 1000, repeat = true } = options;

  const rotation = useMotionValue(0);

  useEffect(() => {
    if (!enabled) {
      rotation.set(0);
      return;
    }

    animate(rotation, 360, {
      duration: duration / 1000,
      ease: 'linear',
      repeat: repeat === true ? Infinity : repeat === false ? 0 : repeat,
      repeatType: 'loop',
    });
  }, [enabled, duration, repeat, rotation]);

  return {
    rotation,
    rotationStyle: {
      transform: `rotate(${rotation.get()}deg)`,
    },
  };
}
