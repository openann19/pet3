'use client';


import { useEffect } from 'react';
import type { MotionValue } from 'framer-motion';
import { useMotionValue, animate } from 'framer-motion';
import { springConfigs, timingConfigs } from './transitions';
import type { AnimatedStyle } from './animated-view';


export type SlideDirection = 'left' | 'right' | 'up' | 'down';


export interface UseSlideAnimationOptions {
  readonly direction?: SlideDirection;
  readonly initial?: boolean;
  readonly distance?: number;
  readonly duration?: number;
  readonly enabled?: boolean;
  readonly useSpring?: boolean;
}

export interface UseSlideAnimationResult {
  readonly animatedStyle: AnimatedStyle;
  readonly translateX: MotionValue<number>;
  readonly translateY: MotionValue<number>;
  readonly slideIn: () => void;
  readonly slideOut: () => void;
  readonly toggle: () => void;
}


export function useSlideAnimation(options: UseSlideAnimationOptions = {}): UseSlideAnimationResult {
  const {
    direction = 'up',
    initial = true,
    distance = 40,
    duration = timingConfigs.smooth.duration,
    enabled = true,
    useSpring = false,
  } = options;


  const getInitialValues = () => {
    if (!enabled) return { x: 0, y: 0 };
    if (initial) return { x: 0, y: 0 };

    switch (direction) {
      case 'left':
        return { x: -distance, y: 0 };
      case 'right':
        return { x: distance, y: 0 };
      case 'up':
        return { x: 0, y: -distance };
      case 'down':
        return { x: 0, y: distance };
      default:
        return { x: 0, y: 0 };
    }
  };

  const initialValues = getInitialValues();
  const translateX = useMotionValue(initialValues.x);
  const translateY = useMotionValue(initialValues.y);

  const slideIn = () => {
    if (!enabled) return;
    if (useSpring) {
      animate(translateX, 0, { type: 'spring', ...springConfigs.smooth });
      animate(translateY, 0, { type: 'spring', ...springConfigs.smooth });
    } else {
      animate(translateX, 0, { duration: (duration ?? 300) / 1000 });
      animate(translateY, 0, { duration: (duration ?? 300) / 1000 });
    }
  };

  const slideOut = () => {
    if (!enabled) return;
    const targetX = direction === 'left' ? -distance : direction === 'right' ? distance : 0;
    const targetY = direction === 'up' ? -distance : direction === 'down' ? distance : 0;

    if (useSpring) {
      animate(translateX, targetX, { type: 'spring', ...springConfigs.smooth });
      animate(translateY, targetY, { type: 'spring', ...springConfigs.smooth });
    } else {
      animate(translateX, targetX, { duration: (duration ?? 300) / 1000 });
      animate(translateY, targetY, { duration: (duration ?? 300) / 1000 });
    }
  };

  const toggle = () => {
    const isVisible = translateX.get() === 0 && translateY.get() === 0;
    if (isVisible) {
      slideOut();
    } else {
      slideIn();
    }
  };

  useEffect(() => {
    if (!enabled) {
      translateX.set(0);
      translateY.set(0);
      return;
    }
    if (initial) {
      slideIn();
    } else {
      slideOut();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, initial]);

  const animatedStyle: AnimatedStyle = {
    transform: [
      { translateX },
      { translateY },
    ],
  };

  return {
    animatedStyle,
    translateX,
    translateY,
    slideIn,
    slideOut,
    toggle,
  };
}
