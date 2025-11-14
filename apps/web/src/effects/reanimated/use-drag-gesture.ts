'use client';

import { useCallback, useRef } from 'react';
import {
  useMotionValue,
  animate,
  type MotionValue,
} from 'framer-motion';
import { springConfigs, timingConfigs } from '@/effects/reanimated/transitions';
import { haptics } from '@/lib/haptics';

export interface UseDragGestureOptions {
  enabled?: boolean;
  axis?: 'x' | 'y' | 'both';
  bounds?: {
    left?: number;
    right?: number;
    top?: number;
    bottom?: number;
  };
  onDragStart?: () => void;
  onDrag?: (x: number, y: number) => void;
  onDragEnd?: (x: number, y: number) => void;
  hapticFeedback?: boolean;
  snapBack?: boolean;
  snapBackDuration?: number;
}

export interface UseDragGestureReturn {
  x: MotionValue<number>;
  y: MotionValue<number>;
  isDragging: MotionValue<boolean>;
  animatedStyle: {
    x: MotionValue<number>;
    y: MotionValue<number>;
    cursor: string;
  };
  handleMouseDown: (e: React.MouseEvent) => void;
  handleMouseMove: (e: React.MouseEvent) => void;
  handleMouseUp: () => void;
  handleTouchStart: (e: React.TouchEvent) => void;
  handleTouchMove: (e: React.TouchEvent) => void;
  handleTouchEnd: () => void;
  reset: () => void;
}

export function useDragGesture(options: UseDragGestureOptions = {}): UseDragGestureReturn {
  const {
    enabled = true,
    axis = 'both',
    bounds,
    onDragStart,
    onDrag,
    onDragEnd,
    hapticFeedback = true,
    snapBack = false,
    snapBackDuration = timingConfigs.smooth.duration ?? 300,
  } = options;

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const isDragging = useMotionValue(false);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const offsetXRef = useRef(0);
  const offsetYRef = useRef(0);
  const isActiveRef = useRef(false);

  const constrainValue = useCallback((value: number, min?: number, max?: number): number => {
    if (min !== undefined && value < min) return min;
    if (max !== undefined && value > max) return max;
    return value;
  }, []);

  const getConstrainedX = useCallback(
    (newX: number): number => {
      if (bounds?.left !== undefined || bounds?.right !== undefined) {
        return constrainValue(newX, bounds.left, bounds.right);
      }
      return newX;
    },
    [bounds, constrainValue]
  );

  const getConstrainedY = useCallback(
    (newY: number): number => {
      if (bounds?.top !== undefined || bounds?.bottom !== undefined) {
        return constrainValue(newY, bounds.top, bounds.bottom);
      }
      return newY;
    },
    [bounds, constrainValue]
  );

  const handleStart = useCallback(
    (clientX: number, clientY: number) => {
      if (!enabled) return;

      isActiveRef.current = true;
      startXRef.current = clientX;
      startYRef.current = clientY;
      offsetXRef.current = x.get();
      offsetYRef.current = y.get();
      isDragging.set(true);

      if (hapticFeedback) {
        haptics.selection();
      }

      onDragStart?.();
    },
    [enabled, hapticFeedback, x, y, isDragging, onDragStart]
  );

  const handleMove = useCallback(
    (clientX: number, clientY: number) => {
      if (!enabled || !isActiveRef.current) return;

      const deltaX = clientX - startXRef.current;
      const deltaY = clientY - startYRef.current;

      let newX = offsetXRef.current;
      let newY = offsetYRef.current;

      if (axis === 'x' || axis === 'both') {
        newX = getConstrainedX(offsetXRef.current + deltaX);
        x.set(newX);
      }

      if (axis === 'y' || axis === 'both') {
        newY = getConstrainedY(offsetYRef.current + deltaY);
        y.set(newY);
      }

      onDrag?.(newX, newY);
    },
    [enabled, axis, x, y, getConstrainedX, getConstrainedY, onDrag]
  );

  const handleEnd = useCallback(() => {
    if (!enabled || !isActiveRef.current) return;

    isActiveRef.current = false;
    isDragging.set(false);

    const finalX = x.get();
    const finalY = y.get();

    if (snapBack) {
      void animate(x, 0, {
        duration: snapBackDuration / 1000,
        ease: 'easeOut',
      });
      void animate(y, 0, {
        duration: snapBackDuration / 1000,
        ease: 'easeOut',
      });
    }

    onDragEnd?.(finalX, finalY);
  }, [enabled, snapBack, snapBackDuration, x, y, isDragging, onDragEnd]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      handleStart(e.clientX, e.clientY);
    },
    [handleStart]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isActiveRef.current) return;
      e.preventDefault();
      handleMove(e.clientX, e.clientY);
    },
    [handleMove]
  );

  const handleMouseUp = useCallback(() => {
    handleEnd();
  }, [handleEnd]);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0];
      if (touch) {
        handleStart(touch.clientX, touch.clientY);
      }
    },
    [handleStart]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isActiveRef.current) return;
      const touch = e.touches[0];
      if (touch) {
        e.preventDefault();
        handleMove(touch.clientX, touch.clientY);
      }
    },
    [handleMove]
  );

  const handleTouchEnd = useCallback(() => {
    handleEnd();
  }, [handleEnd]);

  const reset = useCallback(() => {
    void animate(x, 0, springConfigs.smooth);
    void animate(y, 0, springConfigs.smooth);
    isDragging.set(false);
    isActiveRef.current = false;
    offsetXRef.current = 0;
    offsetYRef.current = 0;
  }, [x, y, isDragging]);

  // Note: cursor state should be managed via CSS or component state
  // For now, return motion values that components can use directly
  const animatedStyle = {
    x,
    y,
    cursor: isDragging.get() ? 'grabbing' : 'grab',
  };

  return {
    x,
    y,
    isDragging,
    animatedStyle,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    reset,
  };
}
