'use client';

import { useMotionValue, animate, type MotionValue } from 'framer-motion';
import { useCallback } from 'react';
import { timingConfigs } from '@/effects/reanimated/transitions';
import { haptics } from '@/lib/haptics';
import type { CSSProperties } from 'react';
import type { MotionStyle } from 'framer-motion';

export type DeleteAnimationContext = 'self-delete' | 'admin-delete' | 'emoji-media' | 'group-chat';

export interface UseDeleteBubbleAnimationOptions {
  onFinish?: () => void;
  context?: DeleteAnimationContext;
  hapticFeedback?: boolean;
  duration?: number;
}

export interface UseDeleteBubbleAnimationReturn {
  opacity: MotionValue<number>;
  scale: MotionValue<number>;
  translateY: MotionValue<number>;
  translateX: MotionValue<number>;
  height: MotionValue<number>;
  rotation: MotionValue<number>;
  animatedStyle: MotionStyle;
  triggerDelete: () => void;
  reset: () => void;
}

const DEFAULT_DURATION = 300;
const DEFAULT_HAPTIC_FEEDBACK = true;

export function useDeleteBubbleAnimation(
  options: UseDeleteBubbleAnimationOptions = {}
): UseDeleteBubbleAnimationReturn {
  const {
    onFinish,
    context = 'self-delete',
    hapticFeedback = DEFAULT_HAPTIC_FEEDBACK,
    duration = DEFAULT_DURATION,
  } = options;

  const opacity = useMotionValue(1);
  const scale = useMotionValue(1);
  const translateY = useMotionValue(0);
  const translateX = useMotionValue(0);
  const height = useMotionValue(60);
  const rotation = useMotionValue(0);

  // Extract completion callback to reduce nesting
  const handleAnimationComplete = useCallback(
    (finished?: boolean) => {
      if (finished && onFinish) {
        onFinish();
      }
    },
    [onFinish]
  );

  const triggerDelete = useCallback(() => {
    if (hapticFeedback) {
      haptics.impact(context === 'admin-delete' ? 'heavy' : 'medium');
    }

    const durationSeconds = duration / 1000;

    switch (context) {
      case 'self-delete': {
        animate(scale, [1, 1.1, 0], {
          duration: durationSeconds,
          ease: 'easeOut',
          times: [0, 0.1, 1],
        });
        animate(translateY, -40, {
          duration: durationSeconds,
          ease: 'easeOut',
        });
        animate(opacity, 0, {
          duration: durationSeconds,
          ease: 'easeOut',
        });
        animate(height, 0, {
          duration: durationSeconds,
          ease: 'easeOut',
        });
        break;
      }

      case 'admin-delete': {
        animate(scale, [1, 1.15, 0.8, 0], {
          duration: durationSeconds,
          ease: 'easeOut',
          times: [0, 0.2, 0.5, 1],
        });
        animate(translateX, [0, 10, -10, 0], {
          duration: durationSeconds,
          ease: 'easeOut',
          times: [0, 0.2, 0.4, 1],
        });
        animate(translateY, 0, {
          duration: durationSeconds * 0.5,
          ease: 'easeOut',
        });
        animate(opacity, [1, 0.7, 0], {
          duration: durationSeconds,
          ease: 'easeOut',
          times: [0, 0.2, 1],
        });
        animate(height, 0, {
          duration: durationSeconds,
          ease: 'easeOut',
        });
        animate(rotation, [0, 5, -5, 0], {
          duration: durationSeconds,
          ease: 'easeOut',
          times: [0, 0.2, 0.4, 1],
        });
        break;
      }

      case 'emoji-media': {
        animate(scale, [1, 1.2, 0], {
          duration: durationSeconds,
          ease: 'easeOut',
          times: [0, 0.2, 1],
        });
        animate(opacity, [1, 0.8, 0], {
          duration: durationSeconds,
          ease: 'easeOut',
          times: [0, 0.2, 1],
        });
        animate(height, 0, {
          duration: durationSeconds,
          ease: 'easeOut',
        });
        animate(rotation, Math.random() > 0.5 ? 15 : -15, {
          duration: durationSeconds,
          ease: 'easeOut',
        });
        break;
      }

      case 'group-chat': {
        animate(scale, 0.95, {
          duration: durationSeconds * 0.3,
          ease: 'easeOut',
        });
        animate(opacity, [1, 0.5, 0], {
          duration: durationSeconds,
          ease: 'easeOut',
          times: [0, 0.3, 1],
        });
        animate(height, 0, {
          duration: durationSeconds,
          ease: 'easeOut',
        });
        break;
      }

      default: {
        animate(scale, 0, {
          duration: durationSeconds,
          ease: 'easeOut',
        });
        animate(opacity, 0, {
          duration: durationSeconds,
          ease: 'easeOut',
        });
        animate(height, 0, {
          duration: durationSeconds,
          ease: 'easeOut',
        });
      }
    }

    // Handle completion callback after animation setup
    setTimeout(() => {
      handleAnimationComplete(true);
    }, duration);
  }, [
    context,
    duration,
    hapticFeedback,
    handleAnimationComplete,
    opacity,
    scale,
    translateY,
    translateX,
    height,
    rotation,
  ]);

  const reset = useCallback(() => {
    opacity.set(1);
    scale.set(1);
    translateY.set(0);
    translateX.set(0);
    height.set(60);
    rotation.set(0);
  }, [opacity, scale, translateY, translateX, height, rotation]);

  return {
    opacity,
    scale,
    translateY,
    translateX,
    height,
    rotation,
    animatedStyle: {
      opacity,
      scale,
      y: translateY,
      x: translateX,
      height,
      rotate: rotation,
      overflow: 'hidden',
    } as import('framer-motion').MotionStyle,
    triggerDelete,
    reset,
  };
}
