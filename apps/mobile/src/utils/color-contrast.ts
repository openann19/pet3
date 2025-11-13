/**
 * Color Contrast Utilities
 * 
 * Utilities for checking WCAG AA contrast compliance (4.5:1 for normal text, 3:1 for large text)
 * Location: apps/mobile/src/utils/color-contrast.ts
 */

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: Number.parseInt(result[1] ?? '0', 16),
        g: Number.parseInt(result[2] ?? '0', 16),
        b: Number.parseInt(result[3] ?? '0', 16),
      }
    : null
}

/**
 * Calculate relative luminance according to WCAG
 */
function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((val) => {
    const v = val / 255
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

/**
 * Calculate contrast ratio between two colors
 * Returns a value between 1 (no contrast) and 21 (maximum contrast)
 */
export function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1)
  const rgb2 = hexToRgb(color2)

  if (!rgb1 || !rgb2) {
    return 1 // Invalid colors, assume no contrast
  }

  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b)
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b)

  const lighter = Math.max(lum1, lum2)
  const darker = Math.min(lum1, lum2)

  return (lighter + 0.05) / (darker + 0.05)
}

/**
 * Check if contrast meets WCAG AA standard for normal text (4.5:1)
 */
export function meetsWCAGAA(foreground: string, background: string): boolean {
  return getContrastRatio(foreground, background) >= 4.5
}

/**
 * Check if contrast meets WCAG AA standard for large text (3:1)
 */
export function meetsWCAGAALarge(foreground: string, background: string): boolean {
  return getContrastRatio(foreground, background) >= 3
}

/**
 * Check if contrast meets WCAG AAA standard for normal text (7:1)
 */
export function meetsWCAGAAA(foreground: string, background: string): boolean {
  return getContrastRatio(foreground, background) >= 7
}

/**
 * Get contrast ratio as a formatted string
 */
export function getContrastRatioString(color1: string, color2: string): string {
  const ratio = getContrastRatio(color1, color2)
  return `${ratio.toFixed(2)}:1`
}

