
import { useEffect } from 'react';
import { useMotionValue, animate, MotionValue } from 'framer-motion';
import { timingConfigs } from '@/effects/reanimated/transitions';
import type { AnimatedStyle } from '@/effects/reanimated/animated-view';
import { makeRng } from '@petspark/shared';

export interface UseFloatingParticleOptions {
  initialX?: number;
  initialY?: number;
  width?: number;
  height?: number;
  duration?: number;
  delay?: number;
  opacity?: number;
}

export interface UseFloatingParticleReturn {
  readonly x: MotionValue<number>;
  readonly y: MotionValue<number>;
  readonly opacity: MotionValue<number>;
  readonly scale: MotionValue<number>;
  readonly style: AnimatedStyle;
}


export function useFloatingParticle(
  options: UseFloatingParticleOptions = {}
): UseFloatingParticleReturn {
  const {
    initialX = 0,
    initialY = 0,
    width = 1920,
    height = 1080,
    duration = 15,
    opacity = 0.6,
  } = options;

  const x = useMotionValue(initialX);
  const y = useMotionValue(initialY);
  const opacityValue = useMotionValue(0);
  const scale = useMotionValue(0.5);

  useEffect(() => {
    const seed = Date.now() + initialX + initialY;
    const rng = makeRng(seed);
  const randomX: number[] = [rng() * width, rng() * width, rng() * width, rng() * width];
  const randomY: number[] = [rng() * height, rng() * height, rng() * height, rng() * height];

    let frame = 0;
    let running = true;
    const totalFrames = 4;
    const frameDuration = (duration * 1000) / totalFrames;

    function animateLoop() {
      if (!running) return;
  animate(x, randomX[frame % randomX.length] ?? 0, { duration: frameDuration / 1000 });
  animate(y, randomY[frame % randomY.length] ?? 0, { duration: frameDuration / 1000 });
      animate(opacityValue, frame % 4 === 0 ? 0 : opacity, { duration: frameDuration / 1000 });
      animate(scale, frame % 2 === 0 ? 1 : 0.5, { duration: frameDuration / 1000 });
      frame = (frame + 1) % totalFrames;
      setTimeout(animateLoop, frameDuration);
    }
    animateLoop();
    return () => {
      running = false;
    };
  }, [width, height, duration, opacity, initialX, initialY, x, y, opacityValue, scale]);

  const style: AnimatedStyle = {
    transform: [
      { translateX: x },
      { translateY: y },
      { scale },
    ],
    opacity: opacityValue,
  };

  return {
    x,
    y,
    opacity: opacityValue,
    scale,
    style,
  };
}
