/**
 * Swipe Hook (Web)
 * 
 * Professional Framer Motion swipe hook for card swiping interactions.
 * 
 * Location: apps/web/src/hooks/useSwipe.ts
 */

'use client';

import { useState, useCallback, useRef } from 'react';
import { useMotionValue, useTransform, animate, type MotionValue } from 'framer-motion';
import { haptics } from '@/lib/haptics';
import { springConfigs, motionDurations } from '@/effects/framer-motion/variants';

interface UseSwipeOptions {
  onSwipe?: (direction: 'left' | 'right') => void;
  swipeThreshold?: number;
  swipeVelocity?: number;
  hapticFeedback?: boolean;
}

export interface UseSwipeReturn {
  isDragging: boolean;
  direction: 'left' | 'right' | null;
  x: MotionValue<number>;
  rotate: MotionValue<number>;
  opacity: MotionValue<number>;
  likeOpacity: MotionValue<number>;
  passOpacity: MotionValue<number>;
  handleMouseDown: (e: React.MouseEvent) => void;
  handleMouseMove: (e: React.MouseEvent) => void;
  handleMouseUp: (e: React.MouseEvent) => void;
  handleTouchStart: (e: React.TouchEvent) => void;
  handleTouchMove: (e: React.TouchEvent) => void;
  handleTouchEnd: (e: React.TouchEvent) => void;
  handleSwipe: (action: 'left' | 'right') => void;
  reset: () => void;
}

