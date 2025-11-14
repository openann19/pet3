'use client';

import type { Variants } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { springConfigs, motionDurations } from '../variants';

export interface UseNavBarAnimationOptions {
  delay?: number;
}

export interface UseNavBarAnimationReturn {
  variants: Variants;
  initial: 'hidden' | false;
  animate: 'visible' | false;
}

export function useNavBarAnimation(
  options: UseNavBarAnimationOptions = {}
): UseNavBarAnimationReturn {
  const { delay = 0.2 } = options;

  const prefersReducedMotion = useReducedMotion();
  const shouldAnimate = !prefersReducedMotion;

  const variants: Variants = {
    hidden: {
      opacity: 0,
      y: 100,
      scale: 0.95,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        delay,
        ...springConfigs.smooth,
        scale: {
          duration: motionDurations.smooth,
          ease: 'easeOut',
        },
      },
    },
  };

  return {
    variants: shouldAnimate ? variants : undefined,
    initial: shouldAnimate ? 'hidden' : false,
    animate: shouldAnimate ? 'visible' : false,
  };
}

