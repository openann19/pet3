'use client';

import { useMotionValue, animate, type MotionValue } from 'framer-motion';
import { useEffect } from 'react';
import { timingConfigs } from './transitions';
import type { CSSProperties } from 'react';

export interface UseStaggeredItemOptions {
  index: number;
  delay?: number;
  staggerDelay?: number;
}

export interface UseStaggeredItemReturn {
  opacity: MotionValue<number>;
  y: MotionValue<number>;
  itemStyle: CSSProperties;
}

/**
 * Hook for staggered list item animations
 * Uses framer-motion for smooth animations
 */
export function useStaggeredItem(options: UseStaggeredItemOptions): UseStaggeredItemReturn {
  const { index, delay = 0, staggerDelay = 50 } = options;

  const opacity = useMotionValue(0);
  const y = useMotionValue(20);

  useEffect(() => {
    const totalDelay = delay + index * staggerDelay;
    const delayMs = totalDelay / 1000;

    animate(opacity, 1, {
      delay: delayMs,
      duration: timingConfigs.smooth.duration / 1000,
      ease: 'easeOut',
    });
    animate(y, 0, {
      delay: delayMs,
      duration: timingConfigs.smooth.duration / 1000,
      ease: 'easeOut',
    });
  }, [index, delay, staggerDelay, opacity, y]);

  return {
    opacity,
    y,
    itemStyle: {
      opacity: opacity.get(),
      transform: `translateY(${y.get()}px)`,
    },
  };
}
