/**
 * 3D Flip Card Animation
 * Realistic card flip with perspective and backface visibility
 * Migrated to pure Framer Motion
 */

import { useMotionValue, useTransform, animate, type MotionValue } from 'framer-motion';
import { useCallback, useState } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export interface Use3DFlipCardOptions {
  duration?: number;
  perspective?: number;
  damping?: number;
  stiffness?: number;
}

export interface Use3DFlipCardReturn {
  rotateY: MotionValue<number>;
  frontOpacity: MotionValue<number>;
  backOpacity: MotionValue<number>;
  backRotateY: MotionValue<number>;
  perspective: number;
  flip: () => void;
  isFlipped: boolean;
}

export function use3DFlipCard(options: Use3DFlipCardOptions = {}): Use3DFlipCardReturn {
  const { perspective = 1200, damping = 20, stiffness = 100 } = options;

  const prefersReducedMotion = useReducedMotion();
  const rotateY = useMotionValue(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const flip = useCallback(() => {
    const targetRotation = isFlipped ? 0 : 180;
    setIsFlipped(!isFlipped);

    if (!prefersReducedMotion) {
      animate(rotateY, targetRotation, {
        type: 'spring',
        damping,
        stiffness,
      });
    } else {
      rotateY.set(targetRotation);
    }
  }, [isFlipped, damping, stiffness, rotateY, prefersReducedMotion]);

  // Front face opacity: 1 at 0°, 0 at 90° and 180°
  const frontOpacity = useTransform(rotateY, [0, 90, 180], [1, 0, 0]);

  // Back face opacity: 0 at 0° and 90°, 1 at 180°
  const backOpacity = useTransform(rotateY, [0, 90, 180], [0, 0, 1]);

  // Back face rotation: front rotation + 180°
  const backRotateY = useTransform(rotateY, (value) => value + 180);

  return {
    rotateY,
    frontOpacity,
    backOpacity,
    backRotateY,
    perspective,
    flip,
    isFlipped,
  };
}
