'use client';

import { useCallback, useState } from 'react';
import { useMotionValue, animate, type MotionValue } from 'framer-motion';
import { springConfigs, motionDurations } from '../variants';

export interface UseHoverAnimationOptions {
  scale?: number;
  duration?: number;
  enabled?: boolean;
}

export interface UseHoverAnimationReturn {
  animatedStyle: { scale: MotionValue<number> };
  scale: MotionValue<number>;
  handleMouseEnter: () => void;
  handleMouseLeave: () => void;
  handleMouseDown: () => void;
  handleMouseUp: () => void;
}

/**
 * Hook for hover and press animations
 * Provides smooth scale transitions on hover and press
 */
export function useHoverAnimation(options: UseHoverAnimationOptions = {}): UseHoverAnimationReturn {
  const {
    scale: hoverScale = 1.02,
    duration = motionDurations.fast,
    enabled = true,
  } = options;

  const scale = useMotionValue(1);
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const handleMouseEnter = useCallback(() => {
    if (!enabled) return;
    setIsHovered(true);
    animate(scale, hoverScale, springConfigs.smooth);
  }, [enabled, hoverScale, scale]);

  const handleMouseLeave = useCallback(() => {
    if (!enabled) return;
    setIsHovered(false);
    animate(scale, 1, springConfigs.smooth);
  }, [enabled, scale]);

  const handleMouseDown = useCallback(() => {
    if (!enabled) return;
    setIsPressed(true);
    animate(scale, 0.98, {
      duration: duration / 1000 / 2,
      ease: 'easeOut',
    });
  }, [enabled, duration, scale]);

  const handleMouseUp = useCallback(() => {
    if (!enabled) return;
    setIsPressed(false);
    const targetScale = isHovered ? hoverScale : 1;
    animate(scale, targetScale, springConfigs.smooth);
  }, [enabled, hoverScale, isHovered, scale]);

  return {
    animatedStyle: { scale },
    scale,
    handleMouseEnter,
    handleMouseLeave,
    handleMouseDown,
    handleMouseUp,
  };
}
