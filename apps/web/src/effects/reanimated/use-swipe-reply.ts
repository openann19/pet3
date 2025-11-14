'use client';

import {
  useMotionValue,
  animate,
  type MotionValue,
} from 'framer-motion';
import { useCallback } from 'react';
import { haptics } from '@/lib/haptics';
import { springConfigs, timingConfigs } from '@/effects/reanimated/transitions';
import { useMotionStyle } from './use-motion-style';
import type { CSSProperties } from 'react';

export interface UseSwipeReplyOptions {
  onReply?: () => void;
  threshold?: number;
  hapticFeedback?: boolean;
  enabled?: boolean;
}

export interface UseSwipeReplyReturn {
  translateX: MotionValue<number>;
  opacity: MotionValue<number>;
  previewOpacity: MotionValue<number>;
  previewScale: MotionValue<number>;
  animatedStyle: CSSProperties;
  previewStyle: CSSProperties;
  handleGestureStart: () => void;
  handleGestureUpdate: (translationX: number, velocityX: number) => void;
  handleGestureEnd: (translationX: number, velocityX: number) => void;
  reset: () => void;
}

const DEFAULT_THRESHOLD = 60;
const DEFAULT_HAPTIC_FEEDBACK = true;
const DEFAULT_ENABLED = true;

export function useSwipeReply(options: UseSwipeReplyOptions = {}): UseSwipeReplyReturn {
  const {
    onReply,
    threshold = DEFAULT_THRESHOLD,
    hapticFeedback = DEFAULT_HAPTIC_FEEDBACK,
    enabled = DEFAULT_ENABLED,
  } = options;

  const translateX = useMotionValue(0);
  const opacity = useMotionValue(0);
  const previewOpacity = useMotionValue(0);
  const previewScale = useMotionValue(0.9);
  const hasTriggeredHaptic = useMotionValue(0); // Use 0/1 as boolean

  const handleGestureStart = useCallback(() => {
    if (!enabled) {
      return;
    }
    hasTriggeredHaptic.set(0);
  }, [enabled, hasTriggeredHaptic]);

  const handleGestureUpdate = useCallback(
    (translationX: number, _velocityX: number) => {
      if (!enabled) {
        return;
      }

      const clampedX = Math.max(0, translationX);
      translateX.set(clampedX);

      const progress = Math.min(clampedX / threshold, 1);
      opacity.set(progress * 0.3);

      if (clampedX >= threshold && hasTriggeredHaptic.get() === 0) {
        if (hapticFeedback) {
          haptics.selection();
        }
        hasTriggeredHaptic.set(1);
      }
    },
    [enabled, threshold, hapticFeedback, translateX, opacity, hasTriggeredHaptic]
  );

  const handleGestureEnd = useCallback(
    (translationX: number, velocityX: number) => {
      if (!enabled) {
        return;
      }

      const shouldCommit = translationX >= threshold || velocityX > 500;

      if (shouldCommit) {
        void animate(translateX, threshold, {
          ...springConfigs.smooth,
        });
        void animate(opacity, 0.3, {
          duration: timingConfigs.fast.duration,
          ease: timingConfigs.fast.ease as string,
        });

        void animate(previewOpacity, 1, {
          ...springConfigs.bouncy,
        });
        void animate(previewScale, 1, {
          ...springConfigs.bouncy,
        });

        if (onReply) {
          onReply();
        }

        setTimeout(() => {
          reset();
        }, 2000);
      } else {
        reset();
      }
    },
    [enabled, threshold, onReply, translateX, opacity, previewOpacity, previewScale]
  );

  const reset = useCallback(() => {
    void animate(translateX, 0, {
      ...springConfigs.smooth,
    });
    void animate(opacity, 0, {
      duration: timingConfigs.fast.duration,
      ease: timingConfigs.fast.ease as string,
    });
    void animate(previewOpacity, 0, {
      duration: timingConfigs.fast.duration,
      ease: timingConfigs.fast.ease as string,
    });
    void animate(previewScale, 0.9, {
      duration: timingConfigs.fast.duration,
      ease: timingConfigs.fast.ease as string,
    });
    hasTriggeredHaptic.set(0);
  }, [translateX, opacity, previewOpacity, previewScale, hasTriggeredHaptic]);

  const animatedStyle = useMotionStyle(() => {
    return {
      transform: [{ translateX: translateX.get() }],
      opacity: opacity.get(),
    };
  });

  const previewStyle = useMotionStyle(() => {
    return {
      opacity: previewOpacity.get(),
      transform: [{ scale: previewScale.get() }],
    };
  });

  return {
    translateX,
    opacity,
    previewOpacity,
    previewScale,
    animatedStyle,
    previewStyle,
    handleGestureStart,
    handleGestureUpdate,
    handleGestureEnd,
    reset,
  };
}
