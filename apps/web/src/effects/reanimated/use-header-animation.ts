'use client';

import { useMotionValue, animate, type MotionValue } from 'framer-motion';
import { useEffect } from 'react';
import type { CSSProperties } from 'react';

export interface UseHeaderAnimationOptions {
  delay?: number;
}

export interface UseHeaderAnimationReturn {
  y: MotionValue<number>;
  opacity: MotionValue<number>;
  shimmerX: MotionValue<number>;
  shimmerOpacity: MotionValue<number>;
  headerStyle: CSSProperties;
  shimmerStyle: CSSProperties;
}

export function useHeaderAnimation(
  options: UseHeaderAnimationOptions = {}
): UseHeaderAnimationReturn {
  const { delay = 0.1 } = options;

  const y = useMotionValue(-100);
  const opacity = useMotionValue(0);
  const shimmerX = useMotionValue(-100);
  const shimmerOpacity = useMotionValue(0);

  useEffect(() => {
    const delayMs = delay;
    animate(y, 0, {
      delay: delayMs,
      duration: 0.4,
      ease: 'easeOut',
    });
    animate(opacity, 1, {
      delay: delayMs,
      duration: 0.4,
      ease: 'easeOut',
    });

    animate(shimmerX, [-100, 100], {
      repeat: Infinity,
      duration: 3,
      ease: 'linear',
      times: [0, 1],
    });

    animate(shimmerOpacity, [0, 0.5, 0], {
      repeat: Infinity,
      duration: 3,
      ease: 'easeInOut',
      times: [0, 0.5, 1],
    });
  }, [delay, y, opacity, shimmerX, shimmerOpacity]);

  return {
    y,
    opacity,
    shimmerX,
    shimmerOpacity,
    headerStyle: {
      transform: `translateY(${y.get()}px)`,
      opacity: opacity.get(),
    },
    shimmerStyle: {
      transform: `translateX(${shimmerX.get()}%)`,
      opacity: shimmerOpacity.get(),
    },
  };
}
