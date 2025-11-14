'use client';

import { useMotionValue, animate, type MotionValue } from 'framer-motion';
import { useEffect, useState, useCallback } from 'react';
import { timingConfigs } from '@/effects/reanimated/transitions';
import { springConfigs } from '@/effects/framer-motion/variants';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export interface UseThreadLayoutAnimatorOptions {
  isExpanded?: boolean;
  enabled?: boolean;
  staggerDelay?: number;
}

export interface UseThreadLayoutAnimatorReturn {
  height: MotionValue<number>;
  opacity: MotionValue<number>;
  translateY: MotionValue<number>;
  containerStyle: {
    opacity: MotionValue<number>;
    y: MotionValue<number>;
    overflow: 'hidden';
  };
  messageStyle: (index: number) => {
    opacity: MotionValue<number>;
    y: MotionValue<number>;
  };
  expand: () => void;
  collapse: () => void;
}

const DEFAULT_ENABLED = true;
const DEFAULT_STAGGER_DELAY = 50;

export function useThreadLayoutAnimator(
  options: UseThreadLayoutAnimatorOptions = {}
): UseThreadLayoutAnimatorReturn {
  const {
    isExpanded = false,
    enabled = DEFAULT_ENABLED,
    staggerDelay = DEFAULT_STAGGER_DELAY,
  } = options;

  const prefersReducedMotion = useReducedMotion();
  const fastDuration = prefersReducedMotion ? 0 : (timingConfigs.fast.duration ?? 0.15);
  const smoothDuration = prefersReducedMotion ? 0 : (timingConfigs.smooth.duration ?? 0.3);

  const height = useMotionValue(0);
  const opacity = useMotionValue(0);
  const translateY = useMotionValue(-20);
  const fallbackOpacity = useMotionValue(0);
  const fallbackY = useMotionValue(-10);
  const [messageOpacities] = useState(() => Array.from({ length: 10 }, () => useMotionValue(0)));
  const [messageTranslateYs] = useState(() =>
    Array.from({ length: 10 }, () => useMotionValue(-10))
  );

  useEffect(() => {
    if (!enabled) {
      return;
    }

    if (isExpanded) {
      animate(height, 1, { ...springConfigs.smooth, duration: smoothDuration });
      animate(opacity, 1, { duration: smoothDuration });
      animate(translateY, 0, { ...springConfigs.smooth, duration: smoothDuration });

      messageOpacities.forEach((opacityVal, index) => {
        setTimeout(() => {
          animate(opacityVal, 1, { duration: smoothDuration });
        }, index * staggerDelay);
      });

      messageTranslateYs.forEach((translateYVal, index) => {
        setTimeout(() => {
          animate(translateYVal, 0, { ...springConfigs.smooth, duration: smoothDuration });
        }, index * staggerDelay);
      });
    } else {
      animate(height, 0, { duration: fastDuration });
      animate(opacity, 0, { duration: fastDuration });
      animate(translateY, -20, { duration: fastDuration });

      messageOpacities.forEach((opacityVal) => {
        animate(opacityVal, 0, { duration: fastDuration });
      });

      messageTranslateYs.forEach((translateYVal) => {
        animate(translateYVal, -10, { duration: fastDuration });
      });
    }
  }, [
    isExpanded,
    enabled,
    staggerDelay,
    height,
    opacity,
    translateY,
    messageOpacities,
    messageTranslateYs,
    fastDuration,
    smoothDuration,
  ]);

  const expand = useCallback(() => {
    animate(height, 1, { ...springConfigs.smooth, duration: smoothDuration });
    animate(opacity, 1, { duration: smoothDuration });
    animate(translateY, 0, { ...springConfigs.smooth, duration: smoothDuration });
  }, [height, opacity, translateY, smoothDuration]);

  const collapse = useCallback(() => {
    animate(height, 0, { duration: fastDuration });
    animate(opacity, 0, { duration: fastDuration });
    animate(translateY, -20, { duration: fastDuration });
  }, [height, opacity, translateY, fastDuration]);

  const containerStyle = {
    opacity,
    y: translateY,
    overflow: 'hidden' as const,
  };

  const messageStyle = useCallback((index: number) => {
    const opacityVal = messageOpacities[index];
    const translateYVal = messageTranslateYs[index];
    return {
      opacity: opacityVal ?? fallbackOpacity,
      y: translateYVal ?? fallbackY,
    };
  }, [messageOpacities, messageTranslateYs, fallbackOpacity, fallbackY]);

  return {
    height,
    opacity,
    translateY,
    containerStyle,
    messageStyle,
    expand,
    collapse,
  };
}
