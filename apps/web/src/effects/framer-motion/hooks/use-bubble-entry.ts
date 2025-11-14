'use client';

import type { Variants } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { springConfigs, motionDurations } from '../variants';

export type BubbleDirection = 'incoming' | 'outgoing';

export interface UseBubbleEntryOptions {
  index?: number;
  staggerDelay?: number;
  direction?: BubbleDirection;
  enabled?: boolean;
  isNew?: boolean;
}

export interface UseBubbleEntryReturn {
  variants: Variants;
  initial: 'hidden' | false;
  animate: 'visible' | false;
}

const DEFAULT_INDEX = 0;
const DEFAULT_STAGGER_DELAY = 0.04; // 40ms in seconds
const DEFAULT_DIRECTION: BubbleDirection = 'outgoing';
const DEFAULT_ENABLED = true;
const DEFAULT_IS_NEW = true;

export function useBubbleEntry(options: UseBubbleEntryOptions = {}): UseBubbleEntryReturn {
  const {
    index = DEFAULT_INDEX,
    staggerDelay = DEFAULT_STAGGER_DELAY,
    direction = DEFAULT_DIRECTION,
    enabled = DEFAULT_ENABLED,
    isNew = DEFAULT_IS_NEW,
  } = options;

  const prefersReducedMotion = useReducedMotion();
  const shouldAnimate = enabled && isNew && !prefersReducedMotion;

  const variants: Variants = {
    hidden: {
      opacity: 0,
      y: 20,
      x: direction === 'incoming' ? -30 : 30,
      scale: 0.95,
    },
    visible: {
      opacity: 1,
      y: 0,
      x: 0,
      scale: 1,
      transition: {
        delay: index * staggerDelay,
        ...(direction === 'incoming' 
          ? {
              ...springConfigs.smooth,
              scale: {
                ...springConfigs.bouncy,
                mass: 0.9,
              },
            }
          : {
              ...springConfigs.smooth,
              scale: springConfigs.bouncy,
            }
        ),
      },
    },
  };

  return {
    variants: shouldAnimate ? variants : undefined,
    initial: shouldAnimate ? 'hidden' : false,
    animate: shouldAnimate ? 'visible' : false,
  };
}

