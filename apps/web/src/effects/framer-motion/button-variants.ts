/**
 * Button Animation Variants
 * 
 * Reusable Framer Motion variants for button interactions.
 * Includes hover, tap, focus, and disabled states with reduced motion support.
 * 
 * Location: apps/web/src/effects/framer-motion/button-variants.ts
 */

import type { Variants } from 'framer-motion';
import { motionDurations, springConfigs, easing } from './variants';

/**
 * Base button variants for hover, tap, and focus states
 */
export const buttonVariants: Variants = {
  rest: {
    scale: 1,
    transition: {
      duration: motionDurations.normal,
      ease: easing.standard,
    },
  },
  hover: {
    scale: 1.02,
    transition: {
      duration: motionDurations.normal,
      ease: easing.standard,
    },
  },
  tap: {
    scale: 0.98,
    transition: {
      duration: motionDurations.fast,
      ease: easing.standard,
    },
  },
  focus: {
    scale: 1,
    transition: {
      duration: motionDurations.fast,
      ease: easing.standard,
    },
  },
  disabled: {
    scale: 1,
    opacity: 0.6,
    transition: {
      duration: motionDurations.normal,
      ease: easing.standard,
    },
  },
};

/**
 * Primary button variants with glow effect
 */
export const primaryButtonVariants: Variants = {
  rest: {
    scale: 1,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    transition: {
      duration: motionDurations.normal,
      ease: easing.standard,
    },
  },
  hover: {
    scale: 1.02,
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15), 0 0 20px rgba(255, 154, 73, 0.3)',
    transition: {
      ...springConfigs.smooth,
      duration: motionDurations.normal,
    },
  },
  tap: {
    scale: 0.98,
    boxShadow: '0 1px 4px rgba(0, 0, 0, 0.1)',
    transition: {
      duration: motionDurations.fast,
      ease: easing.standard,
    },
  },
  focus: {
    scale: 1,
    boxShadow: '0 0 0 3px rgba(255, 154, 73, 0.3)',
    transition: {
      duration: motionDurations.fast,
      ease: easing.standard,
    },
  },
  disabled: {
    scale: 1,
    opacity: 0.6,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    transition: {
      duration: motionDurations.normal,
      ease: easing.standard,
    },
  },
};

/**
 * Secondary button variants
 */
export const secondaryButtonVariants: Variants = {
  rest: {
    scale: 1,
    transition: {
      duration: motionDurations.normal,
      ease: easing.standard,
    },
  },
  hover: {
    scale: 1.02,
    transition: {
      ...springConfigs.smooth,
      duration: motionDurations.normal,
    },
  },
  tap: {
    scale: 0.98,
    transition: {
      duration: motionDurations.fast,
      ease: easing.standard,
    },
  },
  focus: {
    scale: 1,
    transition: {
      duration: motionDurations.fast,
      ease: easing.standard,
    },
  },
  disabled: {
    scale: 1,
    opacity: 0.6,
    transition: {
      duration: motionDurations.normal,
      ease: easing.standard,
    },
  },
};

/**
 * Ghost button variants (minimal styling)
 */
export const ghostButtonVariants: Variants = {
  rest: {
    scale: 1,
    opacity: 0.8,
    transition: {
      duration: motionDurations.normal,
      ease: easing.standard,
    },
  },
  hover: {
    scale: 1.05,
    opacity: 1,
    transition: {
      ...springConfigs.smooth,
      duration: motionDurations.normal,
    },
  },
  tap: {
    scale: 0.95,
    transition: {
      duration: motionDurations.fast,
      ease: easing.standard,
    },
  },
  focus: {
    scale: 1,
    opacity: 1,
    transition: {
      duration: motionDurations.fast,
      ease: easing.standard,
    },
  },
  disabled: {
    scale: 1,
    opacity: 0.4,
    transition: {
      duration: motionDurations.normal,
      ease: easing.standard,
    },
  },
};

/**
 * Destructive button variants
 */
export const destructiveButtonVariants: Variants = {
  rest: {
    scale: 1,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    transition: {
      duration: motionDurations.normal,
      ease: easing.standard,
    },
  },
  hover: {
    scale: 1.02,
    boxShadow: '0 4px 16px rgba(220, 38, 38, 0.2), 0 0 20px rgba(220, 38, 38, 0.15)',
    transition: {
      ...springConfigs.smooth,
      duration: motionDurations.normal,
    },
  },
  tap: {
    scale: 0.98,
    boxShadow: '0 1px 4px rgba(0, 0, 0, 0.1)',
    transition: {
      duration: motionDurations.fast,
      ease: easing.standard,
    },
  },
  focus: {
    scale: 1,
    boxShadow: '0 0 0 3px rgba(220, 38, 38, 0.3)',
    transition: {
      duration: motionDurations.fast,
      ease: easing.standard,
    },
  },
  disabled: {
    scale: 1,
    opacity: 0.6,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    transition: {
      duration: motionDurations.normal,
      ease: easing.standard,
    },
  },
};

/**
 * Icon button variants (circular/square icon buttons)
 */
export const iconButtonVariants: Variants = {
  rest: {
    scale: 1,
    rotate: 0,
    transition: {
      duration: motionDurations.normal,
      ease: easing.standard,
    },
  },
  hover: {
    scale: 1.1,
    rotate: 0,
    transition: {
      ...springConfigs.smooth,
      duration: motionDurations.normal,
    },
  },
  tap: {
    scale: 0.9,
    rotate: 0,
    transition: {
      duration: motionDurations.fast,
      ease: easing.standard,
    },
  },
  focus: {
    scale: 1,
    rotate: 0,
    transition: {
      duration: motionDurations.fast,
      ease: easing.standard,
    },
  },
  disabled: {
    scale: 1,
    opacity: 0.5,
    rotate: 0,
    transition: {
      duration: motionDurations.normal,
      ease: easing.standard,
    },
  },
};

/**
 * Helper to get button variants based on variant type
 */
export function getButtonVariants(
  variant: 'primary' | 'secondary' | 'ghost' | 'destructive' | 'icon' = 'primary'
): Variants {
  switch (variant) {
    case 'primary':
      return primaryButtonVariants;
    case 'secondary':
      return secondaryButtonVariants;
    case 'ghost':
      return ghostButtonVariants;
    case 'destructive':
      return destructiveButtonVariants;
    case 'icon':
      return iconButtonVariants;
    default:
      return buttonVariants;
  }
}

/**
 * Reduced motion variants for buttons (simplified)
 */
export const reducedMotionButtonVariants: Variants = {
  rest: {
    opacity: 1,
  },
  hover: {
    opacity: 0.9,
    transition: {
      duration: motionDurations.fast,
    },
  },
  tap: {
    opacity: 0.8,
    transition: {
      duration: motionDurations.fast,
    },
  },
  focus: {
    opacity: 1,
  },
  disabled: {
    opacity: 0.6,
  },
};

