'use client';

import { useMotionValue, animate, useTransform, type MotionValue } from 'framer-motion';
import { useEffect } from 'react';
import type { CSSProperties } from 'react';

export interface UseGlowPulseOptions {
  duration?: number;
  intensity?: number;
  enabled?: boolean;
  color?: string;
}

export interface UseGlowPulseReturn {
  animatedStyle: { boxShadow: string };
  shadowOpacity: MotionValue<number>;
  shadowRadius: MotionValue<number>;
  start: () => void;
  stop: () => void;
}

const DEFAULT_DURATION = 2000;
const DEFAULT_INTENSITY = 1;
const DEFAULT_COLOR = 'rgba(var(--primary), 0.6)';

export function useGlowPulse(options: UseGlowPulseOptions = {}): UseGlowPulseReturn {
  const {
    duration = DEFAULT_DURATION,
    intensity = DEFAULT_INTENSITY,
    enabled = true,
    color = DEFAULT_COLOR,
  } = options;

  const progress = useMotionValue(0);

  const shadowOpacity = useTransform(progress, [0, 0.5, 1], [
    0.3 * intensity,
    0.6 * intensity,
    0.3 * intensity,
  ]);

  const shadowRadius = useTransform(progress, [0, 0.5, 1], [10, 20, 10]);

  const start = () => {
    animate(progress, [0, 1], {
      duration: duration / 1000,
      ease: 'easeInOut',
      repeat: Infinity,
      repeatType: 'reverse',
    });
  };

  const stop = () => {
    progress.set(0);
  };

  useEffect(() => {
    if (enabled) {
      start();
    } else {
      stop();
    }
  }, [enabled, progress]);

  return {
    animatedStyle: {
      boxShadow: `0 0 ${shadowRadius.get()}px ${color}`,
    },
    shadowOpacity,
    shadowRadius,
    start,
    stop,
  };
}
