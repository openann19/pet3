'use client';

import type { ReactNode, ComponentPropsWithoutRef, CSSProperties } from 'react';
import { forwardRef } from 'react';
import Animated, { useSharedValue, type AnimatedStyle as RNAnimatedStyle } from 'react-native-reanimated';

export type AnimatedStyle =
  | RNAnimatedStyle
  | CSSProperties
  | Record<string, unknown>
  | AnimatedStyle[]
  | undefined
  | null;

interface AnimatedViewProps extends Omit<ComponentPropsWithoutRef<'div'>, 'style'> {
  children?: ReactNode;
  style?: AnimatedStyle;
  layout?: boolean;
}

/**
 * AnimatedView component that uses react-native-reanimated for smooth web animations
 * Compatible with react-native-reanimated's AnimatedStyle
 *
 * Note: layout prop is supported for react-native-reanimated layout animations
 */
export const AnimatedView = forwardRef<HTMLDivElement, AnimatedViewProps>(
  ({ children, style: animatedStyle, className, layout, ...props }, ref) => {
    // Convert style array to object if needed
    const processedStyle = Array.isArray(animatedStyle)
      ? animatedStyle.reduce((acc, s) => ({ ...acc, ...s }), {})
      : animatedStyle;

    return (
      <Animated.View
        ref={ref}
        className={className}
        style={processedStyle as RNAnimatedStyle}
        {...(layout ? { layout } : {})}
        {...props}
      >
        {children}
      </Animated.View>
    );
  }
);

AnimatedView.displayName = 'AnimatedView';

/**
 * Legacy hook for compatibility
 * @deprecated Use useSharedValue from react-native-reanimated directly
 *
 * Returns a shared value for animation purposes.
 * This hook must always be called in the same order (Rules of Hooks).
 */
export function useAnimatedStyleValue<T = number | string>(initial: T) {
  return useSharedValue<T>(initial);
}
