/**
 * Framer Motion Gesture Utilities
 * 
 * Reusable hooks and utilities for drag, swipe, and touch interactions
 * using Framer Motion's gesture API.
 * 
 * Location: apps/web/src/hooks/use-framer-gestures.ts
 */

import { useCallback, useRef } from 'react';
import type { PanInfo, Point } from 'framer-motion';

/**
 * Drag constraints for slider-like components
 */
export interface DragConstraints {
  left?: number;
  right?: number;
  top?: number;
  bottom?: number;
}

/**
 * Slider drag configuration
 */
export interface SliderDragConfig {
  min: number;
  max: number;
  step?: number;
  onValueChange?: (value: number) => void;
  axis?: 'x' | 'y';
}

/**
 * Calculate slider value from drag position
 */
export function calculateSliderValue(
  dragInfo: Point,
  constraints: DragConstraints,
  config: SliderDragConfig
): number {
  const { min, max, step = 1 } = config;
  const axis = config.axis ?? 'x';

  const position = axis === 'x' ? dragInfo.x : dragInfo.y;
  const constraintStart = axis === 'x' ? constraints.left ?? 0 : constraints.top ?? 0;
  const constraintEnd = axis === 'x' ? constraints.right ?? 0 : constraints.bottom ?? 0;
  const constraintSize = constraintEnd - constraintStart;

  if (constraintSize <= 0) {
    return min;
  }

  const percentage = (position - constraintStart) / constraintSize;
  const rawValue = min + percentage * (max - min);
  const steppedValue = Math.round(rawValue / step) * step;

  return Math.max(min, Math.min(max, steppedValue));
}

/**
 * Hook for slider drag interactions
 */
export function useSliderDrag(config: SliderDragConfig) {
  const dragStartValue = useRef<number>(config.min);

  const onDragStart = useCallback(
    (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      // Store initial value if needed
      dragStartValue.current = config.min;
    },
    [config]
  );

  const onDrag = useCallback(
    (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      // This will be handled by the drag constraints and onDragEnd
    },
    []
  );

  const onDragEnd = useCallback(
    (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const { offset } = info;
      const axis = config.axis ?? 'x';
      const dragPosition = axis === 'x' ? offset.x : offset.y;

      // Calculate value based on drag distance
      // This is a simplified version - actual implementation should use track width
      const percentage = Math.max(0, Math.min(1, dragPosition / 100)); // Simplified
      const rawValue = config.min + percentage * (config.max - config.min);
      const steppedValue = Math.round(rawValue / (config.step ?? 1)) * (config.step ?? 1);
      const clampedValue = Math.max(config.min, Math.min(config.max, steppedValue));

      config.onValueChange?.(clampedValue);
    },
    [config]
  );

  return {
    onDragStart,
    onDrag,
    onDragEnd,
  };
}

/**
 * Swipe detection configuration
 */
export interface SwipeConfig {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number; // Minimum distance for swipe (default: 50)
  velocityThreshold?: number; // Minimum velocity for swipe (default: 500)
}

/**
 * Hook for swipe detection
 */
export function useSwipeDetection(config: SwipeConfig) {
  const threshold = config.threshold ?? 50;
  const velocityThreshold = config.velocityThreshold ?? 500;

  const onDragEnd = useCallback(
    (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const { offset, velocity } = info;

      // Check if drag distance and velocity meet thresholds
      const distance = Math.sqrt(offset.x ** 2 + offset.y ** 2);
      const speed = Math.sqrt(velocity.x ** 2 + velocity.y ** 2);

      if (distance < threshold || speed < velocityThreshold) {
        return;
      }

      // Determine swipe direction
      const absX = Math.abs(offset.x);
      const absY = Math.abs(offset.y);

      if (absX > absY) {
        // Horizontal swipe
        if (offset.x > 0) {
          config.onSwipeRight?.();
        } else {
          config.onSwipeLeft?.();
        }
      } else {
        // Vertical swipe
        if (offset.y > 0) {
          config.onSwipeDown?.();
        } else {
          config.onSwipeUp?.();
        }
      }
    },
    [config, threshold, velocityThreshold]
  );

  return {
    onDragEnd,
  };
}

/**
 * Touch feedback configuration
 */
export interface TouchFeedbackConfig {
  onPress?: () => void;
  onLongPress?: () => void;
  longPressDelay?: number; // Default: 500ms
}

/**
 * Hook for touch feedback (press, long press)
 */
export function useTouchFeedback(config: TouchFeedbackConfig) {
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressDelay = config.longPressDelay ?? 500;

  const onPointerDown = useCallback(() => {
    if (config.onLongPress) {
      longPressTimer.current = setTimeout(() => {
        config.onLongPress?.();
      }, longPressDelay);
    }
  }, [config, longPressDelay]);

  const onPointerUp = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    config.onPress?.();
  }, [config]);

  const onPointerCancel = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  return {
    onPointerDown,
    onPointerUp,
    onPointerCancel,
  };
}

/**
 * Drag constraints helper for horizontal slider
 */
export function createHorizontalSliderConstraints(
  trackWidth: number,
  thumbSize: number
): DragConstraints {
  return {
    left: -thumbSize / 2,
    right: trackWidth - thumbSize / 2,
    top: 0,
    bottom: 0,
  };
}

/**
 * Drag constraints helper for vertical slider
 */
export function createVerticalSliderConstraints(
  trackHeight: number,
  thumbSize: number
): DragConstraints {
  return {
    left: 0,
    right: 0,
    top: -thumbSize / 2,
    bottom: trackHeight - thumbSize / 2,
  };
}

