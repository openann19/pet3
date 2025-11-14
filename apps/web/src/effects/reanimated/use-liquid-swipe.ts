/**
 * Liquid Swipe Animation
 * Smooth, fluid swipe with elastic bounce and momentum
 */

import { useMotionValue, animate, type MotionValue } from 'framer-motion';
import { useCallback, useState } from 'react';
import { useMotionStyle } from './use-motion-style';
import type { CSSProperties } from 'react';

export interface UseLiquidSwipeOptions {
  threshold?: number;
  damping?: number;
  stiffness?: number;
  velocity?: number;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
}

export interface UseLiquidSwipeReturn {
  animatedStyle: CSSProperties;
  handleDragStart: (event: React.MouseEvent | React.TouchEvent) => void;
  handleDragMove: (event: React.MouseEvent | React.TouchEvent) => void;
  handleDragEnd: () => void;
  isDragging: boolean;
}

export function useLiquidSwipe(options: UseLiquidSwipeOptions = {}): UseLiquidSwipeReturn {
  const {
    threshold = 100,
    damping = 15,
    stiffness = 150,
    velocity = 1000,
    onSwipeLeft,
    onSwipeRight,
  } = options;

  const translateX = useMotionValue(0);
  const scale = useMotionValue(1);
  const rotate = useMotionValue(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);

  const handleDragStart = useCallback((event: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    const clientX = 'touches' in event ? (event.touches[0]?.clientX ?? 0) : event.clientX;
    setStartX(clientX);
  }, []);

  const handleDragMove = useCallback(
    (event: React.MouseEvent | React.TouchEvent) => {
      if (!isDragging) return;

      const clientX = 'touches' in event ? (event.touches[0]?.clientX ?? 0) : event.clientX;
      const deltaX = clientX - startX;

      translateX.set(deltaX);
      scale.set(1 - Math.abs(deltaX) / 1000);
      rotate.set(deltaX / 20);
    },
    [isDragging, startX, translateX, scale, rotate]
  );

  const handleDragEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);

    const currentTranslateX = translateX.get();

    if (Math.abs(currentTranslateX) > threshold) {
      // Swipe complete - use decay-like animation
      const direction = currentTranslateX > 0 ? 1 : -1;
      const targetX = currentTranslateX + direction * velocity * 0.1; // Approximate decay
      
      void animate(translateX, targetX, {
        type: 'spring',
        damping: 0.5,
        stiffness: 50,
      });

      if (direction > 0 && onSwipeRight) {
        onSwipeRight();
      } else if (direction < 0 && onSwipeLeft) {
        onSwipeLeft();
      }
    } else {
      // Return to center
      void animate(translateX, 0, {
        type: 'spring',
        damping,
        stiffness,
      });
      void animate(scale, 1, {
        type: 'spring',
        damping,
        stiffness,
      });
      void animate(rotate, 0, {
        type: 'spring',
        damping,
        stiffness,
      });
    }
  }, [isDragging, threshold, damping, stiffness, velocity, onSwipeLeft, onSwipeRight, translateX, scale, rotate]);

  const animatedStyle = useMotionStyle(() => ({
    transform: [
      { translateX: translateX.get() },
      { scale: scale.get() },
      { rotate: `${rotate.get()}deg` },
    ],
  }));

  return {
    animatedStyle,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    isDragging,
  };
}
