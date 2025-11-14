'use client';

import { useMotionValue, animate, type MotionValue, type Variants } from 'framer-motion';
import { useState, useCallback } from 'react';

export interface UseMagneticHoverOptions {
  strength?: number;
  damping?: number;
  stiffness?: number;
  maxDistance?: number;
  enabled?: boolean;
}

export interface UseMagneticHoverReturn {
  variants: Variants;
  translateX: MotionValue<number>;
  translateY: MotionValue<number>;
  scale: MotionValue<number>;
  handleMouseEnter: (event: React.MouseEvent<HTMLElement>) => void;
  handleMouseLeave: () => void;
  handleMouseMove: (event: React.MouseEvent<HTMLElement>) => void;
}

/**
 * Framer Motion hook for magnetic hover effects
 * Elements follow cursor with smooth spring physics
 */
export function useMagneticHover(options: UseMagneticHoverOptions = {}): UseMagneticHoverReturn {
  const {
    strength = 0.3,
    damping = 20,
    stiffness = 150,
    maxDistance = 50,
    enabled = true,
  } = options;

  const translateX = useMotionValue(0);
  const translateY = useMotionValue(0);
  const scale = useMotionValue(1);
  const [elementRect, setElementRect] = useState<DOMRect | null>(null);

  const variants: Variants = {
    rest: {
      x: 0,
      y: 0,
      scale: 1,
      transition: {
        type: 'spring',
        damping,
        stiffness,
      },
    },
    hover: {
      scale: 1.05,
      transition: {
        type: 'spring',
        damping,
        stiffness,
      },
    },
  };

  const handleMouseEnter = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      if (!enabled) return;
      setElementRect(event.currentTarget.getBoundingClientRect());
      void animate(scale, 1.05, {
        type: 'spring',
        damping,
        stiffness,
      });
    },
    [enabled, damping, stiffness, scale]
  );

  const handleMouseLeave = useCallback(() => {
    if (!enabled) return;
    void animate(translateX, 0, {
      type: 'spring',
      damping,
      stiffness,
    });
    void animate(translateY, 0, {
      type: 'spring',
      damping,
      stiffness,
    });
    void animate(scale, 1, {
      type: 'spring',
      damping,
      stiffness,
    });
  }, [enabled, damping, stiffness, translateX, translateY, scale]);

  const handleMouseMove = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      if (!enabled || !elementRect) return;

      const centerX = elementRect.left + elementRect.width / 2;
      const centerY = elementRect.top + elementRect.height / 2;

      const deltaX = event.clientX - centerX;
      const deltaY = event.clientY - centerY;

      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const maxDist = elementRect.width / 2;

      if (distance < maxDist) {
        const normalizedX = Math.max(-maxDistance, Math.min(maxDistance, deltaX * strength));
        const normalizedY = Math.max(-maxDistance, Math.min(maxDistance, deltaY * strength));

        void animate(translateX, normalizedX, {
          type: 'spring',
          damping,
          stiffness,
        });
        void animate(translateY, normalizedY, {
          type: 'spring',
          damping,
          stiffness,
        });
      }
    },
    [enabled, elementRect, strength, maxDistance, damping, stiffness, translateX, translateY]
  );

  return {
    variants,
    translateX,
    translateY,
    scale,
    handleMouseEnter,
    handleMouseLeave,
    handleMouseMove,
  };
}
