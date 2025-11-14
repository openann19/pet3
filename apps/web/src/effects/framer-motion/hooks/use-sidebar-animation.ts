'use client';

import { useMotionValue, animate, type MotionValue, type Variants } from 'framer-motion';
import { useEffect } from 'react';

export interface UseSidebarAnimationOptions {
  isOpen: boolean;
  openWidth?: number;
  closedWidth?: number;
  enableOpacity?: boolean;
  duration?: number;
}

export interface UseSidebarAnimationReturn {
  width: number;
  variants: Variants;
  widthValue: MotionValue<number>;
  opacity: MotionValue<number>;
  widthStyle: { width: MotionValue<number> };
  opacityStyle: { opacity: MotionValue<number> };
}

const DEFAULT_OPEN_WIDTH = 280;
const DEFAULT_CLOSED_WIDTH = 80;
const DEFAULT_DURATION = 0.3;

/**
 * Framer Motion hook for sidebar animations
 * Provides smooth width and opacity transitions
 */
export function useSidebarAnimation(
  options: UseSidebarAnimationOptions
): UseSidebarAnimationReturn {
  const {
    isOpen,
    openWidth = DEFAULT_OPEN_WIDTH,
    closedWidth = DEFAULT_CLOSED_WIDTH,
    enableOpacity = true,
    duration = DEFAULT_DURATION,
  } = options;

  const widthValue = useMotionValue(isOpen ? openWidth : closedWidth);
  const opacity = useMotionValue(isOpen ? 1 : 0);

  const variants: Variants = {
    open: {
      width: openWidth,
      opacity: enableOpacity ? 1 : 1,
      transition: {
        type: 'spring',
        damping: 25,
        stiffness: 200,
        duration,
      },
    },
    closed: {
      width: closedWidth,
      opacity: enableOpacity ? 0.5 : 1,
      transition: {
        type: 'spring',
        damping: 25,
        stiffness: 200,
        duration,
      },
    },
  };

  useEffect(() => {
    void animate(widthValue, isOpen ? openWidth : closedWidth, {
      type: 'spring',
      damping: 25,
      stiffness: 200,
    });

    if (enableOpacity) {
      void animate(opacity, isOpen ? 1 : 0.5, {
        type: 'spring',
        damping: 25,
        stiffness: 200,
      });
    }
  }, [isOpen, openWidth, closedWidth, enableOpacity, widthValue, opacity]);

  return {
    width: isOpen ? openWidth : closedWidth,
    variants,
    widthValue,
    opacity,
    widthStyle: { width: widthValue },
    opacityStyle: { opacity },
  };
}
