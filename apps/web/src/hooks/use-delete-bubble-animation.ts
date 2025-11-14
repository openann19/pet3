'use client';

import {
  useMotionValue,
  animate,
  type MotionValue,
} from 'framer-motion';
import { useCallback } from 'react';
import { springConfigs, timingConfigs } from '@/effects/reanimated/transitions';
import { haptics } from '@/lib/haptics';

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
  animatedStyle: {
    opacity: MotionValue<number>;
    scale: MotionValue<number>;
    y: MotionValue<number>;
    x: MotionValue<number>;
    rotate: MotionValue<number>;
    height: MotionValue<number>;
  };
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

  const triggerDelete = useCallback(() => {
    if (hapticFeedback) {
      haptics.impact(context === 'admin-delete' ? 'heavy' : 'medium');
    }

    const durationSeconds = duration / 1000;

    switch (context) {
      case 'self-delete': {
        void animate(scale, [1.1, 0], {
          duration: durationSeconds,
          times: [0, 1],
          ease: 'easeInOut',
        });
        void animate(translateY, -40, {
          duration: durationSeconds,
          ease: timingConfigs.smooth.ease as string,
        });
        void animate(opacity, 0, {
          duration: durationSeconds,
          ease: timingConfigs.smooth.ease as string,
        });
        void animate(height, 0, {
          duration: durationSeconds,
          ease: 'easeInOut',
        }).then(() => {
          onFinish?.();
        });
        break;
      }

      case 'admin-delete': {
        void animate(scale, [1.15, 0.8, 0], {
          duration: durationSeconds,
          times: [0, 0.3, 1],
          ease: 'easeInOut',
        });
        void animate(translateX, [10, -10, 0], {
          duration: durationSeconds,
          times: [0, 0.5, 1],
          ease: 'easeInOut',
        });
        void animate(translateY, 0, {
          duration: durationSeconds * 0.5,
          ease: 'easeInOut',
        });
        void animate(opacity, [0.7, 0], {
          duration: durationSeconds,
          times: [0, 1],
          ease: 'easeInOut',
        });
        void animate(height, 0, {
          duration: durationSeconds,
          ease: 'easeInOut',
        }).then(() => {
          onFinish?.();
        });
        void animate(rotation, [5, -5, 0], {
          duration: durationSeconds,
          times: [0, 0.5, 1],
          ease: 'easeInOut',
        });
        break;
      }

      case 'emoji-media': {
        void animate(scale, [1.2, 0], {
          duration: durationSeconds,
          times: [0, 1],
          ease: 'easeInOut',
        });
        void animate(opacity, [0.8, 0], {
          duration: durationSeconds,
          times: [0, 1],
          ease: 'easeInOut',
        });
        void animate(height, 0, {
          duration: durationSeconds,
          ease: 'easeInOut',
        }).then(() => {
          onFinish?.();
        });
        void animate(rotation, Math.random() > 0.5 ? 15 : -15, {
          duration: durationSeconds,
          ease: 'easeInOut',
        });
        break;
      }

      case 'group-chat': {
        void animate(scale, 0.95, {
          duration: durationSeconds * 0.3,
          ease: 'easeInOut',
        });
        void animate(opacity, [0.5, 0], {
          duration: durationSeconds,
          times: [0, 1],
          ease: 'easeInOut',
        });
        void animate(height, 0, {
          duration: durationSeconds,
          ease: 'easeInOut',
        }).then(() => {
          onFinish?.();
        });
        break;
      }

      default: {
        void animate(scale, 0, {
          duration: durationSeconds,
          ease: 'easeInOut',
        });
        void animate(opacity, 0, {
          duration: durationSeconds,
          ease: 'easeInOut',
        });
        void animate(height, 0, {
          duration: durationSeconds,
          ease: 'easeInOut',
        }).then(() => {
          onFinish?.();
        });
      }
    }
  }, [
    context,
    duration,
    hapticFeedback,
    onFinish,
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

  const animatedStyle = {
    opacity,
    scale,
    y: translateY,
    x: translateX,
    rotate: rotation,
    height,
  };

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
      rotate: rotation,
      height,
    },
    triggerDelete,
    reset,
  };
}
