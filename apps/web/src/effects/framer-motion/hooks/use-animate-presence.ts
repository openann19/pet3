'use client';

import { useMotionValue, animate, type MotionValue, type Variants } from 'framer-motion';
import { useEffect, useState, useRef } from 'react';

export interface UseAnimatePresenceOptions {
  isVisible: boolean;
  initial?: boolean;
  exitDuration?: number;
  enterDuration?: number;
  exitTransition?: 'fade' | 'scale' | 'slideUp' | 'slideDown';
  enterTransition?: 'fade' | 'scale' | 'slideUp' | 'slideDown';
  onExitComplete?: () => void;
  enabled?: boolean;
}

export interface UseAnimatePresenceReturn {
  opacity: MotionValue<number>;
  scale: MotionValue<number>;
  translateX: MotionValue<number>;
  translateY: MotionValue<number>;
  animatedStyle: {
    opacity: MotionValue<number>;
    scale: MotionValue<number>;
    x: MotionValue<number>;
    y: MotionValue<number>;
  };
  shouldRender: boolean;
  variants: Variants;
}

/**
 * Framer Motion hook for presence animations
 * Provides consistent enter/exit animations with shouldRender control
 */
export function useAnimatePresence(options: UseAnimatePresenceOptions): UseAnimatePresenceReturn {
  const {
    isVisible,
    initial = false,
    exitDuration = 150,
    enterDuration = 300,
    exitTransition = 'fade',
    enterTransition = 'fade',
    onExitComplete,
    enabled = true,
  } = options;

  const opacity = useMotionValue(initial && isVisible ? 1 : 0);
  const scale = useMotionValue(initial && isVisible ? 1 : 0.95);
  const translateX = useMotionValue(0);
  const translateY = useMotionValue(initial && isVisible ? 0 : -20);
  const [shouldRender, setShouldRender] = useState(initial && isVisible);
  const exitTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    if (!enabled) {
      setShouldRender(isVisible);
      return undefined;
    }

    if (isVisible) {
      setShouldRender(true);

      const enterDurationSeconds = enterDuration / 1000;

      // Enter animations based on transition type
      switch (enterTransition) {
        case 'scale':
          void animate(opacity, 1, { duration: enterDurationSeconds, ease: 'easeOut' });
          void animate(scale, 1, { type: 'spring', damping: 20, stiffness: 300 });
          break;
        case 'slideUp':
          void animate(opacity, 1, { duration: enterDurationSeconds, ease: 'easeOut' });
          void animate(translateY, 0, { type: 'spring', damping: 20, stiffness: 300 });
          break;
        case 'slideDown':
          void animate(opacity, 1, { duration: enterDurationSeconds, ease: 'easeOut' });
          translateY.set(20);
          void animate(translateY, 0, { type: 'spring', damping: 20, stiffness: 300 });
          break;
        case 'fade':
        default:
          void animate(opacity, 1, { duration: enterDurationSeconds, ease: 'easeOut' });
          void animate(scale, 1, { duration: enterDurationSeconds, ease: 'easeOut' });
          break;
      }
    } else {
      const exitDurationSeconds = exitDuration / 1000;

      // Exit animations based on transition type
      switch (exitTransition) {
        case 'scale':
          void animate(opacity, 0, { duration: exitDurationSeconds, ease: 'easeIn' });
          void animate(scale, 0.8, { duration: exitDurationSeconds, ease: 'easeIn' });
          break;
        case 'slideUp':
          void animate(opacity, 0, { duration: exitDurationSeconds, ease: 'easeIn' });
          void animate(translateY, -20, { duration: exitDurationSeconds, ease: 'easeIn' });
          break;
        case 'slideDown':
          void animate(opacity, 0, { duration: exitDurationSeconds, ease: 'easeIn' });
          void animate(translateY, 20, { duration: exitDurationSeconds, ease: 'easeIn' });
          break;
        case 'fade':
        default:
          void animate(opacity, 0, { duration: exitDurationSeconds, ease: 'easeIn' });
          void animate(scale, 0.95, { duration: exitDurationSeconds, ease: 'easeIn' });
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
  }, [isVisible, enabled, exitDuration, enterDuration, exitTransition, enterTransition, onExitComplete, opacity, scale, translateX, translateY]);

  const variants: Variants = {
    initial: {
      opacity: 0,
      scale: 0.95,
    },
    animate: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: enterDuration / 1000,
        ease: 'easeOut',
      },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      transition: {
        duration: exitDuration / 1000,
        ease: 'easeIn',
      },
    },
  };

  return {
    opacity,
    scale,
    translateX,
    translateY,
    animatedStyle: {
      opacity,
      scale,
      x: translateX,
      y: translateY,
    },
    shouldRender,
    variants,
  };
}
