/**
 * Web polyfill for react-native-reanimated
 * Provides web-compatible implementations of reanimated APIs using standard React hooks and CSS
 */

import { useRef, useCallback, useMemo } from 'react';
import type { CSSProperties } from 'react';

// Type definitions
export interface SharedValue<T = number> {
  value: T;
}

export type AnimatedStyle<T = CSSProperties> = T;

export interface WithSpringConfig {
  damping?: number;
  stiffness?: number;
  mass?: number;
  velocity?: number;
  overshootClamping?: boolean;
  restDisplacementThreshold?: number;
  restSpeedThreshold?: number;
}

export interface WithTimingConfig {
  duration?: number;
  easing?: (value: number) => number;
}

// Extrapolation enum
export enum Extrapolation {
  CLAMP = 'clamp',
  EXTEND = 'extend',
  IDENTITY = 'identity',
}

// Easing functions
export const Easing = {
  linear: (t: number) => t,
  ease: (t: number) => {
    const t2 = t * t;
    return t2 * (3 - 2 * t);
  },
  quad: (t: number) => t * t,
  cubic: (t: number) => t * t * t,
  bezier: (x1: number, y1: number, x2: number, y2: number) => {
    return (t: number) => {
      // Simplified cubic bezier
      const t2 = t * t;
      const t3 = t2 * t;
      return 3 * (1 - t) * (1 - t) * t * y1 + 3 * (1 - t) * t2 * y2 + t3;
    };
  },
  inOut: (easing: (t: number) => number) => (t: number) => {
    if (t < 0.5) {
      return easing(t * 2) / 2;
    }
    return 1 - easing((1 - t) * 2) / 2;
  },
  out: (easing: (t: number) => number) => (t: number) => 1 - easing(1 - t),
  in: (easing: (t: number) => number) => easing,
};

// Helper to convert spring config to CSS transition
function springToCSS(config: WithSpringConfig = {}): string {
  const damping = config.damping ?? 20;
  const stiffness = config.stiffness ?? 180;
  
  // Approximate spring duration based on damping and stiffness
  const duration = Math.sqrt(1 / stiffness) * 1000 * (damping / 10);
  const timing = damping < 15 ? 'ease-out' : damping < 25 ? 'ease-in-out' : 'ease-in';
  
  return `${duration}ms ${timing}`;
}

// Helper to convert timing config to CSS transition
function timingToCSS(config: WithTimingConfig = {}): string {
  const duration = config.duration ?? 300;
  return `${duration}ms ease-in-out`;
}

// Shared value implementation
export function useSharedValue<T>(initialValue: T): SharedValue<T> {
  const ref = useRef<SharedValue<T>>({
    value: initialValue,
  });
  
  return ref.current;
}

// Animation functions
export function withSpring(toValue: number, config?: WithSpringConfig): number {
  // In web polyfill, we return the target value
  // The actual animation is handled by CSS transitions
  return toValue;
}

export function withTiming(toValue: number, config?: WithTimingConfig): number {
  // In web polyfill, we return the target value
  // The actual animation is handled by CSS transitions
  return toValue;
}

export function withDelay(delayMs: number, animation: number): number {
  // Return the animation value, delay will be handled by CSS transition-delay
  return animation;
}

export function withSequence(...animations: number[]): number {
  // Return the last animation value
  return animations[animations.length - 1] ?? 0;
}

export function withRepeat(animation: number, numberOfReps?: number, reverse?: boolean): number {
  // Return the animation value
  return animation;
}

// Interpolation
export function interpolate(
  value: number,
  inputRange: number[],
  outputRange: number[],
  extrapolate?: 'clamp' | 'extend' | 'identity' | Extrapolation
): number {
  const extrapolateType = typeof extrapolate === 'string' ? extrapolate : extrapolate ?? 'clamp';
  
  if (inputRange.length !== outputRange.length) {
    throw new Error('inputRange and outputRange must have the same length');
  }
  
  // Find the right interval
  let i = 0;
  for (; i < inputRange.length - 1; i++) {
    if (value <= inputRange[i + 1]) {
      break;
    }
  }
  
  const inputMin = inputRange[i];
  const inputMax = inputRange[i + 1] ?? inputMin;
  const outputMin = outputRange[i];
  const outputMax = outputRange[i + 1] ?? outputMin;
  
  if (value < inputMin) {
    if (extrapolateType === 'clamp') {
      return outputMin;
    } else if (extrapolateType === 'identity') {
      return value;
    }
  }
  
  if (value > inputMax) {
    if (extrapolateType === 'clamp') {
      return outputMax;
    } else if (extrapolateType === 'identity') {
      return value;
    }
  }
  
  const progress = (value - inputMin) / (inputMax - inputMin);
  return outputMin + progress * (outputMax - outputMin);
}

export function interpolateColor(
  value: number,
  inputRange: number[],
  outputRange: string[]
): string {
  // Simplified color interpolation
  const index = Math.min(Math.floor(value), outputRange.length - 1);
  return outputRange[Math.max(0, index)] ?? outputRange[0] ?? '#000';
}

// Animated style hook
export function useAnimatedStyle<T extends CSSProperties>(
  updater: () => T,
  dependencies?: unknown[]
): AnimatedStyle<T> {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => {
    const style = updater();
    
    // Convert transform array to CSS transform string
    if (style.transform && Array.isArray(style.transform)) {
      const transforms = style.transform as Array<Record<string, number | string>>;
      const transformString = transforms
        .map((t) => {
          const key = Object.keys(t)[0];
          const value = t[key];
          
          if (key === 'translateX' || key === 'translateY') {
            return `${key}(${value}px)`;
          } else if (key === 'scale' || key === 'scaleX' || key === 'scaleY') {
            return `${key}(${value})`;
          } else if (key === 'rotate' || key === 'rotateX' || key === 'rotateY' || key === 'rotateZ') {
            return `${key}(${value}deg)`;
          }
          return `${key}(${value})`;
        })
        .join(' ');
      
      return {
        ...style,
        transform: transformString,
        transition: 'all 300ms ease-in-out',
      } as T;
    }
    
    return {
      ...style,
      transition: 'all 300ms ease-in-out',
    } as T;
  }, dependencies);
}

// Animated props hook
export function useAnimatedProps<T>(
  updater: () => T,
  dependencies?: unknown[]
): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => updater(), dependencies);
}

// Gesture handlers (no-op for web)
export function useAnimatedGestureHandler<T = unknown>(
  handlers: T
): T {
  return handlers;
}

// Scroll handlers (no-op for web)
export function useAnimatedScrollHandler<T = unknown>(
  handler: T
): T {
  return handler;
}

// Run on JS thread
export function runOnJS<T extends (...args: unknown[]) => unknown>(fn: T): T {
  return fn;
}

// Run on UI thread (no-op for web)
export function runOnUI<T extends (...args: unknown[]) => unknown>(fn: T): T {
  return fn;
}

// Worklets (no-op for web)
export function useWorkletCallback<T extends (...args: unknown[]) => unknown>(
  fn: T,
  deps?: unknown[]
): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useCallback(fn, deps ?? []);
}

// Derived value
export function useDerivedValue<T>(
  updater: () => T,
  dependencies?: unknown[]
): SharedValue<T> {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const value = useMemo(() => updater(), dependencies);
  return useSharedValue(value);
}

// Animation cancellation
export function cancelAnimation(sharedValue: SharedValue<unknown>): void {
  // No-op for web polyfill
}

// Clock (no-op for web, not needed)
export function useClock(): SharedValue<number> {
  return useSharedValue(Date.now());
}
