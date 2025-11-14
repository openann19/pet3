'use client';

import { useMotionValue, animate, type MotionValue } from 'framer-motion';
import { useEffect } from 'react';
import { springConfigs } from '@/effects/reanimated/transitions';
import type { CSSProperties } from 'react';

export interface UseHeaderButtonAnimationOptions {
  delay?: number;
  scale?: number;
  translateY?: number;
  rotation?: number;
}

export interface UseHeaderButtonAnimationReturn {
  opacity: MotionValue<number>;
  scale: MotionValue<number>;
  translateY: MotionValue<number>;
  rotation: MotionValue<number>;
  hoverScale: MotionValue<number>;
  hoverY: MotionValue<number>;
  hoverRotation: MotionValue<number>;
  buttonStyle: CSSProperties;
  handleEnter: () => void;
  handleLeave: () => void;
  handleTap: () => void;
}

export function useHeaderButtonAnimation(
  options: UseHeaderButtonAnimationOptions = {}
): UseHeaderButtonAnimationReturn {
  const {
    delay = 0,
    scale: hoverScaleValue = 1.12,
    translateY: hoverYValue = -3,
    rotation: hoverRotationValue = -5,
  } = options;

  const opacity = useMotionValue(0);
  const scale = useMotionValue(0.8);
  const translateY = useMotionValue(0);
  const rotation = useMotionValue(0);
  const hoverScale = useMotionValue(1);
  const hoverY = useMotionValue(0);
  const hoverRotation = useMotionValue(0);

  useEffect(() => {
    const delayMs = delay;
    animate(opacity, 1, {
      delay: delayMs,
      duration: 0.4,
      ease: 'easeOut',
    });
    animate(scale, 1, {
      delay: delayMs,
      type: 'spring',
      damping: springConfigs.smooth.damping,
      stiffness: springConfigs.smooth.stiffness,
    });
  }, [delay, opacity, scale]);

  const handleEnter = () => {
    animate(hoverScale, hoverScaleValue, {
      type: 'spring',
      damping: springConfigs.smooth.damping,
      stiffness: springConfigs.smooth.stiffness,
    });
    animate(hoverY, hoverYValue, {
      type: 'spring',
      damping: springConfigs.smooth.damping,
      stiffness: springConfigs.smooth.stiffness,
    });
    animate(hoverRotation, hoverRotationValue, {
      type: 'spring',
      damping: springConfigs.smooth.damping,
      stiffness: springConfigs.smooth.stiffness,
    });
  };

  const handleLeave = () => {
    animate(hoverScale, 1, {
      type: 'spring',
      damping: springConfigs.smooth.damping,
      stiffness: springConfigs.smooth.stiffness,
    });
    animate(hoverY, 0, {
      type: 'spring',
      damping: springConfigs.smooth.damping,
      stiffness: springConfigs.smooth.stiffness,
    });
    animate(hoverRotation, 0, {
      type: 'spring',
      damping: springConfigs.smooth.damping,
      stiffness: springConfigs.smooth.stiffness,
    });
  };

  const handleTap = () => {
    animate(hoverScale, 0.9, {
      type: 'spring',
      damping: springConfigs.smooth.damping,
      stiffness: springConfigs.smooth.stiffness,
    }).then(() => {
      animate(hoverScale, 1, {
        type: 'spring',
        damping: springConfigs.smooth.damping,
        stiffness: springConfigs.smooth.stiffness,
      });
    });
  };

  return {
    opacity,
    scale,
    translateY,
    rotation,
    hoverScale,
    hoverY,
    hoverRotation,
    buttonStyle: {
      opacity: opacity.get(),
      transform: `scale(${scale.get() * hoverScale.get()}) translateY(${translateY.get() + hoverY.get()}px) rotate(${rotation.get() + hoverRotation.get()}deg)`,
    },
    handleEnter,
    handleLeave,
    handleTap,
  };
}
