'use client';

import { useMotionValue, animate, type MotionValue } from 'framer-motion';
import { useEffect } from 'react';
import type { CSSProperties } from 'react';

export interface UseIconRotationOptions {
  enabled?: boolean;
  targetRotation?: number;
  duration?: number;
  enablePulse?: boolean;
}

export interface UseIconRotationReturn {
  rotation: MotionValue<number>;
  style: CSSProperties;
}

export function useIconRotation(options: UseIconRotationOptions = {}): UseIconRotationReturn {
  const { enabled = false, targetRotation = 360, duration = 500, enablePulse = false } = options;

  const rotationValue = useMotionValue(0);

  useEffect(() => {
    if (enabled) {
      animate(rotationValue, targetRotation, {
        duration: duration / 1000,
        ease: 'easeInOut',
      });
    } else {
      animate(rotationValue, 0, {
        duration: duration / 1000,
        ease: 'easeInOut',
      });
    }
  }, [enabled, duration, targetRotation, rotationValue, enablePulse]);

  return {
    rotation: rotationValue,
    style: {
      transform: `rotate(${rotationValue.get()}deg)`,
    },
  };
}
