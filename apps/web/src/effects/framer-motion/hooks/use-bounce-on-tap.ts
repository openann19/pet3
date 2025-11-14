'use client';

import { useMotionValue, animate, type MotionValue, type Variants } from 'framer-motion';
import { haptics } from '@/lib/haptics';
import { useCallback } from 'react';

export interface UseBounceOnTapOptions {
  scale?: number;
  duration?: number;
  damping?: number;
  stiffness?: number;
  onPress?: () => void;
  hapticFeedback?: boolean;
}

export interface UseBounceOnTapReturn {
  scale: MotionValue<number>;
  variants: Variants;
  handlePress: () => void;
}

const DEFAULT_SCALE = 0.95;
const DEFAULT_DAMPING = 15;
const DEFAULT_STIFFNESS = 400;

/**
 * Framer Motion hook for bounce-on-tap effect
 * Provides smooth scale animation with haptic feedback
 */
export function useBounceOnTap(options: UseBounceOnTapOptions = {}): UseBounceOnTapReturn {
  const {
    scale: scaleValue = DEFAULT_SCALE,
    damping = DEFAULT_DAMPING,
    stiffness = DEFAULT_STIFFNESS,
    onPress,
    hapticFeedback = true,
  } = options;

  const scale = useMotionValue(1);

  const variants: Variants = {
    rest: {
      scale: 1,
      transition: {
        type: 'spring',
        damping,
        stiffness,
      },
    },
    tap: {
      scale: scaleValue,
      transition: {
        type: 'spring',
        damping,
        stiffness,
      },
    },
  };

  const handlePress = useCallback(() => {
    if (hapticFeedback) {
      haptics.impact('light');
    }

    void animate(scale, scaleValue, {
      type: 'spring',
      damping,
      stiffness,
    }).then(() => {
      void animate(scale, 1, {
        type: 'spring',
        damping,
        stiffness,
      });
    });

    onPress?.();
  }, [scale, scaleValue, damping, stiffness, onPress, hapticFeedback]);

  return {
    scale,
    variants,
    handlePress,
  };
}
