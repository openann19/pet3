'use client';

import { useMotionValue, animate, type MotionValue } from 'framer-motion';
import { useEffect, useState } from 'react';
import { springConfigs } from '@/effects/reanimated/transitions';
import { useMotionStyle } from './use-motion-style';
import type { CSSProperties } from 'react';

export interface UsePageTransitionWrapperOptions {
  key: string;
  duration?: number;
  direction?: 'up' | 'down' | 'fade';
}

export interface UsePageTransitionWrapperReturn {
  opacity: MotionValue<number>;
  translateY: MotionValue<number>;
  scale: MotionValue<number>;
  style: CSSProperties;
  isVisible: boolean;
}

export function usePageTransitionWrapper(
  options: UsePageTransitionWrapperOptions
): UsePageTransitionWrapperReturn {
  const { key, duration = 300, direction = 'up' } = options;

  const [isVisible, setIsVisible] = useState(false);
  const opacity = useMotionValue(0);
  const translateY = useMotionValue(direction === 'up' ? 30 : direction === 'down' ? -30 : 0);
  const scale = useMotionValue(0.98);

  useEffect(() => {
    setIsVisible(true);
    void animate(opacity, 1, {
      duration: duration / 1000,
      ease: 'easeOut',
    });
    void animate(translateY, 0, {
      ...springConfigs.smooth,
    });
    void animate(scale, 1, {
      ...springConfigs.smooth,
    });

    return () => {
      void animate(opacity, 0, {
        duration: (duration * 0.5) / 1000,
        ease: 'easeIn',
      });
      void animate(translateY, direction === 'up' ? -30 : 30, {
        duration: (duration * 0.5) / 1000,
        ease: 'easeIn',
      });
      void animate(scale, 0.98, {
        duration: (duration * 0.5) / 1000,
        ease: 'easeIn',
      });
      setIsVisible(false);
    };
  }, [key, duration, direction, opacity, translateY, scale]);

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
    isVisible,
  };
}
