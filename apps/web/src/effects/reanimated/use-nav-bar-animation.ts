
import { useEffect } from 'react';
import { useMotionValue, animate, MotionValue } from 'framer-motion';
import { springConfigs } from '@/effects/reanimated/transitions';
import type { AnimatedStyle } from '@/effects/reanimated/animated-view';

export interface UseNavBarAnimationOptions {
  delay?: number;
}

export interface UseNavBarAnimationReturn {
  readonly opacity: MotionValue<number>;
  readonly translateY: MotionValue<number>;
  readonly scale: MotionValue<number>;
  readonly navStyle: AnimatedStyle;
  readonly shimmerTranslateX: MotionValue<number>;
  readonly shimmerOpacity: MotionValue<number>;
  readonly shimmerStyle: AnimatedStyle;
}


export function useNavBarAnimation(
  options: UseNavBarAnimationOptions = {}
): UseNavBarAnimationReturn {
  const { delay = 200 } = options;

  const opacity = useMotionValue(0);
  const translateY = useMotionValue(100);
  const scale = useMotionValue(0.95);
  const shimmerTranslateX = useMotionValue(-100);
  const shimmerOpacity = useMotionValue(0);

  useEffect(() => {
    const delayMs = delay;
    setTimeout(() => {
      animate(opacity, 1, { type: 'spring', ...springConfigs.smooth });
      animate(translateY, 0, { type: 'spring', ...springConfigs.smooth });
      animate(scale, 1, { duration: 0.3 });
    }, delayMs);

    let shimmerFrame = 0;
    let running = true;
    function shimmerLoop() {
      if (!running) return;
      if (shimmerFrame === 0) {
        shimmerTranslateX.set(-100);
        shimmerOpacity.set(0);
        animate(shimmerTranslateX, 100, { duration: 4 });
        setTimeout(() => {
          shimmerOpacity.set(0.4);
        }, 1000);
        setTimeout(() => {
          shimmerOpacity.set(0.4);
        }, 3000);
        setTimeout(() => {
          shimmerOpacity.set(0);
        }, 4000);
      }
      shimmerFrame = (shimmerFrame + 1) % 2;
      setTimeout(shimmerLoop, 4000);
    }
    shimmerLoop();
    return () => {
      running = false;
    };
  }, [delay]);

  const navStyle: AnimatedStyle = {
    opacity,
    transform: [
      { translateY },
      { scale },
    ],
  };

  const shimmerStyle: AnimatedStyle = {
    transform: [
      { translateX: `${shimmerTranslateX.get()}%` },
    ],
    opacity: shimmerOpacity,
  };

  return {
    opacity,
    translateY,
    scale,
    navStyle,
    shimmerTranslateX,
    shimmerOpacity,
    shimmerStyle,
  };
}
