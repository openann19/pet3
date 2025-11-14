'use client';

import {
  useMotionValue,
  animate,
  type MotionValue,
} from 'framer-motion';
import { useEffect } from 'react';
import { timingConfigs } from '@/effects/reanimated/transitions';
import type { CSSProperties } from 'react';
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
  style: CSSProperties;
}

/**
 * Web-specific floating particle hook
 * Adapts the base hook with web-specific defaults and behaviors
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

  const x = useMotionValue(initialX);
  const y = useMotionValue(initialY);
  const opacityValue = useMotionValue(0);
  const scale = useMotionValue(0.5);

  useEffect(() => {
    const seed = Date.now() + initialX + initialY;
    const rng = makeRng(seed);
    const randomX1 = rng() * width;
    const randomX2 = rng() * width;
    const randomX3 = rng() * width;
    const randomY1 = rng() * height;
    const randomY2 = rng() * height;
    const randomY3 = rng() * height;

    // Animate x through sequence of points
    void animate(x, [randomX1, randomX2, randomX3, randomX1], {
      duration: duration * timingConfigs.smooth.duration,
      ease: timingConfigs.smooth.ease as string,
      repeat: Infinity,
      times: [0, 0.33, 0.66, 1],
    });

    // Animate y through sequence of points
    void animate(y, [randomY1, randomY2, randomY3, randomY1], {
      duration: duration * timingConfigs.smooth.duration,
      ease: timingConfigs.smooth.ease as string,
      repeat: Infinity,
      times: [0, 0.33, 0.66, 1],
    });

    // Animate opacity
    void animate(opacityValue, [0, opacity, opacity * 0.5, opacity, 0], {
      duration: duration,
      ease: 'easeInOut',
      repeat: Infinity,
      times: [0, 0.2, 0.4, 0.6, 1],
    });

    // Animate scale
    void animate(scale, [0.5, 1, 0.8, 1, 0.5], {
      duration: duration,
      ease: 'easeInOut',
      repeat: Infinity,
      times: [0, 0.2, 0.4, 0.6, 1],
    });
  }, [width, height, duration, opacity, initialX, initialY, x, y, opacityValue, scale]);

  // Return style object - components should use motion.div with style prop for reactive updates
  const style: CSSProperties = {
    transform: `translateX(${x.get()}px) translateY(${y.get()}px) scale(${scale.get()})`,
    opacity: opacityValue.get(),
  };

  return {
    x,
    y,
    opacity: opacityValue,
    scale,
    style,
  };
}