export function useSwipe({
  onSwipe,
  swipeThreshold = 150,
  swipeVelocity = 500,
  hapticFeedback = true,
}: UseSwipeOptions = {}): UseSwipeReturn {
  const [isDragging, setIsDragging] = useState(false);
  const [direction, setDirection] = useState<'left' | 'right' | null>(null);

  const x = useMotionValue<number>(0);
  const rotate = useMotionValue<number>(0);
  const opacity = useMotionValue<number>(1);
  const likeOpacity = useMotionValue<number>(0);
  const passOpacity = useMotionValue<number>(0);

  const startXRef = useRef(0);
  const isDraggingRef = useRef(false);

  const handleDragStart = useCallback(
    (clientX: number) => {
      setIsDragging(true);
      isDraggingRef.current = true;
      startXRef.current = clientX;
      if (hapticFeedback) {
        haptics.selection();
      }
    },
    [hapticFeedback]
  );

  // Transform x to rotate, opacity, and like/pass opacity
  const rotateValue = useTransform(x, (latestX) => {
    const clamped = Math.max(-300, Math.min(300, latestX));
    return (clamped / 300) * 30;
  });

  const opacityValue = useTransform(x, (latestX) => {
    const clamped = Math.max(-300, Math.min(300, latestX));
    if (clamped < -150) return Math.max(0, 1 + (clamped + 150) / 150);
    if (clamped > 150) return Math.max(0, 1 - (clamped - 150) / 150);
    return 1;
  });

  const likeOpacityValue = useTransform(x, (latestX) => {
    if (latestX < 0) return 0;
    return Math.min(1, latestX / 150);
  });

  const passOpacityValue = useTransform(x, (latestX) => {
    if (latestX > 0) return 0;
    return Math.min(1, Math.abs(latestX) / 150);
  });

  // Sync transform values to motion values for direct access
  rotateValue.on('change', (v) => rotate.set(v));
  opacityValue.on('change', (v) => opacity.set(v));
  likeOpacityValue.on('change', (v) => likeOpacity.set(v));
  passOpacityValue.on('change', (v) => passOpacity.set(v));

  const handleDrag = useCallback(
    (translationX: number) => {
      x.set(translationX);

      const threshold = 80;
      if (
        hapticFeedback &&
        Math.abs(translationX) > threshold &&
        Math.abs(translationX) < threshold + 20
      ) {
        haptics.trigger('light');
      }
    },
    [hapticFeedback, x]
  );

  const handleDragEnd = useCallback(
    (clientX: number, velocityX: number) => {
      setIsDragging(false);
      isDraggingRef.current = false;

      const translationX = clientX - startXRef.current;

      if (Math.abs(translationX) > swipeThreshold || Math.abs(velocityX) > swipeVelocity) {
        const action = translationX > 0 ? 'right' : 'left';
        setDirection(action);

        if (hapticFeedback) {
          haptics.trigger(action === 'right' ? 'success' : 'light');
        }

        onSwipe?.(action);

        // Animate out
        animate(x, action === 'right' ? 1000 : -1000, {
          ...springConfigs.smooth,
          duration: motionDurations.smooth,
        });
        animate(opacity, 0, {
          duration: motionDurations.fast,
        });

        // Reset after animation
        setTimeout(() => {
          x.set(0);
          rotate.set(0);
          opacity.set(1);
          likeOpacity.set(0);
          passOpacity.set(0);
          setDirection(null);
        }, 300);
      } else {
        // Spring back
        animate(x, 0, {
          ...springConfigs.smooth,
          duration: motionDurations.smooth,
        });
        animate(rotate, 0, {
          ...springConfigs.smooth,
          duration: motionDurations.smooth,
        });
        animate(opacity, 1, {
          ...springConfigs.smooth,
          duration: motionDurations.smooth,
        });
        animate(likeOpacity, 0, {
          ...springConfigs.smooth,
          duration: motionDurations.smooth,
        });
        animate(passOpacity, 0, {
          ...springConfigs.smooth,
          duration: motionDurations.smooth,
        });
        if (hapticFeedback) {
          haptics.trigger('light');
        }
      }
    },
    [
      swipeThreshold,
      swipeVelocity,
      hapticFeedback,
      onSwipe,
      x,
      rotate,
      opacity,
      likeOpacity,
      passOpacity,
    ]
  );

  const handleSwipe = useCallback(
    (action: 'left' | 'right') => {
      setDirection(action);
      if (hapticFeedback) {
        haptics.trigger(action === 'right' ? 'success' : 'light');
      }
      onSwipe?.(action);

      // Animate out
      animate(x, action === 'right' ? 1000 : -1000, {
        ...springConfigs.smooth,
        duration: motionDurations.smooth,
      });
      animate(opacity, 0, {
        duration: motionDurations.fast,
      });

      // Reset after animation
      setTimeout(() => {
        x.set(0);
        rotate.set(0);
        opacity.set(1);
        likeOpacity.set(0);
        passOpacity.set(0);
        setDirection(null);
      }, 300);
    },
    [hapticFeedback, onSwipe, x, rotate, opacity, likeOpacity, passOpacity]
  );

  const reset = useCallback(() => {
    animate(x, 0, {
      ...springConfigs.smooth,
      duration: motionDurations.smooth,
    });
    animate(rotate, 0, {
      ...springConfigs.smooth,
      duration: motionDurations.smooth,
    });
    animate(opacity, 1, {
      ...springConfigs.smooth,
      duration: motionDurations.smooth,
    });
    animate(likeOpacity, 0, {
      ...springConfigs.smooth,
      duration: motionDurations.smooth,
    });
    animate(passOpacity, 0, {
      ...springConfigs.smooth,
      duration: motionDurations.smooth,
    });
    setDirection(null);
    setIsDragging(false);
  }, [x, rotate, opacity, likeOpacity, passOpacity]);

  // Mouse/touch event handlers for web
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      handleDragStart(e.clientX);
    },
    [handleDragStart]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDraggingRef.current) return;
      const translationX = e.clientX - startXRef.current;
      handleDrag(translationX);
    },
    [handleDrag]
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent) => {
      if (!isDraggingRef.current) return;
      handleDragEnd(e.clientX, 0);
    },
    [handleDragEnd]
  );

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0];
      if (touch) {
        handleDragStart(touch.clientX);
      }
    },
    [handleDragStart]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isDraggingRef.current) return;
      const touch = e.touches[0];
      if (touch) {
        const translationX = touch.clientX - startXRef.current;
        handleDrag(translationX);
      }
    },
    [handleDrag]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!isDraggingRef.current) return;
      const touch = e.changedTouches[0];
      if (touch) {
        handleDragEnd(touch.clientX, 0);
      }
    },
    [handleDragEnd]
  );

  return {
    isDragging,
    direction,
    x,
    rotate,
    opacity,
    likeOpacity,
    passOpacity,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleSwipe,
    reset,
  };
}
