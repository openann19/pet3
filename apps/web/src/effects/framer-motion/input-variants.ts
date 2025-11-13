/**
 * Input Animation Variants
 * 
 * Reusable Framer Motion variants for input field interactions.
 * Includes focus, error, and disabled states with reduced motion support.
 * 
 * Location: apps/web/src/effects/framer-motion/input-variants.ts
 */

import type { Variants } from 'framer-motion';
import { motionDurations, springConfigs, easing } from './variants';

/**
 * Base input variants for focus and interaction states
 */
export const inputVariants: Variants = {
  rest: {
    scale: 1,
    borderColor: 'var(--border)',
    transition: {
      duration: motionDurations.normal,
      ease: easing.standard,
    },
  },
  focus: {
    scale: 1.01,
    borderColor: 'var(--ring)',
    boxShadow: '0 0 0 3px rgba(255, 154, 73, 0.1)',
    transition: {
      ...springConfigs.smooth,
      duration: motionDurations.normal,
    },
  },
  error: {
    scale: 1,
    borderColor: 'var(--destructive)',
    boxShadow: '0 0 0 3px rgba(220, 38, 38, 0.1)',
    transition: {
      duration: motionDurations.normal,
      ease: easing.standard,
    },
  },
  disabled: {
    scale: 1,
    opacity: 0.6,
    borderColor: 'var(--border)',
    transition: {
      duration: motionDurations.normal,
      ease: easing.standard,
    },
  },
};

/**
 * Input container variants (wrapper around input)
 */
export const inputContainerVariants: Variants = {
  rest: {
    scale: 1,
    transition: {
      duration: motionDurations.normal,
      ease: easing.standard,
    },
  },
  focus: {
    scale: 1.01,
    transition: {
      ...springConfigs.smooth,
      duration: motionDurations.normal,
    },
  },
  error: {
    scale: 1,
    transition: {
      duration: motionDurations.normal,
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
 * Input label variants (for floating labels or animated labels)
 */
export const inputLabelVariants: Variants = {
  rest: {
    scale: 1,
    y: 0,
    opacity: 0.7,
    transition: {
      duration: motionDurations.normal,
      ease: easing.standard,
    },
  },
  focus: {
    scale: 0.9,
    y: -4,
    opacity: 1,
    transition: {
      ...springConfigs.smooth,
      duration: motionDurations.normal,
    },
  },
  filled: {
    scale: 0.9,
    y: -4,
    opacity: 1,
    transition: {
      duration: motionDurations.normal,
      ease: easing.standard,
    },
  },
  error: {
    scale: 0.9,
    y: -4,
    opacity: 1,
    color: 'var(--destructive)',
    transition: {
      duration: motionDurations.normal,
      ease: easing.standard,
    },
  },
};

/**
 * Input error message variants
 */
export const inputErrorVariants: Variants = {
  hidden: {
    opacity: 0,
    y: -8,
    height: 0,
    transition: {
      duration: motionDurations.fast,
      ease: easing.accelerate,
    },
  },
  visible: {
    opacity: 1,
    y: 0,
    height: 'auto',
    transition: {
      ...springConfigs.smooth,
      duration: motionDurations.normal,
    },
  },
};

/**
 * Input helper text variants
 */
export const inputHelperVariants: Variants = {
  hidden: {
    opacity: 0,
    y: -4,
    transition: {
      duration: motionDurations.fast,
      ease: easing.accelerate,
    },
  },
  visible: {
    opacity: 0.7,
    y: 0,
    transition: {
      duration: motionDurations.normal,
      ease: easing.standard,
    },
  },
};

/**
 * Search input variants (with icon)
 */
export const searchInputVariants: Variants = {
  rest: {
    scale: 1,
    borderColor: 'var(--border)',
    transition: {
      duration: motionDurations.normal,
      ease: easing.standard,
    },
  },
  focus: {
    scale: 1.01,
    borderColor: 'var(--ring)',
    boxShadow: '0 0 0 3px rgba(255, 154, 73, 0.1), 0 4px 12px rgba(0, 0, 0, 0.05)',
    transition: {
      ...springConfigs.smooth,
      duration: motionDurations.normal,
    },
  },
  error: {
    scale: 1,
    borderColor: 'var(--destructive)',
    boxShadow: '0 0 0 3px rgba(220, 38, 38, 0.1)',
    transition: {
      duration: motionDurations.normal,
      ease: easing.standard,
    },
  },
  disabled: {
    scale: 1,
    opacity: 0.6,
    borderColor: 'var(--border)',
    transition: {
      duration: motionDurations.normal,
      ease: easing.standard,
    },
  },
};

/**
 * Textarea variants
 */
export const textareaVariants: Variants = {
  rest: {
    scale: 1,
    borderColor: 'var(--border)',
    transition: {
      duration: motionDurations.normal,
      ease: easing.standard,
    },
  },
  focus: {
    scale: 1.005,
    borderColor: 'var(--ring)',
    boxShadow: '0 0 0 3px rgba(255, 154, 73, 0.1)',
    transition: {
      ...springConfigs.smooth,
      duration: motionDurations.normal,
    },
  },
  error: {
    scale: 1,
    borderColor: 'var(--destructive)',
    boxShadow: '0 0 0 3px rgba(220, 38, 38, 0.1)',
    transition: {
      duration: motionDurations.normal,
      ease: easing.standard,
    },
  },
  disabled: {
    scale: 1,
    opacity: 0.6,
    borderColor: 'var(--border)',
    transition: {
      duration: motionDurations.normal,
      ease: easing.standard,
    },
  },
};

/**
 * Reduced motion variants for inputs (simplified)
 */
export const reducedMotionInputVariants: Variants = {
  rest: {
    opacity: 1,
  },
  focus: {
    opacity: 1,
    transition: {
      duration: motionDurations.fast,
    },
  },
  error: {
    opacity: 1,
    transition: {
      duration: motionDurations.fast,
    },
  },
  disabled: {
    opacity: 0.6,
  },
};

