'use client';
import { motion } from 'framer-motion';

import { useEffect } from 'react';
import {
  useSharedValue,
  withTiming,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  Easing,
} from '@petspark/motion';
import type { AnimatedStyle } from '@/hooks/use-animated-style-value';
import { useUIConfig } from '@/hooks/use-ui-config';

export interface UseTypingTrailReturn {
  animatedStyle: AnimatedStyle;
  trailOpacity: ReturnType<typeof useSharedValue<number>>;
}

/**
 * Typing indicator shimmer trail effect
 *
 * Creates a shimmer trail effect for typing indicators
 *
 * @example
 * ```tsx
 * const { animatedStyle } = useTypingTrail()
 * return <motion.div style={animatedStyle}>{dots}</motion.div>
 * ```
 */
export function useTypingTrail(): UseTypingTrailReturn {
  const { visual, animation } = useUIConfig();

  const trailOpacity = useSharedValue(0);

  useEffect(() => {
    if (!visual.enableShimmer || !animation.showTrails) {
      return;
    }

    trailOpacity.value = withRepeat(
      withSequence(
        withTiming(1, {
          duration: 600,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(0.3, {
          duration: 600,
          easing: Easing.inOut(Easing.ease),
        })
      ),
      -1,
      true
    ).target;
  }, [trailOpacity, visual.enableShimmer, animation.showTrails]);

  const animatedStyle = useAnimatedStyle(() => {
    if (!visual.enableShimmer || !animation.showTrails) {
      return {};
    }

    const opacityVal = typeof trailOpacity.value === 'number' ? trailOpacity.value : (typeof trailOpacity.value.target === 'number' ? trailOpacity.value.target : 0);
    const translateXVal = (opacityVal - 0.5) * 4;
    return {
      opacity: opacityVal,
      transform: [
        {
          translateX: translateXVal,
        },
      ],
    };
  }) as AnimatedStyle;

  return {
    animatedStyle,
    trailOpacity,
  };
}
