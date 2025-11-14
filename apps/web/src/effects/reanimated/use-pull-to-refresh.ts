'use client';

import { useCallback, useEffect, useRef } from 'react';
import {
  useMotionValue,
  animate,
  useTransform,
  type MotionValue,
} from 'framer-motion';
import { isTruthy } from '@/core/guards';
import { springConfigs, timingConfigs } from './transitions';
import { useMotionStyle } from './use-motion-style';
import type { CSSProperties } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void> | void;
  threshold?: number;
  maxDistance?: number;
  enabled?: boolean;
}

export interface UsePullToRefreshReturn {
  pullDistance: MotionValue<number>;
  pullOpacity: MotionValue<number>;
  pullRotation: MotionValue<number>;
  pullScale: MotionValue<number>;
  isRefreshing: boolean;
  animatedStyle: CSSProperties;
  indicatorStyle: CSSProperties;
  handleTouchStart: (e: globalThis.TouchEvent) => void;
  handleTouchMove: (e: globalThis.TouchEvent) => void;
  handleTouchEnd: () => void;
}

export function usePullToRefresh({
  onRefresh,
  threshold = 80,
  maxDistance = 120,
  enabled = true,
}: UsePullToRefreshOptions): UsePullToRefreshReturn {
  const reducedMotion = useReducedMotion();
  const pullDistance = useMotionValue(0);
  const isRefreshing = useRef(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const startY = useRef(0);
  const isPulling = useRef(false);

  const pullOpacity = useMotionValue(0);
  const pullRotation = useMotionValue(0);
  const pullScale = useMotionValue(0.5);

  // Use useTransform for interpolation
  const pullOpacityTransformed = useTransform(pullDistance, [0, threshold], [0, 1]);
  const pullRotationTransformed = useTransform(pullDistance, [0, threshold], [0, 360]);
  const pullScaleTransformed = useTransform(pullDistance, [0, threshold], [0.5, 1]);

  // Sync transformed values to motion values for style computation
  useEffect(() => {
    const unsubscribeOpacity = pullOpacityTransformed.on('change', (val) => {
      pullOpacity.set(val);
    });
    const unsubscribeRotation = pullRotationTransformed.on('change', (val) => {
      pullRotation.set(val);
    });
    const unsubscribeScale = pullScaleTransformed.on('change', (val) => {
      pullScale.set(val);
    });

    return () => {
      unsubscribeOpacity();
      unsubscribeRotation();
      unsubscribeScale();
    };
  }, [pullOpacityTransformed, pullRotationTransformed, pullScaleTransformed, pullOpacity, pullRotation, pullScale]);

  const handleTouchStart = useCallback(
    (e: globalThis.TouchEvent): void => {
      if (!enabled || !containerRef.current) return;

      if (containerRef.current.scrollTop === 0) {
        startY.current = e.touches[0].clientY;
        isPulling.current = true;
      }
    },
    [enabled]
  );

  const handleTouchMove = useCallback(
    (e: globalThis.TouchEvent): void => {
      if (!enabled || !isPulling.current || !containerRef.current) return;

      const currentY = e.touches[0].clientY;
      const diff = currentY - startY.current;

      if (diff > 0 && diff < maxDistance) {
        pullDistance.set(diff);
        // Transformed values will update automatically via useTransform
      }
    },
    [enabled, maxDistance, pullDistance]
  );

  const handleTouchEnd = useCallback(async (): Promise<void> => {
    if (!enabled || !isPulling.current) return;
    isPulling.current = false;

    const distance = pullDistance.get();

    if (distance > threshold && !isRefreshing.current) {
      isRefreshing.current = true;

      try {
        await onRefresh();
      } finally {
        isRefreshing.current = false;
      }
    }

    // Animate back to zero
    void animate(pullDistance, 0, {
      ...springConfigs.smooth,
    });
    void animate(pullOpacity, 0, {
      duration: timingConfigs.fast.duration,
      ease: timingConfigs.fast.ease as string,
    });
    void animate(pullRotation, 0, {
      ...springConfigs.smooth,
    });
    void animate(pullScale, 0.5, {
      ...springConfigs.smooth,
    });
  }, [enabled, threshold, pullDistance, pullOpacity, pullRotation, pullScale, onRefresh]);

  const animatedStyle = useMotionStyle(() => {
    if (isTruthy(reducedMotion)) {
      return {
        transform: [{ translateY: 0 }],
        opacity: 0,
      };
    }

    return {
      transform: [{ translateY: pullDistance.get() }],
      opacity: pullOpacity.get(),
    };
  });

  const indicatorStyle = useMotionStyle(() => {
    if (isTruthy(reducedMotion)) {
      return {
        transform: [{ rotate: '0deg' }, { scale: 0.5 }],
      };
    }

    return {
      transform: [{ rotate: `${pullRotation.get()}deg` }, { scale: pullScale.get() }],
    };
  });

  return {
    pullDistance,
    pullOpacity,
    pullRotation,
    pullScale,
    isRefreshing: isRefreshing.current,
    animatedStyle,
    indicatorStyle,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  };
}
