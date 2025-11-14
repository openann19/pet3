'use client';

import { useEffect, useState, useRef } from 'react';
import {
  useMotionValue,
  animate,
  type MotionValue,
} from 'framer-motion';
import { springConfigs, timingConfigs } from '@/effects/reanimated/transitions';

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
  animatedStyle: {
    opacity: MotionValue<number>;
    scale: MotionValue<number>;
    x: MotionValue<number>;
    y: MotionValue<number>;
  };
  shouldRender: boolean;
}

export function useAnimatePresence(options: UseAnimatePresenceOptions): UseAnimatePresenceReturn {
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

  const opacity = useMotionValue(initial && isVisible ? 1 : 0);
  const scale = useMotionValue(initial && isVisible ? 1 : 0.95);
  const translateX = useMotionValue(0);
  const translateY = useMotionValue(initial && isVisible ? 0 : -20);
  const [shouldRender, setShouldRender] = useState(initial && isVisible);
  const exitTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    if (!enabled) {
      setShouldRender(isVisible);
      return;
    }

    if (isVisible) {
      setShouldRender(true);

      const enterDurationSeconds = enterDuration / 1000;

      switch (enterTransition) {
        case 'fade':
          void animate(opacity, 1, {
            duration: enterDurationSeconds,
            ease: timingConfigs.smooth.ease as string,
          });
          void animate(scale, 1, springConfigs.smooth);
          void animate(translateY, 0, springConfigs.smooth);
          break;
        case 'scale':
          void animate(opacity, 1, {
            duration: enterDurationSeconds,
            ease: timingConfigs.smooth.ease as string,
          });
          void animate(scale, 1, springConfigs.bouncy);
          void animate(translateY, 0, springConfigs.smooth);
          break;
        case 'slideUp':
          void animate(opacity, 1, {
            duration: enterDurationSeconds,
            ease: timingConfigs.smooth.ease as string,
          });
          void animate(scale, 1, springConfigs.smooth);
          void animate(translateY, 0, springConfigs.smooth);
          void animate(translateX, 0, springConfigs.smooth);
          break;
        case 'slideDown':
          void animate(opacity, 1, {
            duration: enterDurationSeconds,
            ease: timingConfigs.smooth.ease as string,
          });
          void animate(scale, 1, springConfigs.smooth);
          void animate(translateY, 0, springConfigs.smooth);
          void animate(translateX, 0, springConfigs.smooth);
          break;
        case 'slideLeft':
          void animate(opacity, 1, {
            duration: enterDurationSeconds,
            ease: timingConfigs.smooth.ease as string,
          });
          void animate(scale, 1, springConfigs.smooth);
          void animate(translateX, 0, springConfigs.smooth);
          void animate(translateY, 0, springConfigs.smooth);
          break;
        case 'slideRight':
          void animate(opacity, 1, {
            duration: enterDurationSeconds,
            ease: timingConfigs.smooth.ease as string,
          });
          void animate(scale, 1, springConfigs.smooth);
          void animate(translateX, 0, springConfigs.smooth);
          void animate(translateY, 0, springConfigs.smooth);
          break;
      }
    } else {
      const exitDurationSeconds = exitDuration / 1000;

      switch (exitTransition) {
        case 'fade':
          void animate(opacity, 0, {
            duration: exitDurationSeconds,
            ease: timingConfigs.fast.ease as string,
          });
          void animate(scale, 0.95, {
            duration: exitDurationSeconds,
            ease: timingConfigs.fast.ease as string,
          });
          break;
        case 'scale':
          void animate(opacity, 0, {
            duration: exitDurationSeconds,
            ease: timingConfigs.fast.ease as string,
          });
          void animate(scale, 0.8, {
            duration: exitDurationSeconds,
            ease: timingConfigs.fast.ease as string,
          });
          break;
        case 'slideUp':
          void animate(opacity, 0, {
            duration: exitDurationSeconds,
            ease: timingConfigs.fast.ease as string,
          });
          void animate(translateY, -20, {
            duration: exitDurationSeconds,
            ease: timingConfigs.fast.ease as string,
          });
          break;
        case 'slideDown':
          void animate(opacity, 0, {
            duration: exitDurationSeconds,
            ease: timingConfigs.fast.ease as string,
          });
          void animate(translateY, 20, {
            duration: exitDurationSeconds,
            ease: timingConfigs.fast.ease as string,
          });
          break;
        case 'slideLeft':
          void animate(opacity, 0, {
            duration: exitDurationSeconds,
            ease: timingConfigs.fast.ease as string,
          });
          void animate(translateX, -20, {
            duration: exitDurationSeconds,
            ease: timingConfigs.fast.ease as string,
          });
          break;
        case 'slideRight':
          void animate(opacity, 0, {
            duration: exitDurationSeconds,
            ease: timingConfigs.fast.ease as string,
          });
          void animate(translateX, 20, {
            duration: exitDurationSeconds,
            ease: timingConfigs.fast.ease as string,
          });
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
    enabled,
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
  };
}
