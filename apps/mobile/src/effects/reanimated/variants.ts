/**
 * Shared Reanimated Animation Variants
 * 
 * Reusable animation configurations for React Native Reanimated components.
 * All durations are in milliseconds.
 * All variants respect reduced motion preferences.
 * 
 * Location: apps/mobile/src/effects/reanimated/variants.ts
 */

import { FadeIn, FadeOut, SlideInDown, SlideInUp, SlideOutDown, SlideOutUp, ZoomIn, ZoomOut } from 'react-native-reanimated';
import { springConfigs, timingConfigs } from './transitions';
import type { VariantDefinition } from './use-motion-variants';

/**
 * Motion durations matching design tokens (in milliseconds)
 * Enter/exit: 150-300ms
 * Hover/press: 75-150ms
 */
export const motionDurations = {
  fast: 75,
  normal: 150,
  smooth: 240,
  slow: 300,
} as const;

/**
 * Reanimated entry/exit animations with consistent durations
 */
export const entryAnimations = {
  fadeIn: FadeIn.duration(motionDurations.smooth),
  fadeInFast: FadeIn.duration(motionDurations.fast),
  fadeInSlow: FadeIn.duration(motionDurations.slow),
  slideInDown: SlideInDown.springify().damping(20).stiffness(280),
  slideInUp: SlideInUp.springify().damping(20).stiffness(280),
  zoomIn: ZoomIn.springify().damping(20).stiffness(280),
} as const;

export const exitAnimations = {
  fadeOut: FadeOut.duration(motionDurations.normal),
  fadeOutFast: FadeOut.duration(motionDurations.fast),
  fadeOutSlow: FadeOut.duration(motionDurations.slow),
  slideOutDown: SlideOutDown.duration(motionDurations.normal),
  slideOutUp: SlideOutUp.duration(motionDurations.normal),
  zoomOut: ZoomOut.duration(motionDurations.normal),
} as const;

/**
 * Variant definitions for useMotionVariants hook
 */
export const cardVariants: Record<string, VariantDefinition> = {
  hidden: {
    opacity: 0,
    scale: 0.98,
    translateY: 20,
    transition: {
      type: 'tween',
      duration: motionDurations.normal,
    },
  },
  visible: {
    opacity: 1,
    scale: 1,
    translateY: 0,
    transition: {
      type: 'spring',
      stiffness: springConfigs.smooth.stiffness,
      damping: springConfigs.smooth.damping,
      duration: motionDurations.smooth,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    translateY: -10,
    transition: {
      type: 'tween',
      duration: motionDurations.normal,
    },
  },
  hover: {
    scale: 1.02,
    translateY: -4,
    transition: {
      type: 'tween',
      duration: motionDurations.normal,
    },
  },
  tap: {
    scale: 0.98,
    transition: {
      type: 'tween',
      duration: motionDurations.fast,
    },
  },
};

export const buttonVariants: Record<string, VariantDefinition> = {
  rest: {
    scale: 1,
    translateY: 0,
    transition: {
      type: 'tween',
      duration: motionDurations.fast,
    },
  },
  hover: {
    scale: 1.02,
    translateY: -2,
    transition: {
      type: 'tween',
      duration: motionDurations.normal,
    },
  },
  tap: {
    scale: 0.96,
    translateY: 0,
    transition: {
      type: 'tween',
      duration: motionDurations.fast,
    },
  },
  pressed: {
    scale: 0.94,
    translateY: 1,
    transition: {
      type: 'tween',
      duration: motionDurations.fast,
    },
  },
};

export const dialogVariants: Record<string, VariantDefinition> = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    translateY: 20,
    transition: {
      type: 'spring',
      stiffness: springConfigs.smooth.stiffness,
      damping: springConfigs.smooth.damping,
      duration: motionDurations.smooth,
    },
  },
  visible: {
    opacity: 1,
    scale: 1,
    translateY: 0,
    transition: {
      type: 'spring',
      stiffness: springConfigs.smooth.stiffness,
      damping: springConfigs.smooth.damping,
      duration: motionDurations.smooth,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    translateY: 20,
    transition: {
      type: 'tween',
      duration: motionDurations.normal,
    },
  },
};

export const badgeVariants: Record<string, VariantDefinition> = {
  hidden: {
    opacity: 0,
    scale: 0.8,
    transition: {
      type: 'spring',
      stiffness: springConfigs.snappy.stiffness,
      damping: springConfigs.snappy.damping,
      duration: motionDurations.normal,
    },
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: springConfigs.snappy.stiffness,
      damping: springConfigs.snappy.damping,
      duration: motionDurations.normal,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    transition: {
      type: 'tween',
      duration: motionDurations.fast,
    },
  },
};

/**
 * Stagger container configuration
 */
export const staggerConfig = {
  delay: 100, // milliseconds between items
  initialDelay: 50, // initial delay before first item
} as const;

/**
 * Helper to create staggered item variants
 */
export function createStaggerItemVariants(index: number): VariantDefinition {
  return {
    opacity: 0,
    translateY: 20,
    transition: {
      type: 'spring',
      stiffness: springConfigs.smooth.stiffness,
      damping: springConfigs.smooth.damping,
      delay: staggerConfig.initialDelay + index * staggerConfig.delay,
      duration: motionDurations.smooth,
    },
  };
}

/**
 * Export spring and timing configs for convenience
 */
export { springConfigs, timingConfigs };

