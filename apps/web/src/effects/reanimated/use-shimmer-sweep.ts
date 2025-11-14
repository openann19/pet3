'use client';

import {
  useMotionValue,
  animate,
  type MotionValue,
} from 'framer-motion';
import { useEffect } from 'react';
import type { CSSProperties } from 'react';

export interface UseShimmerSweepOptions {
  duration?: number;
  delay?: number;
  opacityRange?: [number, number];
}

export interface UseShimmerSweepReturn {
  x: MotionValue<number>;
  opacity: MotionValue<number>;
  style: CSSProperties;
}

export function useShimmerSweep(options: UseShimmerSweepOptions = {}): UseShimmerSweepReturn {
  const { duration = 3000, delay = 0, opacityRange = [0, 0.5] } = options;

  const x = useMotionValue(-100);
  const opacity = useMotionValue(0);

  useEffect(() => {
    // Animate x from -100% to 100% repeatedly
    void animate(x, [-100, 100], {
      duration: duration / 1000,
      ease: 'linear',
      repeat: Infinity,
      times: [0, 1],
    });

    // Animate opacity with delay
    void animate(opacity, [opacityRange[0], opacityRange[1], opacityRange[0]], {
      duration: duration / 1000,
      ease: 'easeInOut',
      repeat: Infinity,
      delay: delay / 1000,
      times: [0, 0.5, 1],
    });
  }, [duration, delay, opacityRange, x, opacity]);

  const style: CSSProperties = {
    transform: `translateX(${x.get()}%)`,
    opacity: opacity.get(),
  };

  return {
    x,
    opacity,
    style,
  };
}
