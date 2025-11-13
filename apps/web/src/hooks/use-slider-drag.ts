/**
 * Slider Drag Hook
 * 
 * Specialized hook for slider component drag interactions using Framer Motion.
 * Handles value calculation, constraints, and smooth animations.
 * 
 * Location: apps/web/src/hooks/use-slider-drag.ts
 */

import { useCallback, useRef, useState, useEffect } from 'react';
import { useMotionValue, useTransform, animate, type PanInfo } from 'framer-motion';
import type { DragConstraints } from './use-framer-gestures';

export interface SliderDragHookConfig {
  min: number;
  max: number;
  step?: number;
  value: number;
  onValueChange?: (value: number) => void;
  trackWidth: number;
  thumbSize: number;
  disabled?: boolean;
}

export interface SliderDragHookReturn {
  x: ReturnType<typeof useMotionValue<number>>;
  dragConstraints: DragConstraints;
  onDragStart: (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => void;
  onDrag: (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => void;
  onDragEnd: (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => void;
  percentage: ReturnType<typeof useTransform<number, number>>;
}

/**
 * Hook for slider drag interactions with Framer Motion
 */
export function useSliderDrag(config: SliderDragHookConfig): SliderDragHookReturn {
  const { min, max, step = 1, value, onValueChange, trackWidth, thumbSize, disabled = false } = config;

  // Calculate initial position based on value
  const initialPercentage = ((value - min) / (max - min)) * 100;
  const initialX = (initialPercentage / 100) * (trackWidth - thumbSize);

  const x = useMotionValue(initialX);
  const isDragging = useRef(false);
  const dragStartValue = useRef(value);

  // Update position when value changes externally (when not dragging)
  useEffect(() => {
    if (!isDragging.current) {
      const newPercentage = ((value - min) / (max - min)) * 100;
      const newX = (newPercentage / 100) * (trackWidth - thumbSize);
      animate(x, newX, {
        type: 'spring',
        stiffness: 400,
        damping: 25,
      });
    }
  }, [value, min, max, trackWidth, thumbSize, x]);

  // Transform x position to percentage
  const percentage = useTransform(x, (latestX) => {
    const clampedX = Math.max(0, Math.min(trackWidth - thumbSize, latestX));
    return (clampedX / (trackWidth - thumbSize)) * 100;
  });

  // Transform percentage to value
  const sliderValue = useTransform(percentage, (latestPercentage) => {
    const rawValue = min + (latestPercentage / 100) * (max - min);
    const steppedValue = Math.round(rawValue / step) * step;
    return Math.max(min, Math.min(max, steppedValue));
  });

  // Drag constraints
  const dragConstraints: DragConstraints = {
    left: 0,
    right: trackWidth - thumbSize,
    top: 0,
    bottom: 0,
  };

  const onDragStart = useCallback(
    (_event: MouseEvent | TouchEvent | PointerEvent, _info: PanInfo) => {
      if (disabled) return;
      isDragging.current = true;
      dragStartValue.current = value;
    },
    [disabled, value]
  );

  const onDrag = useCallback(
    (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (disabled) return;

      // Update value during drag for real-time feedback
      const currentX = x.get() + info.delta.x;
      const clampedX = Math.max(0, Math.min(trackWidth - thumbSize, currentX));
      const currentPercentage = (clampedX / (trackWidth - thumbSize)) * 100;
      const rawValue = min + (currentPercentage / 100) * (max - min);
      const steppedValue = Math.round(rawValue / step) * step;
      const clampedValue = Math.max(min, Math.min(max, steppedValue));

      // Only call onValueChange if value actually changed
      if (clampedValue !== dragStartValue.current) {
        onValueChange?.(clampedValue);
      }
    },
    [disabled, x, trackWidth, thumbSize, min, max, step, onValueChange]
  );

  const onDragEnd = useCallback(
    (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (disabled) return;

      isDragging.current = false;

      // Calculate final value
      const finalX = x.get() + info.offset.x;
      const clampedX = Math.max(0, Math.min(trackWidth - thumbSize, finalX));
      const finalPercentage = (clampedX / (trackWidth - thumbSize)) * 100;
      const rawValue = min + (finalPercentage / 100) * (max - min);
      const steppedValue = Math.round(rawValue / step) * step;
      const finalValue = Math.max(min, Math.min(max, steppedValue));

      // Animate to final position
      animate(x, clampedX, {
        type: 'spring',
        stiffness: 400,
        damping: 25,
      });

      // Update value
      if (finalValue !== value) {
        onValueChange?.(finalValue);
      }
    },
    [disabled, x, trackWidth, thumbSize, min, max, step, value, onValueChange]
  );

  return {
    x,
    dragConstraints,
    onDragStart,
    onDrag,
    onDragEnd,
    percentage,
  };
}

