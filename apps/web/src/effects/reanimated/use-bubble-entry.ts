'use client';

import {
  useMotionValue,
  animate,
  type MotionValue,
} from 'framer-motion';
import { useEffect, useCallback } from 'react';
import { springConfigs } from '@/effects/reanimated/transitions';
import { useMotionStyle } from './use-motion-style';
import type { CSSProperties } from 'react';

export type BubbleDirection = 'incoming' | 'outgoing';

export interface UseBubbleEntryOptions {
  index?: number;
  staggerDelay?: number;
  direction?: BubbleDirection;
  enabled?: boolean;
  isNew?: boolean;
}

// Legacy compatibility interface
export interface UseBubbleEntryReturn {
  opacity: MotionValue<number>;
  translateY: MotionValue<number>;
  translateX: MotionValue<number>;
  scale: MotionValue<number>;
  animatedStyle: CSSProperties;
  trigger: () => void;
}

const DEFAULT_INDEX = 0;
const DEFAULT_STAGGER_DELAY = 40;
const DEFAULT_DIRECTION: BubbleDirection = 'outgoing';
const DEFAULT_ENABLED = true;
const DEFAULT_IS_NEW = true;

export function useBubbleEntry(options: UseBubbleEntryOptions = {}): UseBubbleEntryReturn {
  const {
    index = DEFAULT_INDEX,
    staggerDelay = DEFAULT_STAGGER_DELAY,
    direction = DEFAULT_DIRECTION,
    enabled = DEFAULT_ENABLED,
    isNew = DEFAULT_IS_NEW,
  } = options;

  const opacity = useMotionValue(isNew && enabled ? 0 : 1);
  const translateY = useMotionValue(isNew && enabled ? 20 : 0);
  const translateX = useMotionValue(isNew && enabled ? (direction === 'incoming' ? -30 : 30) : 0);
  const scale = useMotionValue(isNew && enabled ? 0.95 : 1);

  const trigger = useCallback(() => {
    if (!enabled || !isNew) {
      return;
    }

    const delay = (index * staggerDelay) / 1000; // Convert ms to seconds

    void animate(opacity, 1, {
      delay,
      ...springConfigs.smooth,
    });

    void animate(translateY, 0, {
      delay,
      ...springConfigs.smooth,
    });

    if (direction === 'incoming') {
      void animate(translateX, 0, {
        delay,
        type: 'spring',
        damping: 25,
        stiffness: 400,
        mass: 0.8,
      });
      void animate(scale, 1, {
        delay,
        type: 'spring',
        damping: 20,
        stiffness: 500,
        mass: 0.9,
      });
    } else {
      void animate(translateX, 0, {
        delay,
        ...springConfigs.smooth,
      });
      void animate(scale, 1, {
        delay,
        ...springConfigs.bouncy,
      });
    }
  }, [enabled, isNew, index, staggerDelay, direction, opacity, translateY, translateX, scale]);

  useEffect(() => {
    if (enabled && isNew) {
      trigger();
    }
  }, [enabled, isNew, trigger]);

  const animatedStyle = useMotionStyle(() => {
    return {
      opacity: opacity.get(),
      transform: [
        { translateY: translateY.get() },
        { translateX: translateX.get() },
        { scale: scale.get() },
      ],
    };
  });

  return {
    opacity,
    translateY,
    translateX,
    scale,
    animatedStyle,
    trigger,
  };
}
