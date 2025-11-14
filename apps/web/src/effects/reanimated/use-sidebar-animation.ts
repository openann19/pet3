'use client';

import { useMotionValue, animate, type MotionValue } from 'framer-motion';
import { useEffect } from 'react';
import { springConfigs } from './transitions';
import type { CSSProperties } from 'react';

export interface UseSidebarAnimationOptions {
  isOpen: boolean;
  openWidth?: number;
  closedWidth?: number;
  enableOpacity?: boolean;
}

export interface UseSidebarAnimationReturn {
  width: number;
  widthStyle: CSSProperties;
  opacityStyle: CSSProperties;
  widthValue: MotionValue<number>;
  opacity: MotionValue<number>;
}

/**
 * Hook for animating sidebar width and opacity transitions
 * Uses React Reanimated for smooth 60fps animations on UI thread
 */
export function useSidebarAnimation(
  options: UseSidebarAnimationOptions
): UseSidebarAnimationReturn {
  const { isOpen, openWidth = 280, closedWidth = 80, enableOpacity = true } = options;

  const widthValue = useMotionValue(isOpen ? openWidth : closedWidth);
  const opacity = useMotionValue(isOpen ? 1 : 0);

  useEffect(() => {
    animate(widthValue, isOpen ? openWidth : closedWidth, {
      type: 'spring',
      damping: springConfigs.smooth.damping,
      stiffness: springConfigs.smooth.stiffness,
    });

    if (enableOpacity) {
      animate(opacity, isOpen ? 1 : 0, {
        type: 'spring',
        damping: springConfigs.smooth.damping,
        stiffness: springConfigs.smooth.stiffness,
      });
    }
  }, [isOpen, openWidth, closedWidth, enableOpacity, widthValue, opacity]);

  return {
    width: isOpen ? openWidth : closedWidth,
    widthStyle: {
      width: widthValue.get(),
    },
    opacityStyle: {
      opacity: opacity.get(),
    },
    widthValue,
    opacity,
  };
}
