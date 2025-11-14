'use client';

import {
  useMotionValue,
  animate,
  type MotionValue,
} from 'framer-motion';
import { useEffect } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { transitions, motionDurations } from '../variants';
import { makeRng } from '@petspark/shared';

export interface UseFloatingParticleOptions {
  initialX?: number;
  initialY?: number;
  width?: number;
  height?: number;
  duration?: number;
  delay?: number;
  opacity?: number;
}

export interface UseFloatingParticleReturn {
  x: MotionValue<number>;
  y: MotionValue<number>;
  opacity: MotionValue<number>;
  scale: MotionValue<number>;
  style: { x: MotionValue<number>; y: MotionValue<number>; opacity: MotionValue<number>; scale: MotionValue<number> };
}

/**
 * Web-specific floating particle hook using Framer Motion
 * Respects prefers-reduced-motion by disabling infinite animations
 */
export function useFloatingParticle(
  options: UseFloatingParticleOptions = {}
): UseFloatingParticleReturn {
  const {
    initialX = 0,
    initialY = 0,
    width = 1920,
    height = 1080,
    duration = 15,
    opacity = 0.6,
  } = options;

  const prefersReducedMotion = useReducedMotion();
  const shouldAnimate = !prefersReducedMotion;

  const x = useMotionValue(initialX);
  const y = useMotionValue(initialY);
  const opacityValue = useMotionValue(shouldAnimate ? 0 : opacity);
  const scale = useMotionValue(shouldAnimate ? 0.5 : 1);

  useEffect(() => {
    if (!shouldAnimate) {
      opacityValue.set(opacity);
      scale.set(1);
      return;
    }

    const seed = Date.now() + initialX + initialY;
    const rng = makeRng(seed);
    const randomX1 = rng() * width;
    const randomX2 = rng() * width;
    const randomX3 = rng() * width;
    const randomY1 = rng() * height;
    const randomY2 = rng() * height;
    const randomY3 = rng() * height;

    const animationDuration = duration * motionDurations.smooth;

    void animate(x, [randomX1, randomX2, randomX3, randomX1], {
      duration: animationDuration,
      ease: transitions.smooth.ease,
      repeat: Infinity,
      times: [0, 0.33, 0.66, 1],
    });

    void animate(y, [randomY1, randomY2, randomY3, randomY1], {
      duration: animationDuration,
      ease: transitions.smooth.ease,
      repeat: Infinity,
      times: [0, 0.33, 0.66, 1],
    });

    void animate(opacityValue, [0, opacity, opacity * 0.5, opacity, 0], {
      duration: duration,
      ease: transitions.smooth.ease,
      repeat: Infinity,
      times: [0, 0.2, 0.4, 0.6, 1],
    });

    void animate(scale, [0.5, 1, 0.8, 1, 0.5], {
      duration: duration,
      ease: transitions.smooth.ease,
      repeat: Infinity,
      times: [0, 0.2, 0.4, 0.6, 1],
    });
  }, [shouldAnimate, width, height, duration, opacity, initialX, initialY, x, y, opacityValue, scale]);

  return {
    x,
    y,
    opacity: opacityValue,
    scale,
    style: { x, y, opacity: opacityValue, scale },
  };
}

