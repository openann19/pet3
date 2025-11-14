'use client';

import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import type { MotionStyle, MotionValue } from 'framer-motion';
import { convertReanimatedStyleToCSS } from '@/effects/framer-motion/utils/style-converter';

// Accept any style object that could come from useAnimatedStyle or be used as CSS
// Using a permissive type since we convert to CSS at runtime anyway
// Made compatible with MotionStyle for use with framer-motion components
// Type assertion to MotionStyle is needed where used with motion components due to transform array structure differences
export type AnimatedStyle =
  | (MotionStyle & {
      // Allow additional properties for compatibility
      [key: string]: unknown;
    })
  | {
      opacity?: number;
      transform?: Array<Record<string, number | string>>;
      backgroundColor?: string | number;
      color?: string | number;
      height?: string | number;
      width?: string | number;
      [key: string]: unknown;
    }
  | (() => (MotionStyle & { [key: string]: unknown }) | {
      opacity?: number;
      transform?: Array<Record<string, number | string>>;
      backgroundColor?: string | number;
      color?: string | number;
      height?: string | number;
      width?: string | number;
      [key: string]: unknown;
    })
  | undefined;

/**
 * Type guard to check if a value is a MotionStyle-compatible object
 */
function isMotionStyleCompatible(value: unknown): value is MotionStyle {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    !(value instanceof Function)
  );
}

/**
 * Converts AnimatedStyle to MotionStyle, handling function styles
 * This is a type-safe way to convert AnimatedStyle for use with motion components
 */
export function toMotionStyle(animatedStyle: AnimatedStyle): MotionStyle | undefined {
  if (!animatedStyle) {
    return undefined;
  }
  
  if (typeof animatedStyle === 'function') {
    const result = animatedStyle();
    // Type assertion needed due to transform array structure differences
    return result as MotionStyle;
  }
  
  // Type assertion needed due to transform array structure differences
  return animatedStyle as MotionStyle;
}

/**
 * Converts react-native-reanimated style objects or framer-motion MotionValues to CSS properties
 * for use with framer-motion components
 */
export function useAnimatedStyleValue(animatedStyle: AnimatedStyle | CSSProperties): CSSProperties {
  const [style, setStyle] = useState<CSSProperties>({});

  useEffect(() => {
    if (!animatedStyle) {
      setStyle({});
      return undefined;
    }

    const updateStyle = () => {
      try {
        let styleValue: unknown;
        if (typeof animatedStyle === 'function') {
          styleValue = animatedStyle();
        } else {
          styleValue = animatedStyle;
        }
        if (styleValue && typeof styleValue === 'object' && !Array.isArray(styleValue)) {
          const styleObj = styleValue as Record<string, unknown>;
          
          // Check if this is a framer-motion MotionValue object (e.g., { scale: MotionValue })
          const hasMotionValues = Object.values(styleObj).some(
            (val) => val && typeof val === 'object' && 'get' in val && typeof (val as MotionValue).get === 'function'
          );
          
          if (hasMotionValues) {
            // Handle framer-motion MotionValues
            const motionStyle: Record<string, unknown> = {};
            for (const [key, value] of Object.entries(styleObj)) {
              if (value && typeof value === 'object' && 'get' in value && typeof (value as MotionValue).get === 'function') {
                motionStyle[key] = (value as MotionValue<number>).get();
              } else {
                motionStyle[key] = value;
              }
            }
            setStyle(motionStyle as CSSProperties);
            return;
          }
          
          try {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const cssStyle = convertReanimatedStyleToCSS(styleObj as Parameters<typeof convertReanimatedStyleToCSS>[0]);
            if (cssStyle && typeof cssStyle === 'object' && !Array.isArray(cssStyle)) {
              setStyle(cssStyle as CSSProperties);
            } else {
              setStyle({});
            }
          } catch {
            setStyle({});
          }
        } else {
          setStyle({});
        }
      } catch {
        setStyle({});
      }
    };

    updateStyle();

    // For dynamic styles (functions or MotionValues), update on animation frame
    if (typeof animatedStyle === 'function' || 
        (animatedStyle && typeof animatedStyle === 'object' && 
         Object.values(animatedStyle).some(
           (val) => val && typeof val === 'object' && 'get' in val && typeof (val as MotionValue).get === 'function'
         ))) {
      const rafId = requestAnimationFrame(updateStyle);
      return () => cancelAnimationFrame(rafId);
    }
    return undefined;
  }, [animatedStyle]);

  return style;
}

// Re-export AnimatedView for convenience
export { AnimatedView } from '@/effects/reanimated/animated-view';

