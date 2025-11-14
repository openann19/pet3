'use client';

import type { CSSProperties } from 'react';

/**
 * Reanimated-style transform object
 */
export interface ReanimatedTransform {
  scale?: number;
  translateX?: number;
  translateY?: number;
  rotate?: number;
  rotateX?: number;
  rotateY?: number;
  rotateZ?: number;
}

/**
 * Reanimated-style animated style
 */
export interface ReanimatedStyle {
  opacity?: number;
  transform?: Array<ReanimatedTransform>;
  backgroundColor?: string;
  color?: string;
  width?: number | string;
  height?: number | string;
  [key: string]: unknown;
}

/**
 * Convert Reanimated style to CSS properties
 * Replacement for @petspark/motion's convertReanimatedStyleToCSS
 */
export function convertReanimatedStyleToCSS(
  style: ReanimatedStyle | (() => ReanimatedStyle)
): CSSProperties {
  const styleValue = typeof style === 'function' ? style() : style;

  const css: CSSProperties = {};

  if (styleValue.opacity !== undefined) {
    css.opacity = styleValue.opacity;
  }

  if (styleValue.backgroundColor !== undefined) {
    css.backgroundColor = String(styleValue.backgroundColor);
  }

  if (styleValue.color !== undefined) {
    css.color = String(styleValue.color);
  }

  if (styleValue.width !== undefined) {
    css.width = typeof styleValue.width === 'number' ? `${styleValue.width}px` : styleValue.width;
  }

  if (styleValue.height !== undefined) {
    css.height = typeof styleValue.height === 'number' ? `${styleValue.height}px` : styleValue.height;
  }

  if (styleValue.transform && Array.isArray(styleValue.transform)) {
    const transforms: string[] = [];
    
    for (const transform of styleValue.transform) {
      if (transform.scale !== undefined) {
        transforms.push(`scale(${transform.scale})`);
      }
      if (transform.translateX !== undefined) {
        transforms.push(`translateX(${transform.translateX}px)`);
      }
      if (transform.translateY !== undefined) {
        transforms.push(`translateY(${transform.translateY}px)`);
      }
      if (transform.rotate !== undefined) {
        transforms.push(`rotate(${transform.rotate}deg)`);
      }
      if (transform.rotateX !== undefined) {
        transforms.push(`rotateX(${transform.rotateX}deg)`);
      }
      if (transform.rotateY !== undefined) {
        transforms.push(`rotateY(${transform.rotateY}deg)`);
      }
      if (transform.rotateZ !== undefined) {
        transforms.push(`rotateZ(${transform.rotateZ}deg)`);
      }
    }
    
    if (transforms.length > 0) {
      css.transform = transforms.join(' ');
    }
  }

  // Copy other properties
  for (const [key, value] of Object.entries(styleValue)) {
    if (!['opacity', 'transform', 'backgroundColor', 'color', 'width', 'height'].includes(key)) {
      css[key as keyof CSSProperties] = value as string | number;
    }
  }

  return css;
}

