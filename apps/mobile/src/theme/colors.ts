/**
 * Base color convenience export for mobile
 * Location: apps/mobile/src/theme/colors.ts
 */

import { allThemes, defaultThemeId } from './themes'

const base = allThemes[defaultThemeId].colors

export const colors = {
  background: base.background,
  card: base.card,
  surface: base.foreground, // slightly elevated surface vs background
  border: base.border,
  textPrimary: base.textPrimary,
  textSecondary: base.textSecondary,
  primary: base.primary,
  accent: base.accent,
  success: base.success,
  warning: base.warning,
  danger: base.danger,
} as const
