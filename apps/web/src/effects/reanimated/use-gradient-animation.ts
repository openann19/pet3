'use client';

import {
  useMotionValue,
  animate,
  type MotionValue,
} from 'framer-motion';
import { useEffect } from 'react';
import { useMotionStyle } from './use-motion-style';
import type { CSSProperties } from 'react';

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
  style: CSSProperties;
}

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
        times: [0, 0.33, 0.66, 1],
      });
    }

    if (type === 'translate' || type === 'combined') {
      void animate(opacity, [opacityRange[0], opacityRange[1], opacityRange[0]], {
        duration: duration,
        ease: 'easeInOut',
        repeat: Infinity,
        times: [0, 0.33, 0.66, 1],
      });

      void animate(x, [translateRange.x[0], translateRange.x[1], translateRange.x[0]], {
        duration: duration,
        ease: 'easeInOut',
        repeat: Infinity,
        times: [0, 0.33, 0.66, 1],
      });

      void animate(y, [translateRange.y[0], translateRange.y[1], translateRange.y[0]], {
        duration: duration,
        ease: 'easeInOut',
        repeat: Infinity,
        times: [0, 0.33, 0.66, 1],
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

  const style = useMotionStyle(() => {
    const transforms: Array<Record<string, number | string>> = [];

    if (type === 'scale' || type === 'combined') {
      transforms.push({ scale: scale.get() });
    }

    if (type === 'translate' || type === 'combined') {
      transforms.push({ translateX: x.get() });
      transforms.push({ translateY: y.get() });
    }

    if (type === 'rotate' || type === 'combined') {
      transforms.push({ rotate: `${rotation.get()}deg` });
    }

    return {
      transform: transforms,
      opacity: opacity.get(),
    };
  });

  return {
    scale,
    opacity,
    x,
    y,
    rotation,
    style,
  };
}
