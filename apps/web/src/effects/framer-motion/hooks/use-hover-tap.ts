'use client';

import { useMotionValue, animate, type MotionValue, type Variants } from 'framer-motion';
import { useCallback } from 'react';
import { haptics } from '@/lib/haptics';

export interface UseHoverTapOptions {
  hoverScale?: number;
  tapScale?: number;
  damping?: number;
  stiffness?: number;
  onPress?: () => void;
  hapticFeedback?: boolean;
}

export interface UseHoverTapReturn {
  scale: MotionValue<number>;
  variants: Variants;
  handleMouseEnter: () => void;
  handleMouseLeave: () => void;
  handlePress: () => void;
}

const DEFAULT_HOVER_SCALE = 1.1;
const DEFAULT_TAP_SCALE = 0.95;
const DEFAULT_DAMPING = 15;
const DEFAULT_STIFFNESS = 400;

/**
 * Framer Motion hook for hover and tap interactions
 * Combines hover lift and tap bounce effects
 */
export function useHoverTap(options: UseHoverTapOptions = {}): UseHoverTapReturn {
  const {
    hoverScale = DEFAULT_HOVER_SCALE,
    tapScale = DEFAULT_TAP_SCALE,
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
    hover: {
      scale: hoverScale,
      transition: {
        type: 'spring',
        damping,
        stiffness,
      },
    },
    tap: {
      scale: tapScale,
      transition: {
        type: 'spring',
        damping,
        stiffness,
      },
    },
  };

  const handleMouseEnter = useCallback(() => {
    void animate(scale, hoverScale, {
      type: 'spring',
      damping,
      stiffness,
    });
  }, [scale, hoverScale, damping, stiffness]);

  const handleMouseLeave = useCallback(() => {
    void animate(scale, 1, {
      type: 'spring',
      damping,
      stiffness,
    });
  }, [scale, damping, stiffness]);

  const handlePress = useCallback(() => {
    if (hapticFeedback) {
      haptics.impact('light');
    }

    void animate(scale, tapScale, {
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
  }, [scale, tapScale, damping, stiffness, onPress, hapticFeedback]);

  return {
    scale,
    variants,
    handleMouseEnter,
    handleMouseLeave,
    handlePress,
  };
}
