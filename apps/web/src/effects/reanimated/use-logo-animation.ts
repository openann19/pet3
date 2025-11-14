'use client';

import {
  useMotionValue,
  animate,
  type MotionValue,
} from 'framer-motion';
import { useEffect } from 'react';
import { useMotionStyle } from './use-motion-style';
import type { CSSProperties } from 'react';

export interface UseLogoAnimationReturn {
  scale: MotionValue<number>;
  style: CSSProperties;
}

export function useLogoAnimation(): UseLogoAnimationReturn {
  const scale = useMotionValue(1);

  useEffect(() => {
    void animate(scale, [1, 1.12, 1], {
      duration: 3.75, // 1250ms * 3 = 3750ms = 3.75s
      ease: 'easeInOut',
      repeat: Infinity,
      times: [0, 0.33, 0.66, 1],
    });
  }, [scale]);

  const style = useMotionStyle(() => {
    return {
      transform: [{ scale: scale.get() }],
    };
  });

  return {
    scale,
    style,
  };
}

export interface UseLogoGlowReturn {
  scale: MotionValue<number>;
  opacity: MotionValue<number>;
  style: CSSProperties;
}

export function useLogoGlow(): UseLogoGlowReturn {
  const scale = useMotionValue(1);
  const opacity = useMotionValue(0.7);

  useEffect(() => {
    void animate(scale, [1, 1.5, 1], {
      duration: 3, // 1000ms * 3 = 3000ms = 3s
      ease: 'easeInOut',
      repeat: Infinity,
      times: [0, 0.33, 0.66, 1],
    });

    void animate(opacity, [0.7, 1, 0.7], {
      duration: 3,
      ease: 'easeInOut',
      repeat: Infinity,
      times: [0, 0.33, 0.66, 1],
    });
  }, [scale, opacity]);

  const style = useMotionStyle(() => {
    return {
      transform: [{ scale: scale.get() }],
      opacity: opacity.get(),
    };
  });

  return {
    scale,
    opacity,
    style,
  };
}
