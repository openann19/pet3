import { useEffect, useMemo } from 'react';

// If you use react-native-reanimated on web, keep these imports.
// If not, the types still compile during tsc (test files don’t execute).
// Adjust paths if your reanimated helper lives elsewhere.
import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  Easing,
} from 'react-native-reanimated';

export interface ShimmerSweepOptions {
  width: number; // px width of the shimmering mask path
  duration?: number; // ms
  delay?: number; // ms
  paused?: boolean;
  minOpacity?: number; // 0..1
  maxOpacity?: number; // 0..1
  easing?: (value: number) => number;
}

export function useShimmerSweep({
  width,
  duration = 1500,
  delay = 0,
  paused = false,
  minOpacity = 0.15,
  maxOpacity = 0.9,
  easing = Easing.linear,
}: ShimmerSweepOptions) {
  const x = useSharedValue(-width);
  const opacity = useSharedValue(minOpacity);

  useEffect(() => {
    if (paused) return;

    const startAfterDelay = () => {
      x.value = withRepeat(withTiming(width * 2, { duration, easing }), -1, false);
      opacity.value = withRepeat(
        withTiming(maxOpacity, { duration: Math.max(300, duration / 3), easing }),
        -1,
        true
      );
    };

    let t: number | undefined;
    if (delay > 0) {
      t = window.setTimeout(startAfterDelay, delay);
    } else {
      startAfterDelay();
    }

    return () => {
      if (t) window.clearTimeout(t);
      x.value = -width;
      opacity.value = minOpacity;
    };
  }, [delay, duration, easing, maxOpacity, minOpacity, paused, width, x, opacity]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: x.value }],
      opacity: opacity.value,
    };
  });

  return useMemo(
    () => ({
      animatedStyle,
      x,
      opacity,
    }),
    [animatedStyle, x, opacity]
  );
}

export default useShimmerSweep;
