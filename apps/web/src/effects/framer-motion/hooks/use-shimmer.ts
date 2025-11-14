'use client';

import { useMotionValue, animate, type MotionValue, type Variants } from 'framer-motion';
import { useEffect, useCallback } from 'react';

export interface UseShimmerOptions {
  duration?: number;
  delay?: number;
  shimmerWidth?: number;
  enabled?: boolean;
  direction?: 'horizontal' | 'vertical';
}

export interface UseShimmerReturn {
  variants: Variants;
  translateX: MotionValue<number>;
  translateY: MotionValue<number>;
  opacity: MotionValue<number>;
  start: () => void;
  stop: () => void;
}

const DEFAULT_DURATION = 2000;
const DEFAULT_DELAY = 0;
const DEFAULT_SHIMMER_WIDTH = 200;

/**
 * Framer Motion hook for shimmer/loading animations
 * Creates a sweeping light effect across elements
 */
export function useShimmer(options: UseShimmerOptions = {}): UseShimmerReturn {
  const {
    duration = DEFAULT_DURATION,
    delay = DEFAULT_DELAY,
    shimmerWidth = DEFAULT_SHIMMER_WIDTH,
    enabled = true,
    direction = 'horizontal',
  } = options;

  const translateX = useMotionValue(direction === 'horizontal' ? -shimmerWidth : 0);
  const translateY = useMotionValue(direction === 'vertical' ? -shimmerWidth : 0);
  const opacity = useMotionValue(0.3);

  const start = useCallback(() => {
    if (direction === 'horizontal') {
      void animate(translateX, shimmerWidth, {
        duration: duration / 1000,
        ease: 'linear',
        repeat: Infinity,
        repeatType: 'loop',
      });
    } else {
      void animate(translateY, shimmerWidth, {
        duration: duration / 1000,
        ease: 'linear',
        repeat: Infinity,
        repeatType: 'loop',
      });
    }

    void animate(opacity, [0.3, 0.6, 0.3], {
      duration: duration / 1000,
      ease: 'easeInOut',
      repeat: Infinity,
      repeatType: 'loop',
    });
  }, [translateX, translateY, opacity, shimmerWidth, duration, direction]);

  const stop = useCallback(() => {
    translateX.set(direction === 'horizontal' ? -shimmerWidth : 0);
    translateY.set(direction === 'vertical' ? -shimmerWidth : 0);
    opacity.set(0.3);
  }, [translateX, translateY, opacity, shimmerWidth, direction]);

  useEffect(() => {
    if (enabled) {
      const timer = setTimeout(() => {
        start();
      }, delay);
      return () => {
        clearTimeout(timer);
        stop();
      };
    }
    stop();
    return undefined;
  }, [enabled, delay, start, stop]);

  const variants: Variants = {
    shimmer: {
      x: direction === 'horizontal' ? [-shimmerWidth, shimmerWidth] : 0,
      y: direction === 'vertical' ? [-shimmerWidth, shimmerWidth] : 0,
      opacity: [0.3, 0.6, 0.3],
      transition: {
        duration: duration / 1000,
        ease: 'linear',
        repeat: Infinity,
        repeatType: 'loop',
      },
    },
    initial: {
      x: direction === 'horizontal' ? -shimmerWidth : 0,
      y: direction === 'vertical' ? -shimmerWidth : 0,
      opacity: 0.3,
    },
  };

  return {
    variants,
    translateX,
    translateY,
    opacity,
    start,
    stop,
  };
}
