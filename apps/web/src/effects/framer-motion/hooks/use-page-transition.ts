'use client';

import type { Variants } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { springConfigs, motionDurations } from '../variants';

export interface UsePageTransitionOptions {
  isVisible: boolean;
  duration?: number;
  delay?: number;
  direction?: 'up' | 'down' | 'fade';
}

export interface UsePageTransitionReturn {
  variants: Variants;
  initial: 'hidden' | false;
  animate: 'visible' | 'hidden' | false;
}

export function usePageTransition(options: UsePageTransitionOptions): UsePageTransitionReturn {
  const { isVisible, duration = motionDurations.smooth, delay = 0, direction = 'up' } = options;

  const prefersReducedMotion = useReducedMotion();
  const shouldAnimate = !prefersReducedMotion;

  const getInitialY = () => {
    if (direction === 'up') return 30;
    if (direction === 'down') return -30;
    return 0;
  };

  const getExitY = () => {
    if (direction === 'up') return -30;
    if (direction === 'down') return 30;
    return 0;
  };

  const variants: Variants = {
    hidden: {
      opacity: 0,
      y: getInitialY(),
      scale: 0.98,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        delay: delay / 1000,
        ...springConfigs.smooth,
        duration,
      },
    },
    exit: {
      opacity: 0,
      y: getExitY(),
      scale: 0.98,
      transition: {
        duration: motionDurations.normal,
      },
    },
  };

  return {
    variants: shouldAnimate ? variants : undefined,
    initial: shouldAnimate ? 'hidden' : false,
    animate: shouldAnimate ? (isVisible ? 'visible' : 'hidden') : false,
  };
}

