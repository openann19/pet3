'use client';

import type { Variants } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { dialogVariants } from '../variants';

export interface UseModalAnimationOptions {
  isVisible: boolean;
  duration?: number;
  delay?: number;
}

export interface UseModalAnimationReturn {
  variants: Variants;
  initial: 'hidden' | false;
  animate: 'visible' | 'hidden' | false;
}

/**
 * Hook for modal/dialog animations using Framer Motion variants
 * Uses centralized dialogVariants from variants.ts
 */
export function useModalAnimation(options: UseModalAnimationOptions): UseModalAnimationReturn {
  const { isVisible, delay = 0 } = options;

  const prefersReducedMotion = useReducedMotion();
  const shouldAnimate = !prefersReducedMotion;

  const variants: Variants = {
    ...dialogVariants,
    visible: {
      ...dialogVariants.visible,
      transition: {
        ...dialogVariants.visible.transition,
        delay: delay / 1000,
      },
    },
  };

  return {
    variants: shouldAnimate ? variants : undefined,
    initial: shouldAnimate ? 'hidden' : false,
    animate: shouldAnimate ? (isVisible ? 'visible' : 'hidden') : false,
  };
}

