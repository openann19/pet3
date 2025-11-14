'use client';

import {
  useMotionValue,
  animate,
  useTransform,
  type MotionValue,
} from 'framer-motion';
import { useCallback, useMemo } from 'react';
import type { CSSProperties } from 'react';

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
  animatedStyle: CSSProperties;
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

  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const shadowDepth = useMotionValue(0);

  const handleMove = useCallback(
    (x: number, y: number, width: number, height: number) => {
      if (!enabled) {
        return;
      }

      const centerX = width / 2;
      const centerY = height / 2;

      const deltaX = x - centerX;
      const deltaY = y - centerY;

      // Calculate tilt values with clamping
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
    [enabled, maxTilt, damping, stiffness, rotateX, rotateY, shadowDepth]
  );

  const handleLeave = useCallback(() => {
    if (!enabled) {
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
  }, [enabled, damping, stiffness, rotateX, rotateY, shadowDepth]);

  // Transform shadow depth to shadow values
  const shadowBlur = useTransform(shadowDepth, [0, 1], [4, 16]);
  const shadowSpread = useTransform(shadowDepth, [0, 1], [0, 8]);
  const shadowOpacity = useTransform(shadowDepth, [0, 1], [0.2, 0.4]);

  const animatedStyle = useMemo<CSSProperties>(() => {
    if (!enabled) {
      return {
        transform: `perspective(${perspective}px) rotateX(0deg) rotateY(0deg)`,
      };
    }

    // Note: Components should use motion.div with style prop for reactive updates
    // This is a static snapshot - for reactive styles, use motion.div directly
    return {
      transform: `perspective(${perspective}px) rotateX(${rotateX.get()}deg) rotateY(${rotateY.get()}deg)`,
      boxShadow: `0 ${shadowDepth.get() * 4}px ${shadowBlur.get()}px ${shadowSpread.get()}px rgba(0, 0, 0, ${shadowOpacity.get()})`,
    };
  }, [enabled, perspective, rotateX, rotateY, shadowDepth, shadowBlur, shadowSpread, shadowOpacity]);

  return {
    rotateX,
    rotateY,
    shadowDepth,
    animatedStyle,
    handleMove,
    handleLeave,
  };
}
