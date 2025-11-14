/**
 * Wave Animation (Web Adapter)
 * Migrated to pure Framer Motion
 */

import { useMotionValue, useTransform, animate, type MotionValue } from 'framer-motion';
import { useEffect } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export interface UseWaveAnimationOptions {
  amplitude?: number;
  frequency?: number;
  speed?: number;
  direction?: 'horizontal' | 'vertical';
  enabled?: boolean;
}

export interface UseWaveAnimationReturn {
  translateX: MotionValue<number> | undefined;
  translateY: MotionValue<number> | undefined;
  progress: MotionValue<number>;
  animatedStyle: {
    x?: MotionValue<number>;
    y?: MotionValue<number>;
  };
}

export function useWaveAnimation(options: UseWaveAnimationOptions = {}): UseWaveAnimationReturn {
  const {
    amplitude = 20,
    frequency = 2,
    speed = 3000,
    direction = 'horizontal',
    enabled = true,
  } = options;

  const prefersReducedMotion = useReducedMotion();
  const progress = useMotionValue(0);

  useEffect(() => {
    if (enabled && !prefersReducedMotion) {
      // Convert speed from ms to seconds
      const duration = speed / 1000;

      const animation = animate(progress, [0, 1], {
        duration,
        repeat: Infinity,
        ease: 'linear',
      });

      return () => {
        animation.stop();
      };
    }
    progress.set(0);
    return undefined;
  }, [enabled, speed, prefersReducedMotion, progress]);

  // Calculate wave value using useTransform
  const waveValue = useTransform(progress, (value) => {
    const phase = value * Math.PI * 2 * frequency;
    return Math.sin(phase) * amplitude;
  });

  // Return appropriate motion values based on direction
  const translateX = direction === 'horizontal' ? waveValue : undefined;
  const translateY = direction === 'vertical' ? waveValue : undefined;

  return {
    translateX,
    translateY,
    progress,
    animatedStyle: {
      x: translateX,
      y: translateY,
    },
  };
}

export interface UseMultiWaveReturn {
  createWaveMotionValues: (waveIndex: number, amplitude?: number) => {
    translateX: MotionValue<number>;
    translateY: MotionValue<number>;
    opacity: MotionValue<number>;
  };
  progress: MotionValue<number>;
}

export function useMultiWave(waveCount = 3): UseMultiWaveReturn {
  const prefersReducedMotion = useReducedMotion();
  const progress = useMotionValue(0);

  useEffect(() => {
    if (!prefersReducedMotion) {
      const animation = animate(progress, [0, 1], {
        duration: 4, // 4 seconds
        repeat: Infinity,
        ease: 'linear',
      });

      return () => {
        animation.stop();
      };
    }
    progress.set(0);
    return undefined;
  }, [prefersReducedMotion, progress]);

  const createWaveMotionValues = (waveIndex: number, amplitude = 15) => {
    const phaseOffset = (waveIndex * Math.PI * 2) / waveCount;

    // Calculate wave translation
    const translateY = useTransform(progress, (value) => {
      const phase = value * Math.PI * 2 + phaseOffset;
      return Math.sin(phase) * amplitude;
    });

    const translateX = useTransform(translateY, (y) => y * 0.5);

    // Calculate opacity
    const opacity = useTransform(progress, [0, 0.5, 1], [0.3, 0.6, 0.3]);

    return {
      translateX,
      translateY,
      opacity,
    };
  };

  return {
    createWaveMotionValues,
    progress,
  };
}
