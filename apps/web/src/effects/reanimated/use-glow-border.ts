/**
 * Animated Glow Border
 * Pulsating glow effect with customizable colors and intensity
 * Migrated to pure Framer Motion
 */

import { useMotionValue, useTransform, animate, type MotionValue } from 'framer-motion';
import { useEffect } from 'react';
import { isTruthy } from '@/core/guards';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export interface UseGlowBorderOptions {
  color?: string;
  intensity?: number;
  speed?: number;
  enabled?: boolean;
  pulseSize?: number;
}

export interface UseGlowBorderReturn {
  glowIntensity: MotionValue<number>;
  shadowOpacity: MotionValue<number>;
  boxShadow: MotionValue<string>;
  filter: MotionValue<string>;
  opacity: MotionValue<number>;
}

export function useGlowBorder(options: UseGlowBorderOptions = {}): UseGlowBorderReturn {
  const {
    color = 'rgba(99, 102, 241, 0.8)',
    intensity = 20,
    speed = 2000,
    enabled = true,
    pulseSize = 8,
  } = options;

  const prefersReducedMotion = useReducedMotion();
  const progress = useMotionValue(0);

  useEffect(() => {
    if (isTruthy(enabled) && !prefersReducedMotion) {
      // Convert speed from ms to seconds
      const duration = speed / 1000;

      // Create repeating animation: 0 -> 1 -> 0
      const animation = animate(progress, [0, 1, 0], {
        duration,
        repeat: Infinity,
        ease: [0.42, 0, 0.58, 1], // ease-in-out
      });

      return () => {
        animation.stop();
      };
    } else {
      progress.set(0);
    }
  }, [enabled, speed, prefersReducedMotion, progress]);

  // Transform progress to glow intensity (0 -> intensity -> 0)
  const glowIntensity = useTransform(progress, [0, 0.5, 1], [0, intensity, 0]);

  // Transform progress to shadow opacity (0.3 -> 0.8 -> 0.3)
  const shadowOpacity = useTransform(progress, [0, 0.5, 1], [0.3, 0.8, 0.3]);

  // Create boxShadow string with motion values
  const boxShadow = useTransform(
    glowIntensity,
    (intensityValue) =>
      `0 0 ${intensityValue}px ${pulseSize}px ${color}, 0 0 ${intensityValue * 0.5}px ${pulseSize * 0.5}px ${color} inset`
  );

  // Create filter string with motion values
  const filter = useTransform(
    glowIntensity,
    (intensityValue) => `drop-shadow(0 0 ${intensityValue * 0.5}px ${color})`
  );

  return {
    glowIntensity,
    shadowOpacity,
    boxShadow,
    filter,
    opacity: shadowOpacity,
  };
}
