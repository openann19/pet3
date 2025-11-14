'use client';

import { type Variants } from 'framer-motion';

export interface UseEntryAnimationOptions {
  delay?: number;
  duration?: number;
  type?: 'fade' | 'slide' | 'scale' | 'bounce';
}

export interface UseEntryAnimationReturn {
  variants: Variants;
}

/**
 * Framer Motion hook for entry animations
 * Provides various entrance animation types
 */
export function useEntryAnimation(options: UseEntryAnimationOptions = {}): UseEntryAnimationReturn {
  const { delay = 0, duration = 0.3, type = 'fade' } = options;

  const variants: Variants = (() => {
    switch (type) {
      case 'slide':
        return {
          initial: { opacity: 0, y: 20 },
          animate: {
            opacity: 1,
            y: 0,
            transition: {
              delay,
              duration,
              ease: 'easeOut',
            },
          },
        };

      case 'scale':
        return {
          initial: { opacity: 0, scale: 0.8 },
          animate: {
            opacity: 1,
            scale: 1,
            transition: {
              delay,
              duration,
              ease: 'easeOut',
            },
          },
        };

      case 'bounce':
        return {
          initial: { opacity: 0, scale: 0.8, y: 20 },
          animate: {
            opacity: 1,
            scale: 1,
            y: 0,
            transition: {
              delay,
              duration,
              type: 'spring',
              damping: 10,
              stiffness: 200,
            },
          },
        };

      case 'fade':
      default:
        return {
          initial: { opacity: 0 },
          animate: {
            opacity: 1,
            transition: {
              delay,
              duration,
              ease: 'easeOut',
            },
          },
        };
    }
  })();

  return {
    variants,
  };
}
