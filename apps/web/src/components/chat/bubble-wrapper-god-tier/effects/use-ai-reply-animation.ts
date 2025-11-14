'use client';

import { useMotionValue, animate, useTransform, type MotionValue } from 'framer-motion';
import { isTruthy } from '@/core/guards';
import { useEffect } from 'react';

export interface UseAiReplyAnimationOptions {
  enabled?: boolean;
  showShimmer?: boolean;
  showSparkles?: boolean;
  showGlow?: boolean;
  shimmerSpeed?: number;
  glowIntensity?: number;
}

export interface UseAiReplyAnimationReturn {
  shimmerStyle: { opacity: number; x: MotionValue<number> };
  sparkleStyle: { opacity: MotionValue<number>; scale: MotionValue<number>; rotate: MotionValue<number> };
  glowStyle: { opacity: MotionValue<number> };
  containerStyle: { opacity: number };
  shimmerProgress: MotionValue<number>;
  glowOpacity: MotionValue<number>;
}

const DEFAULT_ENABLED = true;
const DEFAULT_SHOW_SHIMMER = true;
const DEFAULT_SHOW_SPARKLES = true;
const DEFAULT_SHOW_GLOW = true;
const DEFAULT_SHIMMER_SPEED = 2000;
const DEFAULT_GLOW_INTENSITY = 0.6;

export function useAiReplyAnimation(
  options: UseAiReplyAnimationOptions = {}
): UseAiReplyAnimationReturn {
  const {
    enabled = DEFAULT_ENABLED,
    showShimmer = DEFAULT_SHOW_SHIMMER,
    showSparkles = DEFAULT_SHOW_SPARKLES,
    showGlow = DEFAULT_SHOW_GLOW,
    shimmerSpeed = DEFAULT_SHIMMER_SPEED,
    glowIntensity = DEFAULT_GLOW_INTENSITY,
  } = options;

  const shimmerProgress = useMotionValue(0);
  const glowOpacity = useMotionValue(0);
  const sparkleOpacity = useMotionValue(0);
  const sparkleScale = useMotionValue(1);
  const sparkleRotation = useMotionValue(0);
  const disabledSparkleOpacity = useMotionValue(0);
  const disabledSparkleScale = useMotionValue(1);
  const disabledSparkleRotation = useMotionValue(0);
  const disabledGlowOpacity = useMotionValue(0);

  const shimmerX = useTransform(shimmerProgress, [0, 1], [-100, 100], {
    clamp: true,
  });

  useEffect(() => {
    if (!enabled) {
      shimmerProgress.set(0);
      glowOpacity.set(0);
      sparkleOpacity.set(0);
      return;
    }

    if (isTruthy(showShimmer)) {
      animate(shimmerProgress, [0, 1], {
        repeat: Infinity,
        duration: shimmerSpeed / 1000,
        ease: 'linear',
        times: [0, 1],
      });
    }

    if (isTruthy(showGlow)) {
      animate(glowOpacity, [glowIntensity, glowIntensity * 0.5], {
        repeat: Infinity,
        duration: 3,
        ease: 'easeInOut',
        times: [0, 1],
      });
    }

    if (isTruthy(showSparkles)) {
      animate(sparkleOpacity, [0, 1, 0.3, 0], {
        repeat: Infinity,
        duration: 2,
        ease: 'easeInOut',
        times: [0, 0.25, 0.75, 1],
      });

      animate(sparkleScale, [1, 1.2, 0.8, 1], {
        repeat: Infinity,
        duration: 2,
        ease: 'easeInOut',
        times: [0, 0.25, 0.75, 1],
      });

      animate(sparkleRotation, 360, {
        repeat: Infinity,
        duration: 3,
        ease: 'linear',
      });
    }
  }, [
    enabled,
    showShimmer,
    showGlow,
    showSparkles,
    shimmerSpeed,
    glowIntensity,
    shimmerProgress,
    glowOpacity,
    sparkleOpacity,
    sparkleScale,
    sparkleRotation,
  ]);

  return {
    shimmerStyle: {
      opacity: showShimmer && enabled ? 0.3 : 0,
      x: shimmerX,
    },
    sparkleStyle: {
      opacity: showSparkles && enabled ? sparkleOpacity : disabledSparkleOpacity,
      scale: showSparkles && enabled ? sparkleScale : disabledSparkleScale,
      rotate: showSparkles && enabled ? sparkleRotation : disabledSparkleRotation,
    },
    glowStyle: {
      opacity: showGlow && enabled ? glowOpacity : disabledGlowOpacity,
    },
    containerStyle: {
      opacity: enabled ? 1 : 0.95,
    },
    shimmerProgress,
    glowOpacity,
  };
}
