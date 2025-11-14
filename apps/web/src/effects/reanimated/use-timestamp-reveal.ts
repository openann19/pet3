'use client';

import {
  useMotionValue,
  animate,
  type MotionValue,
} from 'framer-motion';
import { useCallback, useRef } from 'react';
import { springConfigs, timingConfigs } from '@/effects/reanimated/transitions';
import { useMotionStyle } from './use-motion-style';
import type { CSSProperties } from 'react';

export interface UseTimestampRevealOptions {
  autoHideDelay?: number;
  enabled?: boolean;
}

export interface UseTimestampRevealReturn {
  opacity: MotionValue<number>;
  translateY: MotionValue<number>;
  animatedStyle: CSSProperties;
  show: () => void;
  hide: () => void;
}

const DEFAULT_AUTO_HIDE_DELAY = 3000;
const DEFAULT_ENABLED = true;

export function useTimestampReveal(
  options: UseTimestampRevealOptions = {}
): UseTimestampRevealReturn {
  const { autoHideDelay = DEFAULT_AUTO_HIDE_DELAY, enabled = DEFAULT_ENABLED } = options;

  const opacity = useMotionValue(0);
  const translateY = useMotionValue(10);
  const hideTimeoutRef = useRef<number | undefined>(undefined);

  const show = useCallback(() => {
    if (!enabled) {
      return;
    }

    if (hideTimeoutRef.current !== undefined) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = undefined;
    }

    void animate(opacity, 1, {
      ...springConfigs.smooth,
    });
    void animate(translateY, 0, {
      ...springConfigs.smooth,
    });

    hideTimeoutRef.current = window.setTimeout(() => {
      void animate(opacity, 0, {
        duration: timingConfigs.fast.duration,
        ease: timingConfigs.fast.ease as string,
      });
      void animate(translateY, 10, {
        duration: timingConfigs.fast.duration,
        ease: timingConfigs.fast.ease as string,
      });
      hideTimeoutRef.current = undefined;
    }, autoHideDelay);
  }, [enabled, autoHideDelay, opacity, translateY]);

  const hide = useCallback(() => {
    if (hideTimeoutRef.current !== undefined) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = undefined;
    }

    void animate(opacity, 0, {
      duration: timingConfigs.fast.duration,
      ease: timingConfigs.fast.ease as string,
    });
    void animate(translateY, 10, {
      duration: timingConfigs.fast.duration,
      ease: timingConfigs.fast.ease as string,
    });
  }, [opacity, translateY]);

  const animatedStyle = useMotionStyle(() => {
    return {
      opacity: opacity.get(),
      transform: [{ translateY: translateY.get() }],
    };
  });

  return {
    opacity,
    translateY,
    animatedStyle,
    show,
    hide,
  };
}
