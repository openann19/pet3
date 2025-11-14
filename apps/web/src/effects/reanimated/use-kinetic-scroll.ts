/**
 * Kinetic Scroll Animation
 * Momentum-based scrolling with decay physics
 */

import {
  useMotionValue,
  animate,
  stop,
  type MotionValue,
} from 'framer-motion';
import { useCallback, useState, useRef } from 'react';
import { isTruthy } from '@petspark/shared';
import { useMotionStyle } from './use-motion-style';
import type { CSSProperties } from 'react';

export interface UseKineticScrollOptions {
  damping?: number;
  velocityMultiplier?: number;
  clamp?: [number, number];
}

export interface UseKineticScrollReturn {
  animatedStyle: CSSProperties;
  handleDragStart: (event: React.MouseEvent | React.TouchEvent) => void;
  handleDragMove: (event: React.MouseEvent | React.TouchEvent) => void;
  handleDragEnd: () => void;
  isDragging: boolean;
  offset: number;
  reset: () => void;
}

export function useKineticScroll(options: UseKineticScrollOptions = {}): UseKineticScrollReturn {
  const { damping = 0.998, velocityMultiplier = 1, clamp } = options;

  const offset = useMotionValue(0);
  const velocity = useMotionValue(0);
  const [isDragging, setIsDragging] = useState(false);
  const lastPosition = useRef(0);
  const lastTime = useRef(0);
  const animationRef = useRef<ReturnType<typeof animate> | null>(null);

  const handleDragStart = useCallback((event: React.MouseEvent | React.TouchEvent) => {
    if (animationRef.current) {
      stop(animationRef.current);
      animationRef.current = null;
    }
    setIsDragging(true);

    const clientY = 'touches' in event ? (event.touches[0]?.clientY ?? 0) : event.clientY;
    lastPosition.current = clientY;
    lastTime.current = Date.now();
    velocity.set(0);
  }, [velocity]);

  const handleDragMove = useCallback(
    (event: React.MouseEvent | React.TouchEvent) => {
      if (!isDragging) return;

      const clientY = 'touches' in event ? (event.touches[0]?.clientY ?? 0) : event.clientY;
      const currentTime = Date.now();
      const deltaY = clientY - lastPosition.current;
      const deltaTime = currentTime - lastTime.current;

      if (deltaTime > 0) {
        velocity.set((deltaY / deltaTime) * velocityMultiplier);
      }

      const newOffset = offset.get() + deltaY;
      const clampedOffset = isTruthy(clamp)
        ? Math.max(clamp[0], Math.min(clamp[1], newOffset))
        : newOffset;
      offset.set(clampedOffset);

      lastPosition.current = clientY;
      lastTime.current = currentTime;
    },
    [isDragging, velocityMultiplier, clamp, offset, velocity]
  );

  const handleDragEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);

    const currentVelocity = velocity.get();
    const currentOffset = offset.get();

    // Simulate decay animation
    if (currentVelocity !== 0) {
      const targetOffset = currentOffset + currentVelocity * 10; // Approximate decay
      const clampedTarget = isTruthy(clamp)
        ? Math.max(clamp[0], Math.min(clamp[1], targetOffset))
        : targetOffset;

      animationRef.current = animate(offset, clampedTarget, {
        type: 'spring',
        damping: 1 - damping, // Convert damping to spring damping
        stiffness: 50,
        velocity: currentVelocity * 0.01,
      });
    }
  }, [isDragging, damping, clamp, velocity, offset]);

  const animatedStyle = useMotionStyle(() => ({
    transform: [{ translateY: offset.get() }],
  }));

  const reset = useCallback(() => {
    if (animationRef.current) {
      stop(animationRef.current);
      animationRef.current = null;
    }
    offset.set(0);
    velocity.set(0);
  }, [offset, velocity]);

  return {
    animatedStyle,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    isDragging,
    offset: offset.get(),
    reset,
  };
}
