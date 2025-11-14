'use client';

import { useMotionValue, useSpring, MotionValue } from 'framer-motion';
import { useEffect } from 'react';
import type { AnimatedStyle } from '@/effects/reanimated/animated-view';

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
  style: AnimatedStyle;
}

export function usePageTransition(options: UsePageTransitionOptions): UsePageTransitionReturn {
  const { isVisible, duration = 300, delay = 0, direction = 'up' } = options;

  const opacity = useMotionValue(0);
  const translateY = useMotionValue(direction === 'up' ? 30 : direction === 'down' ? -30 : 0);
  const scale = useMotionValue(0.98);

  // Create spring animations
  const opacitySpring = useSpring(opacity, { stiffness: 400, damping: 30 });
  const translateYSpring = useSpring(translateY, { stiffness: 400, damping: 30 });
  const scaleSpring = useSpring(scale, { stiffness: 400, damping: 30 });

  useEffect(() => {
    if (isVisible) {
      const delayMs = delay * 1000;
      setTimeout(() => {
        opacity.set(1);
        translateY.set(0);
        scale.set(1);
      }, delayMs);
    } else {
      opacity.set(0);
      translateY.set(direction === 'up' ? -30 : 30);
      scale.set(0.98);
    }
  }, [isVisible, duration, delay, direction, opacity, translateY, scale]);

  const style: AnimatedStyle = {
    opacity: opacitySpring,
    transform: [
      { translateY: translateYSpring },
      { scale: scaleSpring }
    ],
  };

  return {
    opacity: opacitySpring,
    translateY: translateYSpring,
    scale: scaleSpring,
    style,
  };
}
