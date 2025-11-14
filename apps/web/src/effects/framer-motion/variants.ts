/**
 * Shared Framer Motion Animation Variants
 * 
 * Reusable animation configurations for Framer Motion components.
 * All durations are in seconds (Framer Motion standard).
 * All variants respect prefers-reduced-motion.
 * Uses design tokens for shadows and spacing where applicable.
 * 
 * Location: apps/web/src/effects/framer-motion/variants.ts
 */

import type { Variants } from 'framer-motion';
import { getShadow } from '@/lib/design-tokens';

/**
 * Motion durations from design tokens (converted from ms to seconds)
 * Enter/exit: 150-300ms (0.15-0.3s)
 * Hover/press: 75-150ms (0.075-0.15s)
 */
export const motionDurations = {
  fast: 0.075, // 75ms
  normal: 0.15, // 150ms
  smooth: 0.24, // 240ms
  slow: 0.3, // 300ms
} as const;

/**
 * Spring configurations matching design system
 */
export const springConfigs = {
  gentle: {
    type: 'spring' as const,
    damping: 30,
    stiffness: 300,
    mass: 0.8,
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
  snappy: {
    type: 'spring' as const,
    damping: 20,
    stiffness: 600,
  },
} as const;

/**
 * Easing functions matching design system
 */
export const easing = {
  standard: [0.2, 0, 0, 1] as [number, number, number, number],
  decelerate: [0, 0, 0.2, 1] as [number, number, number, number],
  accelerate: [0.4, 0, 1, 1] as [number, number, number, number],
  emphasized: [0.2, 0, 0, 1] as [number, number, number, number],
} as const;

/**
 * Base transitions
 */
export const transitions = {
  fast: {
    duration: motionDurations.fast,
    ease: easing.standard,
  },
  normal: {
    duration: motionDurations.normal,
    ease: easing.standard,
  },
  smooth: {
    duration: motionDurations.smooth,
    ease: easing.emphasized,
  },
  slow: {
    duration: motionDurations.slow,
    ease: easing.decelerate,
  },
} as const;

/**
 * Helper to create reduced motion variants
 */
export function createReducedMotionVariant<T extends Variants>(
  normalVariant: T,
  reducedVariant: Partial<T>
): T {
  return {
    ...normalVariant,
    ...reducedVariant,
  } as T;
}

/**
 * Dialog/Modal variants
 */
export const dialogVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: 20,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      ...springConfigs.smooth,
      duration: motionDurations.smooth,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 20,
    transition: {
      duration: motionDurations.normal,
      ease: easing.accelerate,
    },
  },
};

export const dialogOverlayVariants: Variants = {
  hidden: {
    opacity: 0,
    backdropFilter: 'blur(0px)',
  },
  visible: {
    opacity: 1,
    backdropFilter: 'blur(8px)',
    transition: {
      duration: motionDurations.smooth,
      ease: easing.standard,
    },
  },
  exit: {
    opacity: 0,
    backdropFilter: 'blur(0px)',
    transition: {
      duration: motionDurations.normal,
      ease: easing.accelerate,
    },
  },
};

/**
 * Card variants with hover and tap states
 */
export const cardVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.98,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      ...springConfigs.smooth,
      duration: motionDurations.smooth,
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.98,
    transition: {
      duration: motionDurations.normal,
      ease: easing.accelerate,
    },
  },
  hover: {
    scale: 1.02,
    y: -4,
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
};

export const cardHoverVariants: Variants = {
  rest: {
    scale: 1,
    y: 0,
    boxShadow: getShadow('base'),
  },
  hover: {
    scale: 1.02,
    y: -4,
    boxShadow: getShadow('raised'),
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
};

/**
 * Badge variants
 */
export const badgeVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      ...springConfigs.snappy,
      duration: motionDurations.normal,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    transition: {
      duration: motionDurations.fast,
      ease: easing.accelerate,
    },
  },
  pulse: {
    scale: [1, 1.1, 1],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: easing.standard,
    },
  },
};

/**
 * Progress bar variants
 */
export const progressVariants: Variants = {
  hidden: {
    scaleX: 0,
  },
  visible: {
    scaleX: 1,
    transition: {
      duration: motionDurations.smooth,
      ease: easing.decelerate,
    },
  },
};

/**
 * Spinner variants
 */
export const spinnerVariants: Variants = {
  spinning: {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: 'linear',
    },
  },
  spinningSlow: {
    rotate: 360,
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'linear',
    },
  },
};

/**
 * Slider thumb variants
 */
export const sliderThumbVariants: Variants = {
  rest: {
    scale: 1,
    boxShadow: getShadow('base'),
  },
  hover: {
    scale: 1.1,
    boxShadow: getShadow('raised'),
    transition: {
      duration: motionDurations.normal,
      ease: easing.standard,
    },
  },
  drag: {
    scale: 1.15,
    boxShadow: getShadow('overlay'),
    transition: {
      duration: motionDurations.fast,
      ease: easing.standard,
    },
  },
  tap: {
    scale: 0.95,
    transition: {
      duration: motionDurations.fast,
      ease: easing.standard,
    },
  },
};

