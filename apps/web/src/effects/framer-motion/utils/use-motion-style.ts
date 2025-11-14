'use client';

import { type MotionValue } from 'framer-motion';
import { useState, useEffect } from 'react';
import type { CSSProperties } from 'react';

/**
 * Creates a reactive style object that updates when motion values change
 * Replacement for useAnimatedStyle that works with framer-motion MotionValues
 */
export function useMotionStyle(
  styleFactory: () => {
    opacity?: number | MotionValue<number>;
    scale?: number | MotionValue<number>;
    y?: number | MotionValue<number>;
    x?: number | MotionValue<number>;
    rotate?: number | string | MotionValue<number>;
    transform?: Array<Record<string, number | string | MotionValue<number>>>;
    backgroundColor?: string | number | MotionValue<string | number>;
    color?: string | number | MotionValue<string | number>;
    width?: number | string | MotionValue<number | string>;
    height?: number | string | MotionValue<number | string>;
    [key: string]: unknown;
  } | CSSProperties
): CSSProperties {
  const [style, setStyle] = useState<CSSProperties>(() => {
    try {
      const computed = styleFactory();
      return convertToCSS(computed);
    } catch {
      return {};
    }
  });

  // Subscribe to updates via animation frame
  useEffect(() => {
    const updateStyle = () => {
      try {
        const computed = styleFactory();
        setStyle(convertToCSS(computed));
      } catch {
        // Ignore errors
      }
    };

    // Initial update
    updateStyle();

    // Set up animation frame loop for reactive updates
    let rafId: number;
    let isActive = true;
    
    const loop = () => {
      if (!isActive) return;
      updateStyle();
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);

    return () => {
      isActive = false;
      cancelAnimationFrame(rafId);
    };
  }, [styleFactory]);

  return style;
}

/**
 * Convert style object with motion values to CSS properties
 */
function convertToCSS(
  style: {
    opacity?: number | MotionValue<number>;
    scale?: number | MotionValue<number>;
    y?: number | MotionValue<number>;
    x?: number | MotionValue<number>;
    rotate?: number | string | MotionValue<number>;
    transform?: Array<Record<string, number | string | MotionValue<number>>>;
    backgroundColor?: string | number | MotionValue<string | number>;
    color?: string | number | MotionValue<string | number>;
    width?: number | string | MotionValue<number | string>;
    height?: number | string | MotionValue<number | string>;
    [key: string]: unknown;
  } | CSSProperties
): CSSProperties {
  if (!style || typeof style !== 'object') {
    return {};
  }

  // If it's already CSSProperties (no transform array), return as-is
  if ('opacity' in style && typeof style.opacity === 'number' && !('transform' in style && Array.isArray(style.transform))) {
    return style as CSSProperties;
  }

  const css: CSSProperties = {};

  // Handle opacity
  if ('opacity' in style) {
    const opacity = style.opacity;
    if (opacity instanceof Object && 'get' in opacity) {
      css.opacity = (opacity as MotionValue<number>).get();
    } else if (typeof opacity === 'number') {
      css.opacity = opacity;
    }
  }

  // Handle transform properties (scale, y, x, rotate) - convert to transform string
  const transformParts: string[] = [];
  
  if ('scale' in style) {
    const scale = style.scale;
    const scaleVal = scale instanceof Object && 'get' in scale 
      ? (scale as MotionValue<number>).get()
      : typeof scale === 'number' ? scale : 1;
    transformParts.push(`scale(${scaleVal})`);
  }
  
  if ('x' in style) {
    const x = style.x;
    const xVal = x instanceof Object && 'get' in x
      ? (x as MotionValue<number>).get()
      : typeof x === 'number' ? x : 0;
    transformParts.push(`translateX(${xVal}px)`);
  }
  
  if ('y' in style) {
    const y = style.y;
    const yVal = y instanceof Object && 'get' in y
      ? (y as MotionValue<number>).get()
      : typeof y === 'number' ? y : 0;
    transformParts.push(`translateY(${yVal}px)`);
  }
  
  if ('rotate' in style) {
    const rotate = style.rotate;
    const rotateVal = rotate instanceof Object && 'get' in rotate
      ? (rotate as MotionValue<number>).get()
      : rotate ?? 0;
    const suffix = typeof rotateVal === 'number' ? 'deg' : '';
    transformParts.push(`rotate(${rotateVal}${suffix})`);
  }

  // Handle transform array (legacy format)
  if ('transform' in style && Array.isArray(style.transform)) {
    const transforms = style.transform
      .map((t) => {
        if (!t || typeof t !== 'object') return null;
        const parts: string[] = [];
        for (const [key, val] of Object.entries(t)) {
          if (val === undefined) continue;
          let value: number | string;
          if (val instanceof Object && 'get' in val) {
            value = (val as MotionValue<number>).get();
          } else {
            value = val as number | string;
          }
          // Convert transform keys to CSS transform functions
          if (key === 'scale') {
            parts.push(`scale(${value})`);
          } else if (key === 'translateX') {
            parts.push(`translateX(${value}px)`);
          } else if (key === 'translateY') {
            parts.push(`translateY(${value}px)`);
          } else if (key === 'translateZ') {
            parts.push(`translateZ(${value})`);
          } else if (key === 'rotate') {
            parts.push(`rotate(${value})`);
          } else if (key === 'rotateX') {
            parts.push(`rotateX(${value})`);
          } else if (key === 'rotateY') {
            parts.push(`rotateY(${value})`);
          } else if (key === 'perspective') {
            parts.push(`perspective(${value}px)`);
          }
        }
        return parts.length > 0 ? parts.join(' ') : null;
      })
      .filter((t): t is string => t !== null);
    
    if (transforms.length > 0) {
      transformParts.push(...transforms);
    }
  }
  
  // Combine all transform parts
  if (transformParts.length > 0) {
    css.transform = transformParts.join(' ');
  }

  // Handle other properties
  for (const [key, val] of Object.entries(style)) {
    if (!['opacity', 'transform', 'scale', 'x', 'y', 'rotate'].includes(key)) {
      if (val instanceof Object && 'get' in val) {
        css[key as keyof CSSProperties] = (val as MotionValue<unknown>).get() as never;
      } else if (val !== undefined && val !== null) {
        css[key as keyof CSSProperties] = val as never;
      }
    }
  }

  return css;
}
