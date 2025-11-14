'use client';
import { isTruthy } from '@/core/guards';
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

export interface UseAIReplyAuraReturn {
  animatedStyle: AnimatedStyle;
  glow: ReturnType<typeof useSharedValue<number>>;
  shimmer: ReturnType<typeof useSharedValue<number>>;
}

/**
 * AGI-Level AI Reply Visual Effects
 *
 * Provides shimmer, glow, and mood theme for AI messages
 *
 * @example
 * ```tsx
 * const { animatedStyle } = useAIReplyAura()
 * return <motion.div style={animatedStyle}>{content}</motion.div>
 * ```
 */
export function useAIReplyAura(): UseAIReplyAuraReturn {
  const { visual } = useUIConfig();

  const glow = useSharedValue(0);
  const shimmer = useSharedValue(0);

  useEffect(() => {
    if (!visual.enableGlow && !visual.enableShimmer) {
      return;
    }

    if (isTruthy(visual.enableGlow)) {
      glow.value = withTiming(0.8, {
        duration: 800,
        easing: Easing.out(Easing.ease),
      }).target;
    }

    if (isTruthy(visual.enableShimmer)) {
      shimmer.value = withRepeat(
        withSequence(
          withTiming(1, {
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(0, {
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
          })
        ),
        -1,
        false
      ).target;
    }
  }, [glow, shimmer, visual.enableGlow, visual.enableShimmer]);

  const animatedStyle = useAnimatedStyle(() => {
    if (!visual.enableGlow && !visual.enableShimmer) {
      return {};
    }

    const glowVal = typeof glow.value === 'number' ? glow.value : glow.value.target;
    const shimmerVal = typeof shimmer.value === 'number' ? shimmer.value : shimmer.value.target;
    return {
      shadowColor: '#6EE7B7',
      shadowOpacity: visual.enableGlow ? glowVal : 0,
      shadowRadius: visual.enableGlow ? 20 * glowVal : 0,
      backgroundColor: visual.enableGlow
        ? `rgba(110, 231, 183, ${String(0.05 + glowVal * 0.1)})`
        : undefined,
      opacity: visual.enableShimmer ? 0.9 + shimmerVal * 0.1 : undefined,
    };
  }) as AnimatedStyle;

  return {
    animatedStyle,
    glow,
    shimmer,
  };
}