/**
 * Fade variants
 */
export const fadeVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      duration: motionDurations.smooth,
      ease: easing.standard,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: motionDurations.normal,
      ease: easing.accelerate,
    },
  },
};

/**
 * Slide variants
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
      ...springConfigs.smooth,
      duration: motionDurations.smooth,
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: motionDurations.normal,
      ease: easing.accelerate,
    },
  },
};

export const slideDownVariants: Variants = {
  hidden: {
    opacity: 0,
    y: -20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      ...springConfigs.smooth,
      duration: motionDurations.smooth,
    },
  },
  exit: {
    opacity: 0,
    y: 20,
    transition: {
      duration: motionDurations.normal,
      ease: easing.accelerate,
    },
  },
};

/**
 * Scale variants
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
      ...springConfigs.bouncy,
      duration: motionDurations.smooth,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    transition: {
      duration: motionDurations.normal,
      ease: easing.accelerate,
    },
  },
};

/**
 * Stagger container variants for lists
 */
export const staggerContainerVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05,
    },
  },
};

/**
 * Stagger item variants
 */
export const staggerItemVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      ...springConfigs.smooth,
      duration: motionDurations.smooth,
    },
  },
};

/**
 * Reduced motion variants (for prefers-reduced-motion)
 */
export const reducedMotionVariants = {
  dialog: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
  },
  card: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
  },
  badge: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
  },
  fade: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
  },
} as const;

/**
 * Parallax variants for hero sections with depth
 */
export const parallaxVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 40,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      ...springConfigs.smooth,
      duration: motionDurations.slow,
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: motionDurations.normal,
      ease: easing.accelerate,
    },
  },
};

/**
 * Depth card variants for card stacks with 3D transforms
 */
export const depthCardVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.9,
    rotateX: -10,
    z: -50,
  },
  visible: {
    opacity: 1,
    scale: 1,
    rotateX: 0,
    z: 0,
    transition: {
      ...springConfigs.smooth,
      duration: motionDurations.smooth,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    rotateX: 10,
    z: -50,
    transition: {
      duration: motionDurations.normal,
      ease: easing.accelerate,
    },
  },
};

/**
 * Focus variants for keyboard navigation
 */
export const focusVariants: Variants = {
  unfocused: {
    outline: '2px solid transparent',
    outlineOffset: '2px',
    transition: {
      duration: motionDurations.fast,
      ease: easing.standard,
    },
  },
  focused: {
    outline: '2px solid currentColor',
    outlineOffset: '2px',
    boxShadow: '0 0 0 4px rgba(59, 130, 246, 0.3)',
    transition: {
      duration: motionDurations.fast,
      ease: easing.standard,
    },
  },
};

/**
 * Button press variants for microinteractions
 */
export const buttonPressVariants: Variants = {
  rest: {
    scale: 1,
    y: 0,
    transition: {
      duration: motionDurations.fast,
      ease: easing.standard,
    },
  },
  hover: {
    scale: 1.02,
    y: -2,
    transition: {
      duration: motionDurations.normal,
      ease: easing.standard,
    },
  },
  tap: {
    scale: 0.96,
    y: 0,
    transition: {
      duration: motionDurations.fast,
      ease: easing.standard,
    },
  },
  pressed: {
    scale: 0.94,
    y: 1,
    transition: {
      duration: motionDurations.fast,
      ease: easing.standard,
    },
  },
};

/**
 * Enhanced stagger container with configurable delays
 */
export function createStaggerContainerVariants(
  staggerDelay = 0.1,
  delayChildren = 0.05
): Variants {
  return {
    hidden: {
      opacity: 0,
    },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
        delayChildren,
      },
    },
  };
}

/**
 * Enhanced stagger item with configurable animation
 */
export function createStaggerItemVariants(
  yOffset = 20,
  useSpring = true
): Variants {
  return {
    hidden: {
      opacity: 0,
      y: yOffset,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: useSpring
        ? {
            ...springConfigs.smooth,
            duration: motionDurations.smooth,
          }
        : {
            duration: motionDurations.smooth,
            ease: easing.standard,
          },
    },
  };
}

/**
 * Alert variants
 */
export const alertVariants: Variants = {
  hidden: {
    opacity: 0,
    y: -10,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      ...springConfigs.smooth,
      duration: motionDurations.normal,
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.95,
    transition: {
      duration: motionDurations.fast,
      ease: easing.accelerate,
    },
  },
};

/**
 * Accordion content variants
 */
