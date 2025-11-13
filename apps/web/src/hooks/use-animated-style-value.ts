'use client';

import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { convertReanimatedStyleToCSS } from '@petspark/motion';

// Accept any style object that could come from useAnimatedStyle or be used as CSS
// Using a permissive type since we convert to CSS at runtime anyway
export type AnimatedStyle =
  | {
      // Match React Native style properties that useAnimatedStyle might return
      opacity?: number;
      transform?: Record<string, number | string>[];
      backgroundColor?: string | number;
      color?: string | number;
      height?: number | string;
      width?: number | string;
    } & Record<string, unknown>
  | (() => {
      opacity?: number;
      transform?: Record<string, number | string>[];
      backgroundColor?: string | number;
      color?: string | number;
      height?: number | string;
      width?: number | string;
    } & Record<string, unknown>)
  | (() => Record<string, unknown>)
  | ((...args: unknown[]) => Record<string, unknown>)
  | Record<string, unknown>
  | undefined;

/**
 * Converts react-native-reanimated style objects to CSS properties
 * for use with framer-motion components
 */
export function useAnimatedStyleValue(animatedStyle: AnimatedStyle): CSSProperties {
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

    // For dynamic styles (functions), update on animation frame
    if (typeof animatedStyle === 'function') {
      const rafId = requestAnimationFrame(updateStyle);
      return () => cancelAnimationFrame(rafId);
    }
    return undefined;
  }, [animatedStyle]);

  return style;
}

// Re-export AnimatedView for convenience
export { AnimatedView } from '@/effects/reanimated/animated-view';

