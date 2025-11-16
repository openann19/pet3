'use client';

import { useEffect } from 'react';
import { useMotionValue, animate, type MotionValue } from '@petspark/motion';
import { springConfigs, timingConfigs } from './transitions';
import type { AnimatedStyle } from './animated-view';

export interface UseScaleAnimationOptions {
  initial?: boolean;
  initialScale?: number;
  duration?: number;
  enabled?: boolean;
  useSpring?: boolean;
}

export interface UseScaleAnimationReturn {
  animatedStyle: AnimatedStyle;
  scale: MotionValue<number>;
  scaleIn: () => void;
  scaleOut: () => void;
  toggle: () => void;
}

export function useScaleAnimation(options: UseScaleAnimationOptions = {}): UseScaleAnimationReturn {
  const {
    initial = true,
    initialScale = 0.95,
    duration = timingConfigs.smooth.duration,
    enabled = true,
    useSpring = false,
  } = options;

  const scale = useMotionValue(enabled ? (initial ? 1 : initialScale) : 1);

  const scaleIn = () => {
    if (!enabled) return;
    if (useSpring) {
      animate(scale, 1, { type: 'spring', ...springConfigs.smooth });
    } else {
      animate(scale, 1, { duration: (duration ?? 300) / 1000 });
    }
  };

  const scaleOut = () => {
    if (!enabled) return;
    if (useSpring) {
      animate(scale, initialScale, { type: 'spring', ...springConfigs.smooth });
    } else {
      animate(scale, initialScale, { duration: (duration ?? 300) / 1000 });
    }
  };

  const toggle = () => {
    if (scale.get() > 0.9) {
      scaleOut();
    } else {
      scaleIn();
    }
  };

  useEffect(() => {
    if (!enabled) {
      scale.set(1);
      return;
    }
    if (initial) {
      scaleIn();
    } else {
      scaleOut();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, initial]);

  const animatedStyle: AnimatedStyle = {
    transform: [{ scale }],
  };

  return {
    animatedStyle,
    scale,
    scaleIn,
    scaleOut,
    toggle,
  };
}
