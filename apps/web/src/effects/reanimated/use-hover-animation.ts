'use client';

import { useCallback, useState } from 'react';
import { useMotionValue, animate, type MotionValue } from 'framer-motion';
import { springConfigs, timingConfigs } from './transitions';
import type { CSSProperties } from 'react';

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

export function useHoverAnimation(options: UseHoverAnimationOptions = {}): UseHoverAnimationReturn {
  const {
    scale: hoverScale = 1.02,
    duration = timingConfigs.fast.duration,
    enabled = true,
  } = options;

  const scale = useMotionValue(1);
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const handleMouseEnter = useCallback(() => {
    if (!enabled) return;
    setIsHovered(true);
    animate(scale, hoverScale, {
      type: 'spring',
      damping: springConfigs.smooth.damping,
      stiffness: springConfigs.smooth.stiffness,
    });
  }, [enabled, hoverScale, scale]);

  const handleMouseLeave = useCallback(() => {
    if (!enabled) return;
    setIsHovered(false);
    animate(scale, 1, {
      type: 'spring',
      damping: springConfigs.smooth.damping,
      stiffness: springConfigs.smooth.stiffness,
    });
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
    animate(scale, targetScale, {
      type: 'spring',
      damping: springConfigs.smooth.damping,
      stiffness: springConfigs.smooth.stiffness,
    });
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
