'use client';

import { useMotionValue, useTransform, animate, type MotionValue } from 'framer-motion';
import { useMemo, useEffect } from 'react';
import { timingConfigs } from '@/effects/reanimated/transitions';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export interface UseMessageAgeEffectOptions {
  timestamp: number | string;
  enabled?: boolean;
  fadeStartAge?: number;
  fadeEndAge?: number;
  opacityMin?: number;
  scaleMin?: number;
}

export interface UseMessageAgeEffectReturn {
  opacity: MotionValue<number>;
  scale: MotionValue<number>;
  animatedStyle: {
    opacity: MotionValue<number>;
    scale: MotionValue<number>;
  };
}

const DEFAULT_ENABLED = true;
const DEFAULT_FADE_START_AGE = 86400000;
const DEFAULT_FADE_END_AGE = 604800000;
const DEFAULT_OPACITY_MIN = 0.6;
const DEFAULT_SCALE_MIN = 0.98;

function getMessageAge(timestamp: number | string): number {
  const timestampMs = typeof timestamp === 'string' ? new Date(timestamp).getTime() : timestamp;
  return Date.now() - timestampMs;
}

export function useMessageAgeEffect(
  options: UseMessageAgeEffectOptions
): UseMessageAgeEffectReturn {
  const {
    timestamp,
    enabled = DEFAULT_ENABLED,
    fadeStartAge = DEFAULT_FADE_START_AGE,
    fadeEndAge = DEFAULT_FADE_END_AGE,
    opacityMin = DEFAULT_OPACITY_MIN,
    scaleMin = DEFAULT_SCALE_MIN,
  } = options;

  const prefersReducedMotion = useReducedMotion();
  const duration = prefersReducedMotion ? 0 : (timingConfigs.smooth.duration ?? 0.3);

  const age = useMemo(() => {
    if (!enabled) {
      return 0;
    }
    return getMessageAge(timestamp);
  }, [timestamp, enabled]);

  const opacity = useMotionValue(1);
  const scale = useMotionValue(1);

  useEffect(() => {
    if (!enabled || age < fadeStartAge) {
      animate(opacity, 1, { duration: prefersReducedMotion ? 0 : (timingConfigs.fast.duration ?? 0.15) });
      animate(scale, 1, { duration: prefersReducedMotion ? 0 : (timingConfigs.fast.duration ?? 0.15) });
      return;
    }

    const progress = Math.min((age - fadeStartAge) / (fadeEndAge - fadeStartAge), 1);
    const clampedProgress = Math.max(0, Math.min(1, progress));
    const targetOpacity = 1 - (1 - opacityMin) * clampedProgress;
    const targetScale = 1 - (1 - scaleMin) * clampedProgress;

    animate(opacity, targetOpacity, { duration });
    animate(scale, targetScale, { duration });
  }, [age, enabled, fadeStartAge, fadeEndAge, opacityMin, scaleMin, opacity, scale, duration, prefersReducedMotion]);

  const animatedStyle = {
    opacity,
    scale,
  };

  return {
    opacity,
    scale,
    animatedStyle,
  };
}
