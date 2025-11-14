'use client';

import { useCallback } from 'react';
import {
  useMotionValue,
  animate,
  type MotionValue,
} from 'framer-motion';
import { springConfigs, timingConfigs } from './transitions';
import type { CSSProperties } from 'react';

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
  animatedStyle: CSSProperties;
  trigger: () => void;
  reset: () => void;
}

const DEFAULT_ENABLED = true;
const DEFAULT_DURATION = 1000;
const DEFAULT_INTENSITY = 1;

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
        void animate(scale, 1.2 * intensity, {
          ...springConfigs.bouncy,
        }).then(() => {
          void animate(scale, 1, {
            ...springConfigs.smooth,
          });
        });
        void animate(translateY, -10 * intensity, {
          ...springConfigs.bouncy,
        }).then(() => {
          void animate(translateY, 0, {
            ...springConfigs.smooth,
          });
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
          duration: timingConfigs.smooth.duration,
          ease: timingConfigs.smooth.ease as string,
          repeat: Infinity,
        });
        break;
      }

      case 'shake': {
        void animate(translateX, [-8 * intensity, 8 * intensity, -8 * intensity, 8 * intensity, 0], {
          duration: 0.25,
          ease: 'linear',
          times: [0, 0.25, 0.5, 0.75, 1],
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
        void animate(scale, 1.3 * intensity, {
          ...springConfigs.bouncy,
        }).then(() => {
          void animate(scale, 1, {
            ...springConfigs.smooth,
          });
        });
        break;
      }

      case 'wiggle': {
        void animate(rotation, [-15 * intensity, 15 * intensity, -15 * intensity, 15 * intensity, 0], {
          duration: 0.4,
          ease: 'linear',
          times: [0, 0.25, 0.5, 0.75, 1],
        });
        break;
      }

      case 'flip': {
        void animate(rotation, [180, 360, 0], {
          duration: duration / 1000,
          ease: 'easeInOut',
          times: [0, 0.5, 1],
        });
        break;
      }

      default:
        break;
    }
  }, [enabled, animation, duration, intensity, scale, rotation, translateY, translateX, reset]);

  // Return style object that will be updated via motion values
  // Components should use motion.div with style={{ scale, rotate, x: translateX, y: translateY, opacity }}
  const animatedStyle: CSSProperties = {
    transform: `scale(${scale.get()}) rotate(${rotation.get()}deg) translateX(${translateX.get()}px) translateY(${translateY.get()}px)`,
    opacity: opacity.get(),
  };

  return {
    animatedStyle,
    trigger,
    reset,
  };
}
