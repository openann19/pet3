'use client';
import { useEffect } from 'react';
import { useSharedValue, useAnimatedStyle, withTiming, Easing } from '@petspark/motion';
import type { AnimatedStyle } from '@/hooks/use-animated-style-value';
import { useUIConfig } from '@/hooks/use-ui-config';

export interface UseGlassBackgroundOptions {
  enabled?: boolean;
  intensity?: number;
}

export interface UseGlassBackgroundReturn {
  animatedStyle: AnimatedStyle;
  blurIntensity: ReturnType<typeof useSharedValue<number>>;
}

/**
 * Glassmorphism background effect
 *
 * Creates a glass-like background with blur and transparency
 *
 * @example
 * ```tsx
 * const { animatedStyle } = useGlassBackground({ intensity: 0.8 })
 * return <motion.div style={animatedStyle}>{content}</motion.div>
 * ```
 */
export function useGlassBackground(
  options: UseGlassBackgroundOptions = {}
): UseGlassBackgroundReturn {
  const { enabled = true, intensity = 0.8 } = options;
  const { visual } = useUIConfig();

  const blurIntensity = useSharedValue(0);

  useEffect(() => {
    if (!enabled || !visual.enableBlur) {
      return;
    }

    blurIntensity.value = withTiming(intensity, {
      duration: 500,
      easing: Easing.out(Easing.ease),
    }).target;
  }, [enabled, visual.enableBlur, blurIntensity, intensity]);

  const animatedStyle = useAnimatedStyle(() => {
    if (!enabled || !visual.enableBlur) {
      return {};
    }

    const blurVal = typeof blurIntensity.value === 'number' ? blurIntensity.value : (typeof blurIntensity.value.target === 'number' ? blurIntensity.value.target : 0);
    const blurPx = blurVal * 20;
    const bgOpacity = 0.1 * blurVal;
    const borderOpacity = 0.2 * blurVal;
    return {
      backdropFilter: `blur(${blurPx}px)`,
      WebkitBackdropFilter: `blur(${blurPx}px)`,
      backgroundColor: `rgba(255, 255, 255, ${bgOpacity})`,
      borderWidth: 1,
      borderColor: `rgba(255, 255, 255, ${borderOpacity})`,
    };
  }) as AnimatedStyle;

  return {
    animatedStyle,
    blurIntensity,
  };
}
