'use client';

import type { Variants } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { springConfigs, motionDurations } from '../variants';

export interface UseEntryAnimationOptions {
  delay?: number;
  duration?: number;
  initialY?: number;
  initialOpacity?: number;
  initialScale?: number;
  enabled?: boolean;
}

export interface UseEntryAnimationReturn {
  variants: Variants;
  initial: 'hidden' | false;
  animate: 'visible' | false;
}

export function useEntryAnimation(options: UseEntryAnimationOptions = {}): UseEntryAnimationReturn {
  const {
    delay = 0,
    duration = motionDurations.smooth,
    initialY = 20,
    initialOpacity = 0,
    initialScale = 0.95,
    enabled = true,
  } = options;

  const prefersReducedMotion = useReducedMotion();
  const shouldAnimate = enabled && !prefersReducedMotion;

  const variants: Variants = {
    hidden: {
      opacity: initialOpacity,
      y: initialY,
      scale: initialScale,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        delay: delay / 1000,
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

