'use client';

import { useCallback } from 'react';
import {
  useMotionValue,
  animate,
  type MotionValue,
} from 'framer-motion';
import { springConfigs, motionDurations } from '../variants';

export type StickerAnimationType =
  | 'bounce'
  | 'spin'
  | 'pulse'
  | 'shake'
  | 'float'
  | 'grow'
  | 'wiggle'
  | 'flip';

export interface UseStickerAnimationOptions {
  animation?: StickerAnimationType;
  enabled?: boolean;
  duration?: number;
  intensity?: number;
}

export interface UseStickerAnimationReturn {
  scale: MotionValue<number>;
  rotation: MotionValue<number>;
  translateY: MotionValue<number>;
  translateX: MotionValue<number>;
  opacity: MotionValue<number>;
  trigger: () => void;
  reset: () => void;
}

const DEFAULT_ENABLED = true;
const DEFAULT_DURATION = 1000;
const DEFAULT_INTENSITY = 1;

/**
 * Hook for sticker animations with various playful effects
 * Provides trigger-based animations for interactive stickers
 */
export function useStickerAnimation(
  options: UseStickerAnimationOptions = {}
): UseStickerAnimationReturn {
  const {
    animation,
    enabled = DEFAULT_ENABLED,
    duration = DEFAULT_DURATION,
    intensity = DEFAULT_INTENSITY,
  } = options;

  const scale = useMotionValue(1);
  const rotation = useMotionValue(0);
  const translateY = useMotionValue(0);
  const translateX = useMotionValue(0);
  const opacity = useMotionValue(1);

  const reset = useCallback(() => {
    scale.set(1);
    rotation.set(0);
    translateY.set(0);
    translateX.set(0);
    opacity.set(1);
  }, [scale, rotation, translateY, translateX, opacity]);

  const trigger = useCallback(() => {
    if (!enabled || !animation) {
      return;
    }

    reset();

    switch (animation) {
      case 'bounce': {
        void animate(scale, 1.2 * intensity, springConfigs.bouncy).then(() => {
          void animate(scale, 1, springConfigs.smooth);
        });
        void animate(translateY, -10 * intensity, springConfigs.bouncy).then(() => {
          void animate(translateY, 0, springConfigs.smooth);
        });
        break;
      }

      case 'spin': {
        void animate(rotation, 360, {
          duration: (duration / 2) / 1000,
          ease: 'linear',
          repeat: Infinity,
        });
        break;
      }

      case 'pulse': {
        void animate(scale, [1, 1.15 * intensity, 1], {
          duration: motionDurations.smooth / 1000,
          ease: 'easeInOut',
          repeat: Infinity,
        });
        break;
      }

      case 'shake': {
        void animate(translateX, [-8 * intensity, 8 * intensity, -8 * intensity, 8 * intensity, 0], {
          duration: 0.25,
          ease: 'linear',
        });
        break;
      }

      case 'float': {
        void animate(translateY, [-8 * intensity, 0], {
          duration: (duration / 2) / 1000,
          ease: 'easeInOut',
          repeat: Infinity,
          repeatType: 'reverse',
        });
        break;
      }

      case 'grow': {
        void animate(scale, 1.3 * intensity, springConfigs.bouncy).then(() => {
          void animate(scale, 1, springConfigs.smooth);
        });
        break;
      }

      case 'wiggle': {
        void animate(rotation, [-15 * intensity, 15 * intensity, -15 * intensity, 15 * intensity, 0], {
          duration: 0.4,
          ease: 'linear',
        });
        break;
      }

      case 'flip': {
        void animate(rotation, [180, 360, 0], {
          duration: duration / 1000,
          ease: 'easeInOut',
        });
        break;
      }

      default:
        break;
    }
  }, [enabled, animation, duration, intensity, scale, rotation, translateY, translateX, reset]);

  return {
    scale,
    rotation,
    translateY,
    translateX,
    opacity,
    trigger,
    reset,
  };
}
