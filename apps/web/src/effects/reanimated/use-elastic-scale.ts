/**
 * Elastic Scale Animation
 * Bouncy, elastic scale effect with overshoot for delightful interactions
 */

import { useMotionValue, animate, type MotionValue } from 'framer-motion';
import { useCallback } from 'react';

export interface UseElasticScaleOptions {
  scaleUp?: number;
  scaleDown?: number;
  damping?: number;
  stiffness?: number;
  mass?: number;
}

export function useElasticScale(options: UseElasticScaleOptions = {}) {
  const { scaleUp = 1.15, scaleDown = 0.95, damping = 12, stiffness = 200, mass = 0.8 } = options;

  const scale = useMotionValue(1);

  const handlePressIn = useCallback(() => {
    animate(scale, scaleDown, {
      type: 'spring',
      damping,
      stiffness: stiffness * 1.5,
      mass: mass * 0.8,
    });
  }, [scaleDown, damping, stiffness, mass, scale]);

  const handlePressOut = useCallback(() => {
    animate(scale, [scaleUp, 1], {
      type: 'spring',
      damping: damping * 0.6,
      stiffness: stiffness * 1.2,
      mass,
      times: [0, 1],
    });
  }, [scaleUp, damping, stiffness, mass, scale]);

  return {
    animatedStyle: { scale },
    scale,
    handlePressIn,
    handlePressOut,
  };
}
