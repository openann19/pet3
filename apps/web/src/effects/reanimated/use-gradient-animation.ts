'use client';

import { useEffect } from 'react';
import { useMotionValue, animate, MotionValue } from 'framer-motion';
import type { AnimatedStyle } from '@/effects/reanimated/animated-view';

export interface UseGradientAnimationOptions {
  type?: 'scale' | 'rotate' | 'translate' | 'combined';
  duration?: number;
  delay?: number;
  opacityRange?: [number, number];
  scaleRange?: [number, number];
  translateRange?: { x: [number, number]; y: [number, number] };
  rotationRange?: [number, number];
}

export interface UseGradientAnimationReturn {
  scale: MotionValue<number>;
  opacity: MotionValue<number>;
  x: MotionValue<number>;
  y: MotionValue<number>;
  rotation: MotionValue<number>;
  style: AnimatedStyle;
}

export function useGradientAnimation(
  options: UseGradientAnimationOptions = {}
): UseGradientAnimationReturn {
  const {
    type = 'combined',
    duration = 10,
    delay = 0,
    opacityRange = [0.4, 0.8],
    scaleRange = [1, 1.4],
    translateRange = { x: [0, 100], y: [0, 60] },
    rotationRange = [0, 360],
  } = options;

  const scale = useMotionValue(scaleRange[0]);
  const opacity = useMotionValue(opacityRange[0]);
  const x = useMotionValue(translateRange.x[0]);
  const y = useMotionValue(translateRange.y[0]);
  const rotation = useMotionValue(rotationRange[0]);

  useEffect(() => {
    let running = true;
    function animateLoop() {
      if (!running) return;
      if (type === 'scale' || type === 'combined') {
        animate(scale, scaleRange[1], { duration: duration * 0.33, ease: 'linear' }).then(() => {
          animate(scale, scaleRange[0], { duration: duration * 0.67, ease: 'linear' }).then(() => {
            if (running) animateLoop();
          });
        });
      }
      if (type === 'translate' || type === 'combined') {
        animate(opacity, opacityRange[1], { duration: duration * 0.33, ease: 'linear' }).then(() => {
          animate(opacity, opacityRange[0], { duration: duration * 0.67, ease: 'linear' });
        });
        animate(x, translateRange.x[1], { duration: duration * 0.33, ease: 'linear' }).then(() => {
          animate(x, translateRange.x[0], { duration: duration * 0.67, ease: 'linear' });
        });
        animate(y, translateRange.y[1], { duration: duration * 0.33, ease: 'linear' }).then(() => {
          animate(y, translateRange.y[0], { duration: duration * 0.67, ease: 'linear' });
        });
      }
      if (type === 'rotate' || type === 'combined') {
        animate(rotation, rotationRange[1], { duration: duration, ease: 'linear' }).then(() => {
          animate(rotation, rotationRange[0], { duration: 0, ease: 'linear' }).then(() => {
            if (running) animateLoop();
          });
        });
      }
    }
    animateLoop();
    return () => {
      running = false;
    };
  }, [type, duration, delay, opacityRange, scaleRange, translateRange, rotationRange, scale, opacity, x, y, rotation]);

  const style: AnimatedStyle = {
    transform: [
      ...(type === 'scale' || type === 'combined' ? [{ scale }] : []),
      ...(type === 'translate' || type === 'combined' ? [{ translateX: x }, { translateY: y }] : []),
      ...(type === 'rotate' || type === 'combined' ? [{ rotate: rotation }] : []),
    ],
    opacity,
  };

  return {
    scale,
    opacity,
    x,
    y,
    rotation,
    style,
  };
}
