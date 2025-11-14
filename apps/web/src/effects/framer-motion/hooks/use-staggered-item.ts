'use client';

import type { Variants } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { springConfigs, motionDurations } from '../variants';

export interface UseStaggeredItemOptions {
  index: number;
  delay?: number;
  staggerDelay?: number;
}

export interface UseStaggeredItemReturn {
  variants: Variants;
  initial: 'hidden' | false;
  animate: 'visible' | false;
}

/**
 * Hook for staggered list item animations using Framer Motion variants
 */
export function useStaggeredItem(options: UseStaggeredItemOptions): UseStaggeredItemReturn {
  const { index, delay = 0, staggerDelay = 0.05 } = options;

  const prefersReducedMotion = useReducedMotion();
  const shouldAnimate = !prefersReducedMotion;

  const variants: Variants = {
    hidden: {
      opacity: 0,
      y: 20,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        delay: (delay / 1000) + (index * staggerDelay),
        ...springConfigs.smooth,
      },
    },
  };

  return {
    variants: shouldAnimate ? variants : undefined,
    initial: shouldAnimate ? 'hidden' : false,
    animate: shouldAnimate ? 'visible' : false,
  };
}

