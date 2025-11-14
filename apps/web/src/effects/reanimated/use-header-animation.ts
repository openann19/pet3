
import { useEffect } from 'react';
import { useMotionValue, animate, type MotionValue } from 'framer-motion';
import type { AnimatedStyle } from '@/effects/reanimated/animated-view';

export interface UseHeaderAnimationOptions {
  delay?: number;
}


export interface UseHeaderAnimationReturn {
  y: MotionValue<number>;
  opacity: MotionValue<number>;
  shimmerX: MotionValue<number>;
  shimmerOpacity: MotionValue<number>;
  headerStyle: AnimatedStyle;
  shimmerStyle: AnimatedStyle;
}


export function useHeaderAnimation(
  options: UseHeaderAnimationOptions = {}
): UseHeaderAnimationReturn {
  const { delay = 0.1 } = options;

  const y = useMotionValue(-100);
  const opacity = useMotionValue(0);
  const shimmerX = useMotionValue(-100);
  const shimmerOpacity = useMotionValue(0);

  useEffect(() => {
    const delayMs = delay * 1000;
    setTimeout(() => {
      animate(y, 0, { duration: 0.4 });
      animate(opacity, 1, { duration: 0.4 });
    }, delayMs);

    // Shimmer X: loop from -100 to 100
    let shimmerXActive = true;
    const shimmerXLoop = () => {
      if (!shimmerXActive) return;
      shimmerX.set(-100);
      animate(shimmerX, 100, {
        duration: 3,
        onComplete: () => {
          if (shimmerXActive) shimmerXLoop();
        },
      });
    };
    shimmerXLoop();

    // Shimmer Opacity: loop 0 -> 0.5 -> 0
    let shimmerOpacityActive = true;
    const shimmerOpacityLoop = () => {
      if (!shimmerOpacityActive) return;
      shimmerOpacity.set(0);
      animate(shimmerOpacity, 0.5, {
        duration: 1.5,
        onComplete: () => {
          animate(shimmerOpacity, 0, {
            duration: 1.5,
            onComplete: () => {
              if (shimmerOpacityActive) shimmerOpacityLoop();
            },
          });
        },
      });
    };
    shimmerOpacityLoop();

    return () => {
      shimmerXActive = false;
      shimmerOpacityActive = false;
    };
  }, [delay, y, opacity, shimmerX, shimmerOpacity]);

  const headerStyle: AnimatedStyle = {
    transform: [{ translateY: y }],
    opacity,
  };

  const shimmerStyle: AnimatedStyle = {
    transform: [{ translateX: shimmerX }],
    opacity: shimmerOpacity,
  };

  return {
    y,
    opacity,
    shimmerX,
    shimmerOpacity,
    headerStyle,
    shimmerStyle,
  };
}
