'use client';

import { useMotionValue, type MotionValue, type Variants } from 'framer-motion';
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
  opacity: MotionValue<number>;
  scale: MotionValue<number>;
  translateY: MotionValue<number>;
  x: MotionValue<number>;
  y: MotionValue<number>;
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

  const opacity = useMotionValue(initialOpacity);
  const scale = useMotionValue(initialScale);
  const translateY = useMotionValue(initialY);
  const x = useMotionValue(0);
  const y = useMotionValue(initialY);

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
    opacity,
    scale,
    translateY,
    x,
    y,
  };
}

