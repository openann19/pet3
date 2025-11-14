'use client';

import type { Variants } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { buttonPressVariants } from '../variants';
import { springConfigs, motionDurations } from '../variants';

export interface UseHeaderButtonAnimationOptions {
  delay?: number;
  scale?: number;
  translateY?: number;
  rotation?: number;
}

export interface UseHeaderButtonAnimationReturn {
  variants: Variants;
  initial: 'hidden' | false;
  animate: 'visible' | false;
}

export function useHeaderButtonAnimation(
  options: UseHeaderButtonAnimationOptions = {}
): UseHeaderButtonAnimationReturn {
  const {
    delay = 0,
    scale: hoverScaleValue = 1.12,
    translateY: hoverYValue = -3,
    rotation: hoverRotationValue = -5,
  } = options;

  const prefersReducedMotion = useReducedMotion();
  const shouldAnimate = !prefersReducedMotion;

  const variants: Variants = {
    hidden: {
      opacity: 0,
      scale: 0.8,
    },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        delay,
        opacity: {
          duration: motionDurations.smooth,
          ease: 'easeOut',
        },
        scale: {
          ...springConfigs.smooth,
        },
      },
    },
    hover: {
      scale: hoverScaleValue,
      y: hoverYValue,
      rotate: hoverRotationValue,
      transition: {
        ...springConfigs.smooth,
      },
    },
    tap: {
      scale: 0.9,
      transition: {
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

