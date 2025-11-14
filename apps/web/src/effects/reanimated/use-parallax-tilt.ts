'use client';

import { useMotionValue, animate, type MotionValue } from 'framer-motion';
import { useCallback } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export interface UseParallaxTiltOptions {
  maxTilt?: number;
  damping?: number;
  stiffness?: number;
  enabled?: boolean;
  perspective?: number;
}

export interface UseParallaxTiltReturn {
  rotateX: MotionValue<number>;
  rotateY: MotionValue<number>;
  perspective: number;
  handleMove: (x: number, y: number, width: number, height: number) => void;
  handleLeave: () => void;
}

const DEFAULT_MAX_TILT = 15;
const DEFAULT_DAMPING = 15;
const DEFAULT_STIFFNESS = 150;
const DEFAULT_PERSPECTIVE = 1000;

export function useParallaxTilt(options: UseParallaxTiltOptions = {}): UseParallaxTiltReturn {
  const {
    maxTilt = DEFAULT_MAX_TILT,
    damping = DEFAULT_DAMPING,
    stiffness = DEFAULT_STIFFNESS,
    enabled = true,
    perspective = DEFAULT_PERSPECTIVE,
  } = options;

  const prefersReducedMotion = useReducedMotion();
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);

  const handleMove = useCallback(
    (x: number, y: number, width: number, height: number) => {
      if (!enabled || prefersReducedMotion) return;

      const centerX = width / 2;
      const centerY = height / 2;

      const deltaX = x - centerX;
      const deltaY = y - centerY;

      // Interpolate using useTransform-like logic
      const normalizedY = Math.max(-1, Math.min(1, deltaY / (height / 2)));
      const normalizedX = Math.max(-1, Math.min(1, deltaX / (width / 2)));

      const tiltX = -normalizedY * maxTilt;
      const tiltY = normalizedX * maxTilt;

      animate(rotateX, tiltX, {
        type: 'spring',
        damping,
        stiffness,
      });
      animate(rotateY, tiltY, {
        type: 'spring',
        damping,
        stiffness,
      });
    },
    [enabled, maxTilt, damping, stiffness, rotateX, rotateY, prefersReducedMotion]
  );

  const handleLeave = useCallback(() => {
    if (!enabled) return;
    animate(rotateX, 0, {
      type: 'spring',
      damping,
      stiffness,
    });
    animate(rotateY, 0, {
      type: 'spring',
      damping,
      stiffness,
    });
  }, [enabled, damping, stiffness, rotateX, rotateY]);

  return {
    rotateX,
    rotateY,
    perspective,
    handleMove,
    handleLeave,
  };
}
