'use client';

import { useMotionValue, animate, type MotionValue } from 'framer-motion';
import { useEffect } from 'react';
import { useMotionStyle } from './use-motion-style';
import type { CSSProperties } from 'react';

export interface UsePageTransitionOptions {
  isVisible: boolean;
  duration?: number;
  delay?: number;
  direction?: 'up' | 'down' | 'fade';
}

export interface UsePageTransitionReturn {
  opacity: MotionValue<number>;
  translateY: MotionValue<number>;
  scale: MotionValue<number>;
  style: CSSProperties;
}

export function usePageTransition(options: UsePageTransitionOptions): UsePageTransitionReturn {
  const { isVisible, duration = 300, delay = 0, direction = 'up' } = options;

  const opacity = useMotionValue(0);
  const translateY = useMotionValue(direction === 'up' ? 30 : direction === 'down' ? -30 : 0);
  const scale = useMotionValue(0.98);

  useEffect(() => {
    if (isVisible) {
      const delaySeconds = delay;
      void animate(opacity, 1, {
        delay: delaySeconds,
        duration: duration / 1000,
        ease: 'easeOut',
      });
      void animate(translateY, 0, {
        delay: delaySeconds,
        duration: duration / 1000,
        ease: 'easeOut',
      });
      void animate(scale, 1, {
        delay: delaySeconds,
        duration: duration / 1000,
        ease: 'easeOut',
      });
    } else {
      void animate(opacity, 0, {
        duration: duration / 1000,
        ease: 'easeIn',
      });
      void animate(translateY, direction === 'up' ? -30 : 30, {
        duration: duration / 1000,
        ease: 'easeIn',
      });
      void animate(scale, 0.98, {
        duration: duration / 1000,
        ease: 'easeIn',
      });
    }
  }, [isVisible, duration, delay, direction, opacity, translateY, scale]);

  const style = useMotionStyle(() => {
    return {
      opacity: opacity.get(),
      transform: [
        { translateY: translateY.get() },
        { scale: scale.get() },
      ],
    };
  });

  return {
    opacity,
    translateY,
    scale,
    style,
  };
}
