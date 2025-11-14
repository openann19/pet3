/**
 * Web polyfill for react-native-reanimated
 * Provides web-compatible implementations of reanimated APIs using standard React hooks and CSS
 */

import type { CSSProperties } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

// Type definitions
export interface SharedValue<T = number> {
  value: T;
  _animation?: Animation;
  _startValue?: number;
  _startTime?: number;
}

interface Animation {
  type: 'spring' | 'timing';
  toValue: number;
  damping?: number;
  stiffness?: number;
  mass?: number;
  velocity?: number;
  duration?: number;
  easing?: (t: number) => number;
  callback?: (finished?: boolean) => void;
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

export interface WithDecayConfig {
  velocity?: number;
  deceleration?: number;
  clamp?: [number, number];
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
  bezier: (_x1: number, y1: number, _x2: number, y2: number) => {
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
  elastic: (amplitude = 1) => {
    return (t: number) => {
      if (t === 0 || t === 1) return t;
      const p = 0.3;
      const s = p / 4;
      const result = Math.pow(2, -10 * t) * Math.sin(((t - s) * (2 * Math.PI)) / p) * amplitude + 1;
      return Math.max(0, Math.min(1, result));
    };
  },
};

// Shared value implementation with reactivity
export function useSharedValue<T>(initialValue: T): SharedValue<T> {
  const [, forceUpdate] = useState({});
  const ref = useRef<{ value: T }>({ value: initialValue });

  // Return a reactive object that triggers updates
  const sharedValue = useMemo(() => {
    const handler = {
      get(target: { value: T }, prop: string | symbol) {
        return Reflect.get(target, prop);
      },
      set(target: { value: T }, prop: string | symbol, value: any) {
        if (prop === 'value') {
          const changed = target.value !== value;
          target.value = value;
          if (changed) {
            forceUpdate({});
          }
          return true;
        }
        return Reflect.set(target, prop, value);
      },
    };
    return new Proxy(ref.current, handler);
  }, []);

  return sharedValue as SharedValue<T>;
}

// Animation functions - schedule animations to run
export function withSpring(
  toValue: number,
  config?: WithSpringConfig,
  callback?: (finished?: boolean) => void
): number {
  // Store animation metadata on the number
  (toValue as any).__animation = {
    type: 'spring',
    damping: config?.damping ?? 20,
    stiffness: config?.stiffness ?? 300,
    mass: config?.mass ?? 1,
    velocity: config?.velocity ?? 0,
    callback,
  };
  return toValue;
}

export function withTiming(
  toValue: number,
  config?: WithTimingConfig,
  callback?: (finished?: boolean) => void
): number {
  (toValue as any).__animation = {
    type: 'timing',
    duration: config?.duration ?? 300,
    easing: config?.easing ?? Easing.inOut(Easing.ease),
    callback,
  };
  return toValue;
}export function withDecay(config: WithDecayConfig): number {
  // In web polyfill, we return the current value with decay applied
  // The actual animation is handled by CSS transitions
  const { velocity = 0, deceleration = 0.998, clamp } = config;

  // Calculate final position based on velocity and deceleration
  // Simplified decay: v = v0 * (deceleration ^ t)
  // For web, we'll use a simple approximation
  let finalValue = velocity * (1 - deceleration);

  // Apply clamp if provided
  if (clamp) {
    const [min, max] = clamp;
    finalValue = Math.max(min, Math.min(max, finalValue));
  }

  return finalValue;
}

export function withDelay(_delayMs: number, animation: number): number {
  // Return the animation value, delay will be handled by CSS transition-delay
  return animation;
}

export function withSequence(...animations: number[]): number {
  // Return first animation's target, sequence will be handled by effect
  const firstAnim = animations[0];
  if (firstAnim !== undefined) {
    (firstAnim as any).__sequence = animations;
  }
  return firstAnim ?? 0;
}

export function withRepeat(animation: number, numberOfReps = -1, reverse = false): number {
  (animation as any).__repeat = { numberOfReps, reverse };
  return animation;
}

// Interpolation
export function interpolate(
  value: number,
  inputRange: number[],
  outputRange: number[],
  extrapolate?: 'clamp' | 'extend' | 'identity' | Extrapolation
): number {
  const extrapolateType = typeof extrapolate === 'string' ? extrapolate : (extrapolate ?? 'clamp');

  if (inputRange.length !== outputRange.length) {
    throw new Error('inputRange and outputRange must have the same length');
  }

  if (inputRange.length === 0 || outputRange.length === 0) {
    return 0;
  }

  // Find the right interval
  let i = 0;
  for (; i < inputRange.length - 1; i++) {
    const nextInput = inputRange[i + 1];
    if (nextInput !== undefined && value <= nextInput) {
      break;
    }
  }

  const inputMin = inputRange[i];
  const inputMax = inputRange[i + 1];
  const outputMin = outputRange[i];
  const outputMax = outputRange[i + 1];

  if (inputMin === undefined || outputMin === undefined) {
    return 0;
  }

  if (value < inputMin) {
    if (extrapolateType === 'clamp') {
      return outputMin;
    } else if (extrapolateType === 'identity') {
      return value;
    }
  }

  if (inputMax !== undefined && value > inputMax) {
    if (extrapolateType === 'clamp' && outputMax !== undefined) {
      return outputMax;
    } else if (extrapolateType === 'identity') {
      return value;
    }
  }

  const effectiveInputMax = inputMax ?? inputMin;
  const effectiveOutputMax = outputMax ?? outputMin;
  const progress = (value - inputMin) / (effectiveInputMax - inputMin);
  return outputMin + progress * (effectiveOutputMax - outputMin);
}

export function interpolateColor(
  value: number,
  _inputRange: number[],
  outputRange: string[]
): string {
  // Simplified color interpolation
  const index = Math.min(Math.floor(value), outputRange.length - 1);
  const color = outputRange[Math.max(0, index)];
  if (color !== undefined) {
    return color;
  }
  const firstColor = outputRange[0];
  return firstColor ?? '#000';
}

// Animated style hook with proper animation support
export function useAnimatedStyle<T extends CSSProperties>(
  updater: () => T,
  dependencies?: unknown[]
): AnimatedStyle<T> {
  const [, forceUpdate] = useState({});
  const frameRef = useRef<number>();

  // Track style and re-compute on every frame
  useEffect(() => {
    const animate = () => {
      forceUpdate({});
      frameRef.current = requestAnimationFrame(animate);
    };
    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current !== undefined) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, dependencies ?? []);

  const style = useMemo(() => {
    const computed = updater();

    // Convert transform array to CSS transform string
    if (computed.transform && Array.isArray(computed.transform)) {
      const transforms = computed.transform as Record<string, number | string>[];
      const transformString = transforms
        .map((t) => {
          const key = Object.keys(t)[0];
          if (key === undefined) return '';
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
        ...computed,
        transform: transformString,
      } as T;
    }

    return computed;
  }, [updater, forceUpdate]);

  return style as AnimatedStyle<T>;
}// Animated props hook
export function useAnimatedProps<T>(updater: () => T, dependencies?: unknown[]): T {
  return useMemo(() => updater(), dependencies ?? []);
}

// Gesture handlers (no-op for web)
export function useAnimatedGestureHandler<T = unknown>(handlers: T): T {
  return handlers;
}

// Scroll handlers (no-op for web)
export function useAnimatedScrollHandler<T = unknown>(handler: T): T {
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
  return useCallback(fn, deps ?? []);
}

// Derived value
export function useDerivedValue<T>(updater: () => T, dependencies?: unknown[]): SharedValue<T> {
  const value = useMemo(() => updater(), dependencies ?? []);
  return useSharedValue(value);
}

// Animated reaction (triggers a callback when a value changes)
export function useAnimatedReaction<T>(
  prepare: () => T,
  react: (prepareResult: T, previousPrepareResult: T | null) => void,
  prepareDeps?: unknown[]
): void {
  const previousValueRef = useRef<T | null>(null);

  useEffect(() => {
    const currentValue = prepare();
    if (previousValueRef.current !== currentValue) {
      react(currentValue, previousValueRef.current);
      previousValueRef.current = currentValue;
    }
  }, [prepare, react, ...(prepareDeps ?? [])]);
}

// Animated ref (returns a ref that can be used with animated components)
export function useAnimatedRef<T = unknown>(): { current: T | null } {
  return useRef<T>(null);
}

// Animation cancellation
export function cancelAnimation(_sharedValue: SharedValue<unknown>): void {
  // No-op for web polyfill
}

// Clock (no-op for web, not needed)
export function useClock(): SharedValue<number> {
  return useSharedValue(Date.now());
}

// Default export for Animated namespace
const Animated = {
  View: 'div',
  Text: 'span',
  ScrollView: 'div',
  Image: 'img',
  FlatList: 'div',
};

export default Animated;
