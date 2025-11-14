'use client';

import { useMotionValue, animate, type MotionValue } from 'framer-motion';
import { useEffect, useRef } from 'react';
import type { CSSProperties } from 'react';

export interface UseExpandCollapseOptions {
  isExpanded: boolean;
  duration?: number;
  enableOpacity?: boolean;
}

export interface UseExpandCollapseReturn {
  heightStyle: CSSProperties;
  opacityStyle: CSSProperties;
  height: MotionValue<number>;
  opacity: MotionValue<number>;
}

/**
 * Hook for animating expand/collapse transitions with height and opacity
 * Uses React Reanimated for smooth 60fps animations on UI thread
 * Note: Height animation requires maxHeight approach for 'auto' heights
 */
export function useExpandCollapse(options: UseExpandCollapseOptions): UseExpandCollapseReturn {
  const { isExpanded, duration = 300, enableOpacity = true } = options;

  const height = useMotionValue(isExpanded ? 1 : 0);
  const opacity = useMotionValue(isExpanded ? 1 : 0);
  const maxHeightRef = useRef<number>(1000);

  useEffect(() => {
    animate(height, isExpanded ? 1 : 0, {
      duration: duration / 1000,
      ease: 'easeInOut',
    });

    if (enableOpacity) {
      animate(opacity, isExpanded ? 1 : 0, {
        duration: duration / 1000,
        ease: 'easeInOut',
      });
    }
  }, [isExpanded, duration, enableOpacity, height, opacity]);

  return {
    heightStyle: {
      maxHeight: height.get() === 1 ? maxHeightRef.current : 0,
      opacity: height.get(),
    },
    opacityStyle: {
      opacity: opacity.get(),
    },
    height,
    opacity,
  };
}
