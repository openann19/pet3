/**
 * Breathing Animation
 * Gentle, organic breathing effect for ambient UI elements
 */

import {
  useMotionValue,
  animate,
  useTransform,
  type MotionValue,
} from 'framer-motion';
import { useEffect } from 'react';
import { isTruthy } from '@petspark/shared';
import { useMotionStyle } from './use-motion-style';
import type { CSSProperties } from 'react';

export interface UseBreathingAnimationOptions {
  minScale?: number;
  maxScale?: number;
  duration?: number;
  enabled?: boolean;
  easing?: 'ease' | 'sine' | 'cubic';
}

export interface UseBreathingAnimationReturn {
  animatedStyle: CSSProperties;
  progress: MotionValue<number>;
}

export function useBreathingAnimation(options: UseBreathingAnimationOptions = {}): UseBreathingAnimationReturn {
  const {
    minScale = 0.98,
    maxScale = 1.02,
    duration = 3000,
    enabled = true,
    easing = 'sine',
  } = options;

  const progress = useMotionValue(0);

  const easingMap = {
    ease: 'easeInOut',
    sine: [0.445, 0.05, 0.55, 0.95] as [number, number, number, number],
    cubic: [0.65, 0, 0.35, 1] as [number, number, number, number],
  };

  useEffect(() => {
    if (isTruthy(enabled)) {
      void animate(progress, [0, 1, 0], {
        duration: (duration * 2) / 1000, // Full cycle (0->1->0)
        ease: easingMap[easing],
        repeat: Infinity,
        times: [0, 0.5, 1],
      });
    } else {
      void animate(progress, 0, {
        duration: 0.3,
        ease: 'easeOut',
      });
    }
  }, [enabled, duration, easing, progress]);

  // Use useTransform for interpolation
  const scale = useTransform(progress, [0, 0.5, 1], [minScale, maxScale, minScale]);
  const opacity = useTransform(progress, [0, 0.5, 1], [0.95, 1, 0.95]);

  const animatedStyle = useMotionStyle(() => {
    return {
      transform: [{ scale: scale.get() }],
      opacity: opacity.get(),
    };
  });

  return {
    animatedStyle,
    progress,
  };
}
