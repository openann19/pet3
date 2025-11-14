'use client';
import { useEffect } from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from '@petspark/motion';
import type { AnimatedStyle } from '@/hooks/use-animated-style-value';
import { useUIConfig } from '@/hooks/use-ui-config';

export interface UseMessageShimmerOptions {
  enabled?: boolean;
  duration?: number;
  shimmerWidth?: number;
}

export interface UseMessageShimmerReturn {
  animatedStyle: AnimatedStyle;
  shimmerProgress: ReturnType<typeof useSharedValue<number>>;
}

/**
 * Message shimmer effect for placeholders and loading states
 *
 * Creates a shimmer sweep effect across message placeholders
 *
 * @example
 * ```tsx
 * const { animatedStyle } = useMessageShimmer({ enabled: isLoading })
 * return <motion.div style={animatedStyle}>{placeholder}</motion.div>
 * ```
 */
export function useMessageShimmer(options: UseMessageShimmerOptions = {}): UseMessageShimmerReturn {
  const { enabled = true, duration = 2000, shimmerWidth = 200 } = options;

  const { visual } = useUIConfig();

  const shimmerProgress = useSharedValue(-shimmerWidth);

  useEffect(() => {
    if (!enabled || !visual.enableShimmer) {
      return;
    }

    shimmerProgress.value = withRepeat(
      withTiming(shimmerWidth, {
        duration,
        easing: Easing.linear,
      }),
      -1,
      false
    ).target;
  }, [enabled, visual.enableShimmer, shimmerProgress, shimmerWidth, duration]);

  const animatedStyle = useAnimatedStyle(() => {
    if (!enabled || !visual.enableShimmer) {
      return {};
    }

    const progressVal = typeof shimmerProgress.value === 'number' ? shimmerProgress.value : (typeof shimmerProgress.value.target === 'number' ? shimmerProgress.value.target : 0);
    const opacity = Math.abs(progressVal / shimmerWidth) * 0.6 + 0.3;

    return {
      transform: [
        {
          translateX: progressVal,
        },
      ],
      opacity,
    };
  }) as AnimatedStyle;

  return {
    animatedStyle,
    shimmerProgress,
  };
}
