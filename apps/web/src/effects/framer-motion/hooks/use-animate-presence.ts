'use client';

import { useMotionValue, type MotionValue, type Variants } from 'framer-motion';

export interface UseAnimatePresenceOptions {
  exitDuration?: number;
  enterDuration?: number;
}

export interface UseAnimatePresenceReturn {
  opacity: MotionValue<number>;
  scale: MotionValue<number>;
  variants: Variants;
}

/**
 * Framer Motion hook for presence animations
 * Provides consistent enter/exit animations
 */
export function useAnimatePresence(options: UseAnimatePresenceOptions = {}): UseAnimatePresenceReturn {
  const { exitDuration = 150, enterDuration = 300 } = options;

  const opacity = useMotionValue(0);
  const scale = useMotionValue(0.95);

  const variants: Variants = {
    initial: {
      opacity: 0,
      scale: 0.95,
    },
    animate: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: enterDuration / 1000,
        ease: 'easeOut',
      },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      transition: {
        duration: exitDuration / 1000,
        ease: 'easeIn',
      },
    },
  };

  return {
    opacity,
    scale,
    variants,
  };
}
