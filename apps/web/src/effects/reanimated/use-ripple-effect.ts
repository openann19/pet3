/**
 * Ripple Effect Hook
 * Material-style ripple effect with smooth spring animations
 */

import { useMotionValue, animate, type MotionValue } from 'framer-motion';
import { useState, useCallback } from 'react';
import type { CSSProperties } from 'react';

export interface UseRippleEffectOptions {
  duration?: number;
  color?: string;
  opacity?: number;
}

export interface RippleState {
  x: number;
  y: number;
  id: number;
}

export function useRippleEffect(options: UseRippleEffectOptions = {}) {
  const { duration = 600, color = 'rgba(255, 255, 255, 0.5)', opacity = 0.5 } = options;

  const [ripples, setRipples] = useState<RippleState[]>([]);

  const addRipple = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      const rect = event.currentTarget.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const id = Date.now();

      setRipples((prev) => [...prev, { x, y, id }]);

      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== id));
      }, duration);
    },
    [duration]
  );

  return {
    ripples,
    addRipple,
    color,
  };
}
