/**
 * Magnetic Hover Effect
 * Elements follow cursor with smooth spring physics and magnetic attraction
 */

import { useMotionValue, animate, type MotionValue } from 'framer-motion';
import { useState, useCallback } from 'react';
import { isTruthy } from '@/core/guards';
import type { CSSProperties } from 'react';

export interface UseMagneticHoverOptions {
  strength?: number;
  damping?: number;
  stiffness?: number;
  maxDistance?: number;
  enabled?: boolean;
}

export function useMagneticHover(options: UseMagneticHoverOptions = {}) {
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

  const handleMouseEnter = useCallback(() => {
    if (!enabled) return;
    animate(scale, 1.05, {
      type: 'spring',
      damping,
      stiffness,
    });
  }, [enabled, damping, stiffness, scale]);

  const handleMouseLeave = useCallback(() => {
    if (!enabled) return;
    animate(translateX, 0, {
      type: 'spring',
      damping,
      stiffness,
    });
    animate(translateY, 0, {
      type: 'spring',
      damping,
      stiffness,
    });
    animate(scale, 1, {
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

        animate(translateX, normalizedX, {
          type: 'spring',
          damping,
          stiffness,
        });
        animate(translateY, normalizedY, {
          type: 'spring',
          damping,
          stiffness,
        });
      }
    },
    [enabled, elementRect, strength, maxDistance, damping, stiffness]
  );

  const handleRef = useCallback((element: HTMLElement | null) => {
    if (isTruthy(element)) {
      setElementRect(element.getBoundingClientRect());
    }
  }, []);

  return {
    animatedStyle: {
      x: translateX,
      y: translateY,
      scale,
    },
    translateX,
    translateY,
    scale,
    handleMouseEnter,
    handleMouseLeave,
    handleMouseMove,
    handleRef,
  };
}
