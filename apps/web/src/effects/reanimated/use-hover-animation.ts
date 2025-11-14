'use client';

import { useCallback } from 'react';
import { useMotionValue, animate, type MotionValue } from 'framer-motion';
import { springConfigs, timingConfigs } from './transitions';

import type { AnimatedStyle } from './animated-view';

export interface UseHoverAnimationOptions {
  scale?: number;
  duration?: number;
  enabled?: boolean;
}


export interface UseHoverAnimationReturn {
  animatedStyle: AnimatedStyle;
  handleMouseEnter: () => void;
  handleMouseLeave: () => void;
  handleMouseDown: () => void;
  handleMouseUp: () => void;
}



export function useHoverAnimation(options: UseHoverAnimationOptions = {}): UseHoverAnimationReturn {
  const {
    scale: hoverScale = 1.02,
    duration = timingConfigs.fast.duration,
    enabled = true,
  } = options;

  const scale = useMotionValue(1);
  const isHovered = useMotionValue(0);
  const isPressed = useMotionValue(0);

  const handleMouseEnter = useCallback(() => {
    if (!enabled) return;
    isHovered.set(1);
    animate(scale, hoverScale, { type: 'spring', ...springConfigs.smooth });
  }, [enabled, hoverScale, isHovered, scale]);

  const handleMouseLeave = useCallback(() => {
    if (!enabled) return;
    isHovered.set(0);
    animate(scale, 1, { type: 'spring', ...springConfigs.smooth });
  }, [enabled, isHovered, scale]);

  const handleMouseDown = useCallback(() => {
    if (!enabled) return;
    isPressed.set(1);
    animate(scale, 0.98, { duration: (duration ?? 150) / 2000 });
  }, [enabled, duration, isPressed, scale]);

  const handleMouseUp = useCallback(() => {
    if (!enabled) return;
    isPressed.set(0);
    const targetScale = isHovered.get() === 1 ? hoverScale : 1;
    animate(scale, targetScale, { type: 'spring', ...springConfigs.smooth });
  }, [enabled, hoverScale, isHovered, isPressed, scale]);

  const animatedStyle: AnimatedStyle = {
    transform: [{ scale }],
  };

  return {
    animatedStyle,
    handleMouseEnter,
    handleMouseLeave,
    handleMouseDown,
    handleMouseUp,
  };
}
