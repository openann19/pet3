'use client';

import { useState, useCallback } from 'react';

export interface UseRippleEffectOptions {
  duration?: number;
  color?: string;
  opacity?: number;
}

export interface RippleState {
  x: number;
  y: number;
  size: number;
  id: number;
}

export interface UseRippleEffectReturn {
  ripples: RippleState[];
  addRipple: (event: React.MouseEvent<HTMLElement>) => void;
  clearRipples: () => void;
  color: string;
  animatedStyle: {
    color: string;
    opacity: number;
  };
}

/**
 * Framer Motion hook for Material-style ripple effects
 * Creates expanding circle ripples on click
 */
export function useRippleEffect(options: UseRippleEffectOptions = {}): UseRippleEffectReturn {
  const { duration = 600, color = 'rgba(255, 255, 255, 0.5)', opacity = 0.5 } = options;

  const [ripples, setRipples] = useState<RippleState[]>([]);

  const addRipple = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      const rect = event.currentTarget.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const size = Math.max(rect.width, rect.height) * 2;
      const id = Date.now();

      setRipples((prev) => [...prev, { x, y, size, id }]);

      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== id));
      }, duration);
    },
    [duration]
  );

  const clearRipples = useCallback(() => {
    setRipples([]);
  }, []);

  return {
    ripples,
    addRipple,
    clearRipples,
    color,
    animatedStyle: { color, opacity },
  };
}
