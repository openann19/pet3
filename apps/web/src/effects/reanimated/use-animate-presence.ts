
import { useEffect, useState, useRef } from 'react';
import { useMotionValue, animate, type MotionValue } from 'framer-motion';
import { springConfigs, timingConfigs } from '@/effects/reanimated/transitions';
import type { AnimatedStyle } from '@/effects/reanimated/animated-view';
import { useReducedMotion } from '@/hooks/useReducedMotion';


export interface UseAnimatePresenceOptions {
  isVisible: boolean;
  initial?: boolean;
  exitDuration?: number;
  enterDuration?: number;
  exitTransition?: 'fade' | 'scale' | 'slideUp' | 'slideDown' | 'slideLeft' | 'slideRight';
  enterTransition?: 'fade' | 'scale' | 'slideUp' | 'slideDown' | 'slideLeft' | 'slideRight';
  onExitComplete?: () => void;
  enabled?: boolean;
}


export interface UseAnimatePresenceReturn {
  opacity: MotionValue<number>;
  scale: MotionValue<number>;
  translateX: MotionValue<number>;
  translateY: MotionValue<number>;
  animatedStyle: AnimatedStyle;
  shouldRender: boolean;
}


export function useAnimatePresence(options: UseAnimatePresenceOptions): UseAnimatePresenceReturn {
  const prefersReducedMotion = useReducedMotion();
  const {
    isVisible,
    initial = false,
    exitDuration = timingConfigs.fast.duration ?? 150,
    enterDuration = timingConfigs.smooth.duration ?? 300,
    exitTransition = 'fade',
    enterTransition = 'fade',
    onExitComplete,
    enabled = true,
  } = options;

  const animationsEnabled = enabled && !prefersReducedMotion;

  // MotionValues for framer-motion
  const opacity = useMotionValue(initial && isVisible ? 1 : 0);
  const scale = useMotionValue(initial && isVisible ? 1 : 0.95);
  const translateX = useMotionValue(0);
  const translateY = useMotionValue(initial && isVisible ? 0 : -20);
  const [shouldRender, setShouldRender] = useState(initial && isVisible);
  const exitTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    if (!animationsEnabled) {
      setShouldRender(isVisible);
      if (isVisible) {
        opacity.set(1);
        scale.set(1);
        translateX.set(0);
        translateY.set(0);
      } else {
        opacity.set(0);
      }
      return;
    }

    if (isVisible) {
      setShouldRender(true);

      // Animate in
      switch (enterTransition) {
        case 'fade':
          animate(opacity, 1, { duration: enterDuration / 1000 });
          animate(scale, 1, { type: 'spring', ...springConfigs.smooth });
          animate(translateY, 0, { type: 'spring', ...springConfigs.smooth });
          break;
        case 'scale':
          animate(opacity, 1, { duration: enterDuration / 1000 });
          animate(scale, 1, { type: 'spring', ...springConfigs.bouncy });
          animate(translateY, 0, { type: 'spring', ...springConfigs.smooth });
          break;
        case 'slideUp':
          animate(opacity, 1, { duration: enterDuration / 1000 });
          animate(scale, 1, { type: 'spring', ...springConfigs.smooth });
          animate(translateY, 0, { type: 'spring', ...springConfigs.smooth });
          animate(translateX, 0, { type: 'spring', ...springConfigs.smooth });
          break;
        case 'slideDown':
          animate(opacity, 1, { duration: enterDuration / 1000 });
          animate(scale, 1, { type: 'spring', ...springConfigs.smooth });
          animate(translateY, 0, { type: 'spring', ...springConfigs.smooth });
          animate(translateX, 0, { type: 'spring', ...springConfigs.smooth });
          break;
        case 'slideLeft':
          animate(opacity, 1, { duration: enterDuration / 1000 });
          animate(scale, 1, { type: 'spring', ...springConfigs.smooth });
          animate(translateX, 0, { type: 'spring', ...springConfigs.smooth });
          animate(translateY, 0, { type: 'spring', ...springConfigs.smooth });
          break;
        case 'slideRight':
          animate(opacity, 1, { duration: enterDuration / 1000 });
          animate(scale, 1, { type: 'spring', ...springConfigs.smooth });
          animate(translateX, 0, { type: 'spring', ...springConfigs.smooth });
          animate(translateY, 0, { type: 'spring', ...springConfigs.smooth });
          break;
      }
    } else {
      // Animate out
      switch (exitTransition) {
        case 'fade':
          animate(opacity, 0, { duration: exitDuration / 1000 });
          animate(scale, 0.95, { duration: exitDuration / 1000 });
          break;
        case 'scale':
          animate(opacity, 0, { duration: exitDuration / 1000 });
          animate(scale, 0.8, { duration: exitDuration / 1000 });
          break;
        case 'slideUp':
          animate(opacity, 0, { duration: exitDuration / 1000 });
          animate(translateY, -20, { duration: exitDuration / 1000 });
          break;
        case 'slideDown':
          animate(opacity, 0, { duration: exitDuration / 1000 });
          animate(translateY, 20, { duration: exitDuration / 1000 });
          break;
        case 'slideLeft':
          animate(opacity, 0, { duration: exitDuration / 1000 });
          animate(translateX, -20, { duration: exitDuration / 1000 });
          break;
        case 'slideRight':
          animate(opacity, 0, { duration: exitDuration / 1000 });
          animate(translateX, 20, { duration: exitDuration / 1000 });
          break;
      }

      if (exitTimeoutRef.current) {
        clearTimeout(exitTimeoutRef.current);
      }

      exitTimeoutRef.current = setTimeout(() => {
        setShouldRender(false);
        onExitComplete?.();
      }, exitDuration);
    }

    return () => {
      if (exitTimeoutRef.current) {
        clearTimeout(exitTimeoutRef.current);
      }
    };
  }, [
    isVisible,
    animationsEnabled,
    exitDuration,
    enterDuration,
    exitTransition,
    enterTransition,
    onExitComplete,
    opacity,
    scale,
    translateX,
    translateY,
  ]);

  // Compose animated style for AnimatedView
  const animatedStyle: AnimatedStyle = {
    opacity,
    transform: [
      { scale },
      { translateX },
      { translateY },
    ],
  };

  return {
    opacity,
    scale,
    translateX,
    translateY,
    animatedStyle,
    shouldRender,
  };
}
