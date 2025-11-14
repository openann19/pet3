'use client';

import { useMotionValue, animate, type MotionValue, type Variants } from 'framer-motion';
import { useEffect, useRef } from 'react';

export interface UseExpandCollapseOptions {
  isExpanded: boolean;
  duration?: number;
  enableOpacity?: boolean;
}

export interface UseExpandCollapseReturn {
  variants: Variants;
  height: MotionValue<string>;
  opacity: MotionValue<number>;
  heightStyle: { height: MotionValue<string>; opacity: MotionValue<number> };
}

/**
 * Framer Motion hook for expand/collapse animations
 * Provides smooth height and opacity transitions
 */
export function useExpandCollapse(options: UseExpandCollapseOptions): UseExpandCollapseReturn {
  const { isExpanded, duration = 300, enableOpacity = true } = options;

  const height = useMotionValue(isExpanded ? 'auto' : '0px');
  const opacity = useMotionValue(isExpanded ? 1 : 0);
  const contentRef = useRef<HTMLElement | null>(null);

  const variants: Variants = {
    collapsed: {
      height: 0,
      opacity: enableOpacity ? 0 : 1,
      transition: {
        duration: duration / 1000,
        ease: 'easeInOut',
      },
    },
    expanded: {
      height: 'auto',
      opacity: 1,
      transition: {
        duration: duration / 1000,
        ease: 'easeInOut',
      },
    },
  };

  useEffect(() => {
    height.set(isExpanded ? 'auto' : '0px');

    if (enableOpacity) {
      void animate(opacity, isExpanded ? 1 : 0, {
        duration: duration / 1000,
        ease: 'easeInOut',
      });
    }
  }, [isExpanded, duration, enableOpacity, height, opacity]);

  return {
    variants,
    height,
    opacity,
    heightStyle: { height, opacity },
  };
}
