
import { useCallback, useEffect } from 'react';
import { useMotionValue, animate, type MotionValue } from 'framer-motion';
import {
  springConfigs,
  timingConfigs,
  type SpringConfig,
  type TimingConfig,
} from '@/effects/reanimated/transitions';
import type { AnimatedStyle } from '@/effects/reanimated/animated-view';

export interface VariantDefinition {
  opacity?: number;
  scale?: number;
  x?: number;
  y?: number;
  rotate?: number;
  rotateX?: number;
  rotateY?: number;
  translateX?: number;
  translateY?: number;
  backgroundColor?: string;
  color?: string;
  transition?: {
    type?: 'spring' | 'tween';
    duration?: number;
    delay?: number;
    stiffness?: number;
    damping?: number;
    mass?: number;
    ease?: string | number[];
  };
}

export type Variants = Record<string, VariantDefinition>;

export interface UseMotionVariantsOptions {
  variants?: Variants;
  initial?: string | VariantDefinition;
  animate?: string | VariantDefinition;
  exit?: string | VariantDefinition;
  transition?: VariantDefinition['transition'];
  enabled?: boolean;
}


export interface UseMotionVariantsReturn {
  opacity: MotionValue<number>;
  scale: MotionValue<number>;
  translateX: MotionValue<number>;
  translateY: MotionValue<number>;
  rotate: MotionValue<number>;
  rotateX: MotionValue<number>;
  rotateY: MotionValue<number>;
  backgroundColor: MotionValue<string>;
  color: MotionValue<string>;
  animatedStyle: AnimatedStyle;
  setVariant: (variant: string) => void;
  setCustomVariant: (variant: VariantDefinition) => void;
}


function getVariantValue(
  variants: Variants | undefined,
  key: string | VariantDefinition | undefined,
  fallback: VariantDefinition = {}
): VariantDefinition {
  if (!key) return fallback;
  if (typeof key === 'string') {
    return variants?.[key] ?? fallback;
  }
  return key;
}


// (Removed legacy applyTransition and related Reanimated code)


export function useMotionVariants(options: UseMotionVariantsOptions = {}): UseMotionVariantsReturn {
  const {
    variants = {},
    initial,
    animate: animateKey,
    exit,
    transition: defaultTransition,
    enabled = true,
  } = options;

  const initialVariant = getVariantValue(variants, initial, { opacity: 1, scale: 1 });
  const animateVariant = getVariantValue(variants, animateKey, { opacity: 1, scale: 1 });
  const exitVariant = getVariantValue(variants, exit, { opacity: 0, scale: 0.95 });

  const opacity = useMotionValue(initialVariant.opacity ?? animateVariant.opacity ?? 1);
  const scale = useMotionValue(initialVariant.scale ?? animateVariant.scale ?? 1);
  const translateX = useMotionValue(
    initialVariant.translateX ??
      initialVariant.x ??
      animateVariant.translateX ??
      animateVariant.x ??
      0
  );
  const translateY = useMotionValue(
    initialVariant.translateY ??
      initialVariant.y ??
      animateVariant.translateY ??
      animateVariant.y ??
      0
  );
  const rotate = useMotionValue(initialVariant.rotate ?? animateVariant.rotate ?? 0);
  const rotateX = useMotionValue(initialVariant.rotateX ?? animateVariant.rotateX ?? 0);
  const rotateY = useMotionValue(initialVariant.rotateY ?? animateVariant.rotateY ?? 0);
  const backgroundColor = useMotionValue(
    initialVariant.backgroundColor ?? animateVariant.backgroundColor ?? 'transparent'
  );
  const color = useMotionValue(initialVariant.color ?? animateVariant.color ?? 'inherit');

  const applyVariant = useCallback(
    (variant: VariantDefinition) => {
      if (!enabled) return;

      const transition = variant.transition ?? defaultTransition;

      if (variant.opacity !== undefined) {
        animate(opacity, variant.opacity, { duration: transition?.duration ? transition.duration / 1000 : undefined, type: transition?.type === 'spring' ? 'spring' : 'tween', ...springConfigs.smooth });
      }
      if (variant.scale !== undefined) {
        animate(scale, variant.scale, { duration: transition?.duration ? transition.duration / 1000 : undefined, type: transition?.type === 'spring' ? 'spring' : 'tween', ...springConfigs.smooth });
      }
      if (variant.translateX !== undefined || variant.x !== undefined) {
        animate(translateX, variant.translateX ?? variant.x ?? 0, { duration: transition?.duration ? transition.duration / 1000 : undefined, type: transition?.type === 'spring' ? 'spring' : 'tween', ...springConfigs.smooth });
      }
      if (variant.translateY !== undefined || variant.y !== undefined) {
        animate(translateY, variant.translateY ?? variant.y ?? 0, { duration: transition?.duration ? transition.duration / 1000 : undefined, type: transition?.type === 'spring' ? 'spring' : 'tween', ...springConfigs.smooth });
      }
      if (variant.rotate !== undefined) {
        animate(rotate, variant.rotate, { duration: transition?.duration ? transition.duration / 1000 : undefined, type: transition?.type === 'spring' ? 'spring' : 'tween', ...springConfigs.smooth });
      }
      if (variant.rotateX !== undefined) {
        animate(rotateX, variant.rotateX, { duration: transition?.duration ? transition.duration / 1000 : undefined, type: transition?.type === 'spring' ? 'spring' : 'tween', ...springConfigs.smooth });
      }
      if (variant.rotateY !== undefined) {
        animate(rotateY, variant.rotateY, { duration: transition?.duration ? transition.duration / 1000 : undefined, type: transition?.type === 'spring' ? 'spring' : 'tween', ...springConfigs.smooth });
      }
      if (variant.backgroundColor !== undefined) {
        backgroundColor.set(variant.backgroundColor);
      }
      if (variant.color !== undefined) {
        color.set(variant.color);
      }
    },
    [
      enabled,
      defaultTransition,
      opacity,
      scale,
      translateX,
      translateY,
      rotate,
      rotateX,
      rotateY,
      backgroundColor,
      color,
    ]
  );

  useEffect(() => {
    if (enabled && animateKey) {
      const variant = typeof animateKey === 'string' ? variants[animateKey] : animateKey;
      if (variant) {
        applyVariant(variant);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, animateKey, variants]);

  const setVariant = useCallback(
    (variantKey: string) => {
      const variant = variants[variantKey];
      if (variant) {
        applyVariant(variant);
      }
    },
    [variants, applyVariant]
  );

  const setCustomVariant = useCallback(
    (variant: VariantDefinition) => {
      applyVariant(variant);
    },
    [applyVariant]
  );

  const animatedStyle: AnimatedStyle = {
    opacity,
    transform: [
      { scale },
      { translateX },
      { translateY },
      { rotate },
      { rotateX },
      { rotateY },
    ],
    backgroundColor,
    color,
  };

  return {
    opacity,
    scale,
    translateX,
    translateY,
    rotate,
    rotateX,
    rotateY,
    backgroundColor,
    color,
    animatedStyle,
    setVariant,
    setCustomVariant,
  };
}
