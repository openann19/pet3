'use client';

import {
  useMotionValue,
  animate,
  type MotionValue,
} from 'framer-motion';
import { useEffect } from 'react';
import { springConfigs, motionDurations } from '../variants';

export interface UseGradientAnimationOptions {
  type?: 'scale' | 'rotate' | 'translate' | 'combined';
  duration?: number;
  delay?: number;
  opacityRange?: [number, number];
  scaleRange?: [number, number];
  translateRange?: { x: [number, number]; y: [number, number] };
  rotationRange?: [number, number];
}

export interface UseGradientAnimationReturn {
  scale: MotionValue<number>;
  opacity: MotionValue<number>;
  x: MotionValue<number>;
  y: MotionValue<number>;
  rotation: MotionValue<number>;
}

/**
 * Hook for animating gradient backgrounds with various animation types
 * Provides smooth, continuous animations for visual effects
 */
export function useGradientAnimation(
  options: UseGradientAnimationOptions = {}
): UseGradientAnimationReturn {
  const {
    type = 'combined',
    duration = 10,
    delay = 0,
    opacityRange = [0.4, 0.8],
    scaleRange = [1, 1.4],
    translateRange = { x: [0, 100], y: [0, 60] },
    rotationRange = [0, 360],
  } = options;

  const scale = useMotionValue(1);
  const opacity = useMotionValue(opacityRange[0]);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotation = useMotionValue(0);

  useEffect(() => {
    if (type === 'scale' || type === 'combined') {
      void animate(scale, [scaleRange[0], scaleRange[1], scaleRange[0]], {
        duration: duration,
        ease: 'easeInOut',
        repeat: Infinity,
      });
    }

    if (type === 'translate' || type === 'combined') {
      void animate(opacity, [opacityRange[0], opacityRange[1], opacityRange[0]], {
        duration: duration,
        ease: 'easeInOut',
        repeat: Infinity,
      });

      void animate(x, [translateRange.x[0], translateRange.x[1], translateRange.x[0]], {
        duration: duration,
        ease: 'easeInOut',
        repeat: Infinity,
      });

      void animate(y, [translateRange.y[0], translateRange.y[1], translateRange.y[0]], {
        duration: duration,
        ease: 'easeInOut',
        repeat: Infinity,
      });
    }

    if (type === 'rotate' || type === 'combined') {
      void animate(rotation, rotationRange[1], {
        duration: duration,
        ease: 'linear',
        repeat: Infinity,
      });
    }
  }, [
    type,
    duration,
    delay,
    opacityRange,
    scaleRange,
    translateRange,
    rotationRange,
    scale,
    opacity,
    x,
    y,
    rotation,
  ]);

  return {
    scale,
    opacity,
    x,
    y,
    rotation,
  };
}
