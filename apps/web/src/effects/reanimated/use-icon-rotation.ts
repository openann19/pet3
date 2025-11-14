'use client';

import { useMotionValue, animate, type MotionValue } from 'framer-motion';
import { useEffect } from 'react';
import type { AnimatedStyle } from '@/effects/reanimated/animated-view';

export interface UseIconRotationOptions {
  enabled?: boolean;
  targetRotation?: number;
  duration?: number;
  enablePulse?: boolean;
}

export interface UseIconRotationReturn {
  rotation: MotionValue<number>;
  style: AnimatedStyle;
}

export function useIconRotation(options: UseIconRotationOptions = {}): UseIconRotationReturn {
  const { enabled = false, targetRotation = 360, duration = 500, enablePulse = false } = options;

  const rotationValue = useMotionValue(0);

  useEffect(() => {
    if (enabled) {
      animate(rotationValue, targetRotation, { duration: duration / 1000 });
    } else {
      animate(rotationValue, 0, { duration: duration / 1000 });
    }
  }, [enabled, duration, targetRotation, rotationValue, enablePulse]);

  const style: AnimatedStyle = {
    transform: [{ rotate: rotationValue }],
  };

  return {
    rotation: rotationValue,
    style,
  };
}
