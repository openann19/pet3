'use client';

import { useMotionValue, animate, type MotionValue } from 'framer-motion';
import { useEffect } from 'react';
import { springConfigs } from '@/effects/reanimated/transitions';
import type { CSSProperties } from 'react';

export interface UseNavBarAnimationOptions {
  delay?: number;
}

export interface UseNavBarAnimationReturn {
  opacity: MotionValue<number>;
  translateY: MotionValue<number>;
  scale: MotionValue<number>;
  navStyle: CSSProperties;
  shimmerTranslateX: MotionValue<number>;
  shimmerOpacity: MotionValue<number>;
  shimmerStyle: CSSProperties;
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
    const delayMs = delay / 1000;
    animate(opacity, 1, {
      delay: delayMs,
      type: 'spring',
      damping: springConfigs.smooth.damping,
      stiffness: springConfigs.smooth.stiffness,
    });
    animate(translateY, 0, {
      delay: delayMs,
      type: 'spring',
      damping: springConfigs.smooth.damping,
      stiffness: springConfigs.smooth.stiffness,
    });
    animate(scale, 1, {
      delay: delayMs,
      duration: 0.3,
      ease: 'easeOut',
    });

    animate(shimmerTranslateX, [-100, 100], {
      repeat: Infinity,
      duration: 4,
      ease: 'linear',
      times: [0, 1],
    });
    animate(shimmerOpacity, [0, 0.4, 0.4, 0], {
      repeat: Infinity,
      duration: 4,
      ease: 'easeInOut',
      times: [0, 0.25, 0.75, 1],
    });
  }, [delay, opacity, translateY, scale, shimmerTranslateX, shimmerOpacity]);

  return {
    opacity,
    translateY,
    scale,
    navStyle: {
      opacity: opacity.get(),
      transform: `translateY(${translateY.get()}px) scale(${scale.get()})`,
    },
    shimmerTranslateX,
    shimmerOpacity,
    shimmerStyle: {
      transform: `translateX(${shimmerTranslateX.get()}%)`,
      opacity: shimmerOpacity.get(),
    },
  };
}
