/**
 * Wave Animation
 * Flowing wave effect for backgrounds and decorative elements
 */

import { useEffect } from 'react';
import { useMotionValue, animate, MotionValue } from 'framer-motion';

export interface UseWaveAnimationOptions {
  amplitude?: number;
  frequency?: number;
  speed?: number;
  direction?: 'horizontal' | 'vertical';
  enabled?: boolean;
}

export function useWaveAnimation(options: UseWaveAnimationOptions = {}) {
  const {
    amplitude = 20,
    frequency = 2,
    speed = 3000,
    direction = 'horizontal',
    enabled = true,
  } = options;

  const progress = useMotionValue(0);

  useEffect(() => {
    let running = true;
    function loop() {
      if (!running) return;
      animate(progress, 1, {
        duration: speed / 1000,
        ease: 'linear',
        onComplete: () => {
          progress.set(0);
          if (enabled) loop();
        },
      });
    }
    if (enabled) {
      progress.set(0);
      loop();
    } else {
      progress.set(0);
    }
    return () => {
      running = false;
    };
  }, [enabled, speed, progress]);

  const animatedStyle = {
    get transform() {
      const phase = progress.get() * Math.PI * 2 * frequency;
      const wave = Math.sin(phase) * amplitude;
      if (direction === 'horizontal') {
        return [{ translateX: wave }];
      } else {
        return [{ translateY: wave }];
      }
    },
  };

  return {
    animatedStyle,
    progress,
  };
}

export function useMultiWave(waveCount = 3) {
  const progress = useMotionValue(0);

  useEffect(() => {
    let running = true;
    function loop() {
      if (!running) return;
      animate(progress, 1, {
        duration: 4,
        ease: 'linear',
        onComplete: () => {
          progress.set(0);
          loop();
        },
      });
    }
    progress.set(0);
    loop();
    return () => {
      running = false;
    };
  }, [progress, waveCount]);

  const interpolate = (input: number, inputRange: number[], outputRange: number[]) => {
    // Simple linear interpolation for 3-point range
    const i0 = inputRange[0] ?? 0;
    const i1 = inputRange[1] ?? 0.5;
    const i2 = inputRange[2] ?? 1;
    const o0 = outputRange[0] ?? 0.3;
    const o1 = outputRange[1] ?? 0.6;
    const o2 = outputRange[2] ?? 0.3;
    if (input <= i0) return o0;
    if (input >= i2) return o2;
    if (input < i1) {
      // Between 0 and 0.5
      const t = (input - i0) / (i1 - i0);
      return o0 + t * (o1 - o0);
    } else {
      // Between 0.5 and 1
      const t = (input - i1) / (i2 - i1);
      return o1 + t * (o2 - o1);
    }
  };

  const createWaveStyle = (waveIndex: number, amplitude = 15) => {
    const phaseOffset = (waveIndex * Math.PI * 2) / waveCount;
    return {
      get transform() {
        const phase = progress.get() * Math.PI * 2 + phaseOffset;
        const wave = Math.sin(phase) * amplitude;
        return [{ translateY: wave }, { translateX: wave * 0.5 }];
      },
      get opacity() {
        return interpolate(progress.get(), [0, 0.5, 1], [0.3, 0.6, 0.3]);
      },
    };
  };

  return {
    createWaveStyle,
    progress,
  };
}