export const accordionContentVariants: Variants = {
  closed: {
    height: 0,
    opacity: 0,
    transition: {
      height: {
        duration: motionDurations.normal,
        ease: easing.standard,
      },
      opacity: {
        duration: motionDurations.fast,
        ease: easing.accelerate,
      },
    },
  },
  open: {
    height: 'auto',
    opacity: 1,
    transition: {
      height: {
        duration: motionDurations.smooth,
        ease: easing.decelerate,
      },
      opacity: {
        duration: motionDurations.normal,
        ease: easing.standard,
      },
    },
  },
};

/**
 * Accordion icon variants
 */
export const accordionIconVariants: Variants = {
  closed: {
    rotate: 0,
    transition: {
      duration: motionDurations.normal,
      ease: easing.standard,
    },
  },
  open: {
    rotate: 180,
    transition: {
      duration: motionDurations.normal,
      ease: easing.standard,
    },
  },
};

/**
 * Sheet overlay variants
 */
export const sheetOverlayVariants: Variants = {
  hidden: {
    opacity: 0,
    backdropFilter: 'blur(0px)',
  },
  visible: {
    opacity: 1,
    backdropFilter: 'blur(8px)',
    transition: {
      duration: motionDurations.smooth,
      ease: easing.standard,
    },
  },
  exit: {
    opacity: 0,
    backdropFilter: 'blur(0px)',
    transition: {
      duration: motionDurations.normal,
      ease: easing.accelerate,
    },
  },
};

/**
 * Sheet content variants (slide from sides)
 */
export function createSheetContentVariants(side: 'top' | 'right' | 'bottom' | 'left'): Variants {
  const slideProps = {
    top: { y: '-100%' },
    right: { x: '100%' },
    bottom: { y: '100%' },
    left: { x: '-100%' },
  }[side];

  return {
    hidden: {
      ...slideProps,
      opacity: 0,
    },
    visible: {
      x: 0,
      y: 0,
      opacity: 1,
      transition: {
        ...springConfigs.smooth,
        duration: motionDurations.smooth,
      },
    },
    exit: {
      ...slideProps,
      opacity: 0,
      transition: {
        duration: motionDurations.normal,
        ease: easing.accelerate,
      },
    },
  };
}

/**
 * Select content variants (fade + zoom + slide)
 */
export function createSelectContentVariants(side: 'top' | 'right' | 'bottom' | 'left'): Variants {
  const slideProps = {
    top: { y: -8 },
    right: { x: 8 },
    bottom: { y: 8 },
    left: { x: -8 },
  }[side];

  return {
    hidden: {
      opacity: 0,
      scale: 0.95,
      ...slideProps,
    },
    visible: {
      opacity: 1,
      scale: 1,
      x: 0,
      y: 0,
      transition: {
        ...springConfigs.smooth,
        duration: motionDurations.normal,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      ...slideProps,
      transition: {
        duration: motionDurations.fast,
        ease: easing.accelerate,
      },
    },
  };
}

/**
 * Select icon (chevron) rotation variants
 */
export const selectIconVariants: Variants = {
  closed: {
    rotate: 0,
    transition: {
      duration: motionDurations.normal,
      ease: easing.standard,
    },
  },
  open: {
    rotate: 180,
    transition: {
      duration: motionDurations.normal,
      ease: easing.standard,
    },
  },
};

/**
 * Navigation menu icon (chevron) rotation variants
 */
export const navMenuIconVariants: Variants = {
  closed: {
    rotate: 0,
    transition: {
      duration: motionDurations.smooth,
      ease: easing.standard,
    },
  },
  open: {
    rotate: 180,
    transition: {
      duration: motionDurations.smooth,
      ease: easing.standard,
    },
  },
};

/**
 * Navigation menu content variants (fade + zoom + slide)
 */
export function createNavMenuContentVariants(direction: 'from-start' | 'from-end'): Variants {
  const slideProps = {
    'from-start': { x: -208 }, // -52 * 4 (52rem = 208px)
    'from-end': { x: 208 },
  }[direction];

  return {
    hidden: {
      opacity: 0,
      scale: 0.95,
      ...slideProps,
    },
    visible: {
      opacity: 1,
      scale: 1,
      x: 0,
      transition: {
        ...springConfigs.smooth,
        duration: motionDurations.smooth,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      ...slideProps,
      transition: {
        duration: motionDurations.normal,
        ease: easing.accelerate,
      },
    },
  };
}

/**
 * Navigation menu viewport variants (zoom + fade)
 */
export const navMenuViewportVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      ...springConfigs.smooth,
      duration: motionDurations.smooth,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: {
      duration: motionDurations.normal,
      ease: easing.accelerate,
    },
  },
};

/**
 * Helper function to get variants based on reduced motion preference
 */
export function getVariantsWithReducedMotion<T extends Variants>(
  normalVariants: T,
  prefersReducedMotion: boolean
): T {
  if (!prefersReducedMotion) {
    return normalVariants;
  }

  // Return simplified variants for reduced motion
  return {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
  } as unknown as T;
}

