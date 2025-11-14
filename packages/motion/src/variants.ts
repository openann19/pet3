/**
 * Reusable Framer Motion Animation Variants
 * 
 * Common animation patterns that respect reduced motion preferences
 * and follow the global UX design system.
 */

import type { Variants, Transition } from 'framer-motion';
import { useReducedMotion } from './reduced-motion';

/**
 * Modal/Dialog variants for entrance and exit animations
 */
export const modalVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring',
      damping: 25,
      stiffness: 400,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    transition: {
      duration: 0.15,
    },
  },
};

/**
 * Backdrop/Overlay variants
 */
export const backdropVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 0.5,
    transition: {
      duration: 0.15,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.15,
    },
  },
};

/**
 * Slide up animation (for bottom sheets, modals from bottom)
 */
export const slideUpVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      damping: 25,
      stiffness: 400,
    },
  },
  exit: {
    opacity: 0,
    y: 20,
    transition: {
      duration: 0.15,
    },
  },
};

/**
 * Slide down animation (for dropdowns, menus)
 */
export const slideDownVariants: Variants = {
  hidden: {
    opacity: 0,
    y: -20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      damping: 25,
      stiffness: 400,
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.15,
    },
  },
};

/**
 * Fade in/out animation
 */
export const fadeVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.2,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.15,
    },
  },
};

/**
 * Scale in/out animation
 */
export const scaleVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.9,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring',
      damping: 25,
      stiffness: 400,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    transition: {
      duration: 0.15,
    },
  },
};

/**
 * Stagger container for list animations
 */
export const staggerContainerVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

/**
 * Stagger item for list items
 */
export const staggerItemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 10,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      damping: 25,
      stiffness: 400,
    },
  },
};

/**
 * Helper to apply reduced motion to variants
 * Returns variants with instant transitions when reduced motion is enabled
 */
export function getVariantsWithReducedMotion(
  variants: Variants,
  prefersReducedMotion: boolean
): Variants {
  if (!prefersReducedMotion) {
    return variants;
  }

  // Create a copy with instant transitions
  const reducedVariants: Variants = {};
  
  for (const [key, value] of Object.entries(variants)) {
    if (value && typeof value === 'object' && 'transition' in value) {
      reducedVariants[key] = {
        ...value,
        transition: {
          duration: 0,
          delay: 0,
        },
      };
    } else {
      reducedVariants[key] = value;
    }
  }

  return reducedVariants;
}

/**
 * Hook to get variants with reduced motion applied
 */
export function useVariantsWithReducedMotion(variants: Variants): Variants {
  const prefersReducedMotion = useReducedMotion();
  return getVariantsWithReducedMotion(variants, prefersReducedMotion);
}

/**
 * Common transition presets for Framer Motion
 */
export const transitions = {
  fast: {
    duration: 0.15,
    ease: 'easeOut' as const,
  },
  smooth: {
    type: 'spring' as const,
    damping: 25,
    stiffness: 400,
  },
  bouncy: {
    type: 'spring' as const,
    damping: 15,
    stiffness: 500,
  },
  gentle: {
    type: 'spring' as const,
    damping: 30,
    stiffness: 300,
    mass: 0.8,
  },
} satisfies Record<string, Transition>;

