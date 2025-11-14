'use client';

import { useMotionValue, animate, useTransform, type MotionValue, type Variants } from 'framer-motion';
import { useEffect, useCallback } from 'react';

export interface UseGlowPulseOptions {
  duration?: number;
  intensity?: number;
  enabled?: boolean;
  color?: string;
  minRadius?: number;
  maxRadius?: number;
}

export interface UseGlowPulseReturn {
  variants: Variants;
  progress: MotionValue<number>;
  shadowOpacity: MotionValue<number>;
  shadowRadius: MotionValue<number>;
  start: () => void;
  stop: () => void;
  animatedStyle: { boxShadow: string };
}

const DEFAULT_DURATION = 2000;
const DEFAULT_INTENSITY = 1;
const DEFAULT_COLOR = 'rgba(var(--primary), 0.6)';
const DEFAULT_MIN_RADIUS = 10;
const DEFAULT_MAX_RADIUS = 20;

/**
 * Framer Motion hook for glowing pulse animations
 * Creates a pulsing shadow/glow effect
 */
export function useGlowPulse(options: UseGlowPulseOptions = {}): UseGlowPulseReturn {
  const {
    duration = DEFAULT_DURATION,
    intensity = DEFAULT_INTENSITY,
    enabled = true,
    color = DEFAULT_COLOR,
    minRadius = DEFAULT_MIN_RADIUS,
    maxRadius = DEFAULT_MAX_RADIUS,
  } = options;

  const progress = useMotionValue(0);

  const shadowOpacity = useTransform(progress, [0, 0.5, 1], [
    0.3 * intensity,
    0.6 * intensity,
    0.3 * intensity,
  ]);

  const shadowRadius = useTransform(progress, [0, 0.5, 1], [
    minRadius,
    maxRadius,
    minRadius,
  ]);

  const start = useCallback(() => {
    void animate(progress, [0, 1], {
      duration: duration / 1000,
      ease: 'easeInOut',
      repeat: Infinity,
      repeatType: 'reverse',
    });
  }, [progress, duration]);

  const stop = useCallback(() => {
    progress.set(0);
  }, [progress]);

  useEffect(() => {
    if (enabled) {
      start();
      return () => stop();
    }
    stop();
    return undefined;
  }, [enabled, start, stop]);

  const variants: Variants = {
    pulse: {
      boxShadow: [
        `0 0 ${minRadius}px ${color}`,
        `0 0 ${maxRadius}px ${color}`,
        `0 0 ${minRadius}px ${color}`,
      ],
      transition: {
        duration: duration / 1000,
        ease: 'easeInOut',
        repeat: Infinity,
        repeatType: 'reverse',
      },
    },
    initial: {
      boxShadow: `0 0 ${minRadius}px ${color}`,
    },
  };

  return {
    variants,
    progress,
    shadowOpacity,
    shadowRadius,
    start,
    stop,
    animatedStyle: {
      boxShadow: `0 0 ${shadowRadius.get()}px ${color}`,
    },
  };
}
