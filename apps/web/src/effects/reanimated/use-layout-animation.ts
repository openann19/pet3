'use client';

import { useEffect, useRef } from 'react';
import {
  useMotionValue,
  animate,
  type MotionValue,
} from 'framer-motion';
import { springConfigs } from '@/effects/reanimated/transitions';

export interface UseLayoutAnimationOptions {
  enabled?: boolean;
  springConfig?: {
    damping?: number;
    stiffness?: number;
    mass?: number;
  };
  onLayoutChange?: () => void;
}

export interface UseLayoutAnimationReturn {
  x: MotionValue<number>;
  y: MotionValue<number>;
  width: MotionValue<number>;
  height: MotionValue<number>;
  animatedStyle: {
    x: MotionValue<number>;
    y: MotionValue<number>;
    width: MotionValue<number>;
    height: MotionValue<number>;
  };
  measureLayout: (element: HTMLElement | null) => void;
}

export function useLayoutAnimation(
  options: UseLayoutAnimationOptions = {}
): UseLayoutAnimationReturn {
  const { enabled = true, springConfig = springConfigs.smooth, onLayoutChange } = options;

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const width = useMotionValue(0);
  const height = useMotionValue(0);
  const previousLayoutRef = useRef<{ x: number; y: number; width: number; height: number } | null>(
    null
  );
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  const measureLayout = (element: HTMLElement | null): void => {
    if (!element || !enabled) return;

    const rect = element.getBoundingClientRect();
    const newLayout = {
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height,
    };

    const prevLayout = previousLayoutRef.current;

    if (!prevLayout) {
      x.set(newLayout.x);
      y.set(newLayout.y);
      width.set(newLayout.width);
      height.set(newLayout.height);
      previousLayoutRef.current = newLayout;
      return;
    }

    if (
      prevLayout.x !== newLayout.x ||
      prevLayout.y !== newLayout.y ||
      prevLayout.width !== newLayout.width ||
      prevLayout.height !== newLayout.height
    ) {
      void animate(x, newLayout.x, {
        type: 'spring',
        ...springConfig,
      });
      void animate(y, newLayout.y, {
        type: 'spring',
        ...springConfig,
      });
      void animate(width, newLayout.width, {
        type: 'spring',
        ...springConfig,
      });
      void animate(height, newLayout.height, {
        type: 'spring',
        ...springConfig,
      });
      previousLayoutRef.current = newLayout;
      onLayoutChange?.();
    }
  };

  useEffect(() => {
    if (!enabled || typeof window === 'undefined' || !('ResizeObserver' in window)) {
      return;
    }

    resizeObserverRef.current = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target instanceof HTMLElement) {
          measureLayout(entry.target);
        }
      }
    });

    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
    };
  }, [enabled]);

  return {
    x,
    y,
    width,
    height,
    animatedStyle: {
      x,
      y,
      width,
      height,
    },
    measureLayout,
  };
}
