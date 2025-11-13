/**
 * Framer Motion Transform Hook
 * 
 * Migration helper to replace useAnimatedStyle from @petspark/motion
 * with native Framer Motion useTransform
 * 
 * This provides utilities to create reactive style transforms
 * from MotionValues.
 */

'use client';

import { useTransform, type MotionValue } from 'framer-motion';
import { useMemo } from 'react';
import type { CSSProperties } from 'react';

/**
 * Transform a MotionValue to a CSS transform scale value
 */
export function useScaleTransform(
  motionValue: MotionValue<number>
): MotionValue<number> {
  return useTransform(motionValue, (value) => value);
}

/**
 * Transform a MotionValue to a CSS opacity value
 */
export function useOpacityTransform(
  motionValue: MotionValue<number>
): MotionValue<number> {
  return useTransform(motionValue, (value) => Math.max(0, Math.min(1, value)));
}

/**
 * Create a transform style object from scale and opacity MotionValues
 * 
 * @example
 * ```tsx
 * const scale = useFramerMotionValue(1);
 * const opacity = useFramerMotionValue(1);
 * 
 * const transformStyle = useTransformStyle({ scale, opacity });
 * 
 * <motion.div style={transformStyle} />
 * ```
 */
export function useTransformStyle({
  scale,
  opacity,
  x,
  y,
  rotate,
}: {
  scale?: MotionValue<number>;
  opacity?: MotionValue<number>;
  x?: MotionValue<number>;
  y?: MotionValue<number>;
  rotate?: MotionValue<number>;
}): CSSProperties {
  // Note: Framer Motion handles these directly via style props
  // This is a compatibility helper for migration
  return useMemo(() => {
    const style: CSSProperties = {};
    
    if (scale) {
      style.scale = scale.get();
    }
    if (opacity) {
      style.opacity = opacity.get();
    }
    if (x !== undefined) {
      style.x = x.get();
    }
    if (y !== undefined) {
      style.y = y.get();
    }
    if (rotate) {
      style.rotate = rotate.get();
    }
    
    return style;
  }, [scale, opacity, x, y, rotate]);
}

/**
 * Interpolate a value from one range to another
 * (Replacement for interpolate from @petspark/motion)
 * 
 * @param value - Input MotionValue
 * @param inputRange - Input range [min, max]
 * @param outputRange - Output range [min, max]
 * @param options - Clamp options
 */
export function useInterpolate(
  value: MotionValue<number>,
  inputRange: [number, number],
  outputRange: [number, number],
  options?: {
    extrapolateLeft?: 'clamp' | 'extend';
    extrapolateRight?: 'clamp' | 'extend';
  }
): MotionValue<number> {
  return useTransform(
    value,
    inputRange,
    outputRange,
    {
      clamp: options?.extrapolateLeft === 'clamp' || options?.extrapolateRight === 'clamp',
    }
  );
}

