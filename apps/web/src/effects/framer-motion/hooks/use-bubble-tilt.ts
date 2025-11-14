'use client';

import {
  useMotionValue,
  animate,
  useTransform,
  type MotionValue,
} from 'framer-motion';
import { useCallback } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { springConfigs } from '../variants';

export interface UseBubbleTiltOptions {
  maxTilt?: number;
  damping?: number;
  stiffness?: number;
  enabled?: boolean;
  perspective?: number;
}

export interface UseBubbleTiltReturn {
  rotateX: MotionValue<number>;
  rotateY: MotionValue<number>;
  shadowDepth: MotionValue<number>;
  handleMove: (x: number, y: number, width: number, height: number) => void;
  handleLeave: () => void;
}

const DEFAULT_MAX_TILT = 8;
const DEFAULT_DAMPING = 15;
const DEFAULT_STIFFNESS = 150;
const DEFAULT_PERSPECTIVE = 1000;

export function useBubbleTilt(options: UseBubbleTiltOptions = {}): UseBubbleTiltReturn {
  const {
    maxTilt = DEFAULT_MAX_TILT,
    damping = DEFAULT_DAMPING,
    stiffness = DEFAULT_STIFFNESS,
    enabled = true,
    perspective = DEFAULT_PERSPECTIVE,
  } = options;

  const prefersReducedMotion = useReducedMotion();
  const shouldAnimate = enabled && !prefersReducedMotion;

  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const shadowDepth = useMotionValue(0);

  const handleMove = useCallback(
    (x: number, y: number, width: number, height: number) => {
      if (!shouldAnimate) {
        return;
      }

      const centerX = width / 2;
      const centerY = height / 2;

      const deltaX = x - centerX;
      const deltaY = y - centerY;

      const normalizedY = Math.max(-1, Math.min(1, deltaY / (height / 2)));
      const normalizedX = Math.max(-1, Math.min(1, deltaX / (width / 2)));
      
      const tiltX = -normalizedY * maxTilt;
      const tiltY = normalizedX * maxTilt;

      void animate(rotateX, tiltX, {
        type: 'spring',
        damping,
        stiffness,
      });
      void animate(rotateY, tiltY, {
        type: 'spring',
        damping,
        stiffness,
      });

      const tiltMagnitude = Math.sqrt(tiltX * tiltX + tiltY * tiltY);
      const normalizedMagnitude = Math.min(1, tiltMagnitude / maxTilt);
      
      void animate(shadowDepth, normalizedMagnitude, {
        type: 'spring',
        damping,
        stiffness,
      });
    },
    [shouldAnimate, maxTilt, damping, stiffness, rotateX, rotateY, shadowDepth]
  );

  const handleLeave = useCallback(() => {
    if (!shouldAnimate) {
      return;
    }
    void animate(rotateX, 0, {
      type: 'spring',
      damping,
      stiffness,
    });
    void animate(rotateY, 0, {
      type: 'spring',
      damping,
      stiffness,
    });
    void animate(shadowDepth, 0, {
      type: 'spring',
      damping,
      stiffness,
    });
  }, [shouldAnimate, damping, stiffness, rotateX, rotateY, shadowDepth]);

  return {
    rotateX,
    rotateY,
    shadowDepth,
    handleMove,
    handleLeave,
  };
}

