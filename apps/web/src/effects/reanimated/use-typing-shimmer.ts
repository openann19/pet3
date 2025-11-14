'use client';

import {
  useMotionValue,
  animate,
  type MotionValue,
} from 'framer-motion';
import { useEffect, useCallback } from 'react';
import { useMotionStyle } from './use-motion-style';
import type { CSSProperties } from 'react';

export interface UseTypingShimmerOptions {
  duration?: number;
  shimmerWidth?: number;
  enabled?: boolean;
  isComplete?: boolean;
}

export interface UseTypingShimmerReturn {
  shimmerTranslateX: MotionValue<number>;
  shimmerOpacity: MotionValue<number>;
  placeholderOpacity: MotionValue<number>;
  placeholderScale: MotionValue<number>;
  contentOpacity: MotionValue<number>;
  contentScale: MotionValue<number>;
  shimmerStyle: CSSProperties;
  placeholderStyle: CSSProperties;
  contentStyle: CSSProperties;
  start: () => void;
  stop: () => void;
  reveal: () => void;
}

const DEFAULT_DURATION = 2000;
const DEFAULT_SHIMMER_WIDTH = 200;

export function useTypingShimmer(options: UseTypingShimmerOptions = {}): UseTypingShimmerReturn {
  const {
    duration = DEFAULT_DURATION,
    shimmerWidth = DEFAULT_SHIMMER_WIDTH,
    enabled = true,
    isComplete = false,
  } = options;

  const shimmerTranslateX = useMotionValue(-shimmerWidth);
  const shimmerOpacity = useMotionValue(0.4);
  const placeholderOpacity = useMotionValue(1);
  const placeholderScale = useMotionValue(1);
  const contentOpacity = useMotionValue(0);
  const contentScale = useMotionValue(0.95);

  const start = useCallback(() => {
    if (!enabled) {
      return;
    }

    // Animate shimmer translateX
    void animate(shimmerTranslateX, shimmerWidth * 2, {
      duration: duration / 1000,
      ease: 'linear',
      repeat: Infinity,
    });

    // Animate shimmer opacity
    void animate(shimmerOpacity, [0.6, 0.3, 0.6], {
      duration: duration / 1000,
      ease: 'easeInOut',
      repeat: Infinity,
      times: [0, 0.5, 1],
    });
  }, [enabled, duration, shimmerWidth, shimmerTranslateX, shimmerOpacity]);

  const stop = useCallback(() => {
    shimmerTranslateX.set(-shimmerWidth);
    shimmerOpacity.set(0.4);
  }, [shimmerWidth, shimmerTranslateX, shimmerOpacity]);

  const reveal = useCallback(() => {
    void animate(placeholderOpacity, 0, {
      duration: 0.3,
      ease: 'easeOut',
    });
    void animate(placeholderScale, 0.9, {
      duration: 0.3,
      ease: 'easeOut',
    });

    void animate(contentOpacity, 1, {
      duration: 0.3,
      ease: 'easeOut',
      delay: 0.15,
    });
    void animate(contentScale, 1, {
      duration: 0.3,
      ease: [0.25, 0.1, 0.25, 1], // cubic easing
      delay: 0.15,
    });

    stop();
  }, [placeholderOpacity, placeholderScale, contentOpacity, contentScale, stop]);

  useEffect(() => {
    if (enabled && !isComplete) {
      start();
    } else {
      stop();
    }

    if (isComplete) {
      reveal();
    }
  }, [enabled, isComplete, start, stop, reveal]);

  const shimmerStyle = useMotionStyle(() => {
    const gradientStart = shimmerTranslateX.get();
    const gradientEnd = shimmerTranslateX.get() + shimmerWidth;
    const opacity = shimmerOpacity.get();

    return {
      transform: [{ translateX: shimmerTranslateX.get() }],
      opacity,
      background: `linear-gradient(90deg, 
        transparent 0%, 
        rgba(255, 255, 255, ${opacity * 0.5}) ${gradientStart}px, 
        rgba(255, 255, 255, ${opacity}) ${(gradientStart + gradientEnd) / 2}px, 
        rgba(255, 255, 255, ${opacity * 0.5}) ${gradientEnd}px, 
        transparent 100%
      )`,
    };
  });

  const placeholderStyle = useMotionStyle(() => {
    return {
      opacity: placeholderOpacity.get(),
      transform: [{ scale: placeholderScale.get() }],
    };
  });

  const contentStyle = useMotionStyle(() => {
    return {
      opacity: contentOpacity.get(),
      transform: [{ scale: contentScale.get() }],
    };
  });

  return {
    shimmerTranslateX,
    shimmerOpacity,
    placeholderOpacity,
    placeholderScale,
    contentOpacity,
    contentScale,
    shimmerStyle,
    placeholderStyle,
    contentStyle,
    start,
    stop,
    reveal,
  };
}
