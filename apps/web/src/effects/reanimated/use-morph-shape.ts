/**
 * Morph Shape Animation
 * Smooth morphing between shapes with border-radius interpolation
 */

import {
  useMotionValue,
  animate,
  useTransform,
  type MotionValue,
} from 'framer-motion';
import { useCallback } from 'react';
import { useMotionStyle } from './use-motion-style';
import type { CSSProperties } from 'react';

export interface UseMorphShapeOptions {
  duration?: number;
  shapes?: {
    borderRadius: number[];
    scale?: number;
    rotate?: number;
  }[];
}

export interface UseMorphShapeReturn {
  animatedStyle: CSSProperties;
  morphTo: (shapeIndex: number) => void;
  cycleShape: () => void;
  currentShape: number;
}

export function useMorphShape(options: UseMorphShapeOptions = {}): UseMorphShapeReturn {
  const {
    duration = 400,
    shapes = [
      { borderRadius: [8, 8, 8, 8], scale: 1, rotate: 0 },
      { borderRadius: [24, 8, 24, 8], scale: 1.05, rotate: 5 },
      { borderRadius: [50, 50, 50, 50], scale: 1, rotate: 0 },
    ],
  } = options;

  const progress = useMotionValue(0);
  const currentShape = useMotionValue(0);

  const morphTo = useCallback(
    (shapeIndex: number) => {
      if (shapeIndex < 0 || shapeIndex >= shapes.length) return;

      currentShape.set(shapeIndex);
      void animate(progress, shapeIndex, {
        duration: duration / 1000,
        ease: [0.4, 0, 0.2, 1], // cubic-bezier equivalent
      });
    },
    [shapes.length, duration, progress, currentShape]
  );

  const cycleShape = useCallback(() => {
    const nextShape = (Math.floor(currentShape.get()) + 1) % shapes.length;
    morphTo(nextShape);
  }, [shapes.length, morphTo, currentShape]);

  // Create transforms for each border radius corner
  const topLeft = useTransform(progress, (value) => {
    const shapeIndex = Math.floor(value);
    const nextShapeIndex = Math.min(shapeIndex + 1, shapes.length - 1);
    const interpolationProgress = value - shapeIndex;
    const currentShapeData = shapes[shapeIndex];
    const nextShapeData = shapes[nextShapeIndex];
    if (!currentShapeData || !nextShapeData) return 8;
    return (
      (currentShapeData.borderRadius[0] ?? 8) * (1 - interpolationProgress) +
      (nextShapeData.borderRadius[0] ?? 8) * interpolationProgress
    );
  });

  const topRight = useTransform(progress, (value) => {
    const shapeIndex = Math.floor(value);
    const nextShapeIndex = Math.min(shapeIndex + 1, shapes.length - 1);
    const interpolationProgress = value - shapeIndex;
    const currentShapeData = shapes[shapeIndex];
    const nextShapeData = shapes[nextShapeIndex];
    if (!currentShapeData || !nextShapeData) return 8;
    return (
      (currentShapeData.borderRadius[1] ?? 8) * (1 - interpolationProgress) +
      (nextShapeData.borderRadius[1] ?? 8) * interpolationProgress
    );
  });

  const bottomRight = useTransform(progress, (value) => {
    const shapeIndex = Math.floor(value);
    const nextShapeIndex = Math.min(shapeIndex + 1, shapes.length - 1);
    const interpolationProgress = value - shapeIndex;
    const currentShapeData = shapes[shapeIndex];
    const nextShapeData = shapes[nextShapeIndex];
    if (!currentShapeData || !nextShapeData) return 8;
    return (
      (currentShapeData.borderRadius[2] ?? 8) * (1 - interpolationProgress) +
      (nextShapeData.borderRadius[2] ?? 8) * interpolationProgress
    );
  });

  const bottomLeft = useTransform(progress, (value) => {
    const shapeIndex = Math.floor(value);
    const nextShapeIndex = Math.min(shapeIndex + 1, shapes.length - 1);
    const interpolationProgress = value - shapeIndex;
    const currentShapeData = shapes[shapeIndex];
    const nextShapeData = shapes[nextShapeIndex];
    if (!currentShapeData || !nextShapeData) return 8;
    return (
      (currentShapeData.borderRadius[3] ?? 8) * (1 - interpolationProgress) +
      (nextShapeData.borderRadius[3] ?? 8) * interpolationProgress
    );
  });

  const scale = useTransform(progress, (value) => {
    const shapeIndex = Math.floor(value);
    const nextShapeIndex = Math.min(shapeIndex + 1, shapes.length - 1);
    const interpolationProgress = value - shapeIndex;
    const currentShapeData = shapes[shapeIndex];
    const nextShapeData = shapes[nextShapeIndex];
    if (!currentShapeData || !nextShapeData) return 1;
    return (
      (currentShapeData.scale ?? 1) * (1 - interpolationProgress) +
      (nextShapeData.scale ?? 1) * interpolationProgress
    );
  });

  const rotate = useTransform(progress, (value) => {
    const shapeIndex = Math.floor(value);
    const nextShapeIndex = Math.min(shapeIndex + 1, shapes.length - 1);
    const interpolationProgress = value - shapeIndex;
    const currentShapeData = shapes[shapeIndex];
    const nextShapeData = shapes[nextShapeIndex];
    if (!currentShapeData || !nextShapeData) return 0;
    return (
      (currentShapeData.rotate ?? 0) * (1 - interpolationProgress) +
      (nextShapeData.rotate ?? 0) * interpolationProgress
    );
  });

  const animatedStyle = useMotionStyle(() => {
    return {
      borderTopLeftRadius: topLeft.get(),
      borderTopRightRadius: topRight.get(),
      borderBottomRightRadius: bottomRight.get(),
      borderBottomLeftRadius: bottomLeft.get(),
      transform: [
        { scale: scale.get() },
        { rotate: `${rotate.get()}deg` },
      ],
    };
  });

  return {
    animatedStyle,
    morphTo,
    cycleShape,
    currentShape: Math.floor(currentShape.get()),
  };
}
