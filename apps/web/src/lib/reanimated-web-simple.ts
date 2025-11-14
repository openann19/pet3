/**
 * Simplified Web polyfill for react-native-reanimated
 * Uses CSS transitions for smooth animations on web
 */

import type { CSSProperties } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';

// Type definitions
export interface SharedValue<T = number> {
  value: T;
}

export type AnimatedStyle<T = CSSProperties> = T;

export interface WithSpringConfig {
  damping?: number;
  stiffness?: number;
  mass?: number;
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
  ease: (t: number) => t,
  quad: (t: number) => t * t,
  cubic: (t: number) => t * t * t,
  bezier: () => (t: number) => t,
  inOut: (easing: (t: number) => number) => easing,
  out: (easing: (t: number) => number) => easing,
  in: (easing: (t: number) => number) => easing,
  elastic: () => (t: number) => t,
};

// Global registry to track SharedValue updates
const sharedValueListeners = new Map<SharedValue<any>, Set<() => void>>();

// Shared value implementation
export function useSharedValue<T>(initialValue: T): SharedValue<T> {
  const [, forceUpdate] = useState({});
  const valueRef = useRef<T>(initialValue);
  const sharedValueRef = useRef<SharedValue<T>>();

  if (!sharedValueRef.current) {
    const sv: SharedValue<T> = {
      get value() {
        return valueRef.current;
      },
      set value(newValue: T) {
        if (valueRef.current !== newValue) {
          valueRef.current = newValue;
          // Notify all listeners
          const listeners = sharedValueListeners.get(sv);
          if (listeners) {
            listeners.forEach(listener => listener());
          }
        }
      },
    };
    sharedValueRef.current = sv;
    sharedValueListeners.set(sv, new Set());
  }

  return sharedValueRef.current;
}

// Animation functions - just return target value
export function withSpring(toValue: number, _config?: WithSpringConfig): number {
  return toValue;
}

export function withTiming(toValue: number, _config?: WithTimingConfig): number {
  return toValue;
}

export function withDelay(_delayMs: number, animation: number): number {
  return animation;
}

export function withSequence(...animations: number[]): number {
  return animations[animations.length - 1] ?? 0;
}

export function withRepeat(animation: number): number {
  return animation;
}

export function withDecay(): number {
  return 0;
}

// Interpolation
export function interpolate(
  value: number,
  inputRange: number[],
  outputRange: number[]
): number {
  if (inputRange.length !== outputRange.length || inputRange.length === 0) {
    return 0;
  }

  // Find the right segment
  for (let i = 0; i < inputRange.length - 1; i++) {
    const inputMin = inputRange[i]!;
    const inputMax = inputRange[i + 1]!;

    if (value >= inputMin && value <= inputMax) {
      const outputMin = outputRange[i]!;
      const outputMax = outputRange[i + 1]!;
      const progress = (value - inputMin) / (inputMax - inputMin);
      return outputMin + progress * (outputMax - outputMin);
    }
  }

  // Clamp to edges
  if (value <= inputRange[0]!) return outputRange[0]!;
  return outputRange[outputRange.length - 1]!;
}

export function interpolateColor(
  _value: number,
  _inputRange: number[],
  outputRange: string[]
): string {
  return outputRange[0] ?? '#000';
}

// Animated style hook - with CSS transitions
export function useAnimatedStyle<T extends CSSProperties>(
  updater: () => T,
  deps?: unknown[]
): AnimatedStyle<T> {
  const [, forceUpdate] = useState({});
  const updaterRef = useRef(updater);
  updaterRef.current = updater;

  // Track which SharedValues are accessed during style computation
  const trackedValuesRef = useRef<Set<SharedValue<any>>>(new Set());

  useEffect(() => {
    // Subscribe to all accessed SharedValues
    const listener = () => forceUpdate({});

    trackedValuesRef.current.forEach(sv => {
      const listeners = sharedValueListeners.get(sv);
      if (listeners) {
        listeners.add(listener);
      }
    });

    return () => {
      // Cleanup listeners
      trackedValuesRef.current.forEach(sv => {
        const listeners = sharedValueListeners.get(sv);
        if (listeners) {
          listeners.delete(listener);
        }
      });
    };
  }, deps ?? []);

  // Compute style and track accessed values
  const style = useMemo(() => {
    trackedValuesRef.current.clear();
    return updaterRef.current();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forceUpdate, ...(deps ?? [])]);

  // Convert transform array to CSS string
  const processedStyle = useMemo(() => {
    if (style.transform && Array.isArray(style.transform)) {
      const transforms = style.transform as Record<string, number | string>[];
      const transformString = transforms
        .map((t) => {
          const key = Object.keys(t)[0];
          if (!key) return '';
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
        transition: 'all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
        willChange: 'transform, opacity',
      } as T;
    }

    return {
      ...style,
      transition: 'all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)',
    } as T;
  }, [style]);

  return processedStyle as AnimatedStyle<T>;
}

// Other hooks - no-ops for web
export function useAnimatedProps<T>(updater: () => T, deps?: unknown[]): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => updater(), deps ?? []);
}

export function useDerivedValue<T>(updater: () => T): SharedValue<T> {
  const [value, setValue] = useState<T>(() => updater());

  useEffect(() => {
    setValue(updater());
  }, [updater]);

  return useMemo(() => ({
    get value() {
      return value;
    },
    set value(newValue: T) {
      setValue(newValue);
    },
  }), [value]) as SharedValue<T>;
}

export function useAnimatedReaction<T>(
  _prepare: () => T,
  _react: (result: T) => void
): void {
  // No-op for web
}

export function useAnimatedGestureHandler<T>(handlers: T): T {
  return handlers;
}

export function useAnimatedRef<T>(): { current: T | null } {
  return useRef<T>(null);
}

export function cancelAnimation(_sharedValue: SharedValue<unknown>): void {
  // No-op for web
}

export function runOnJS<T extends (...args: any[]) => any>(fn: T): T {
  return fn;
}

export function runOnUI<T extends (...args: any[]) => any>(fn: T): T {
  return fn;
}

// Animated components
const Animated = {
  View: 'div',
  Text: 'span',
  ScrollView: 'div',
  Image: 'img',
  FlatList: 'div',
};

export default Animated;
