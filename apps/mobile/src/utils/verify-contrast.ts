/**
 * Contrast Verification Script
 * 
 * Verifies WCAG AA compliance for the mobile app color scheme
 * Run this to check if all color combinations meet accessibility standards
 * 
 * Location: apps/mobile/src/utils/verify-contrast.ts
 */

import { colors } from '@mobile/theme/colors'
import { getContrastRatio, meetsWCAGAA, meetsWCAGAALarge } from './color-contrast'

/**
 * Color combinations to verify
 */
const textCombinations = [
  { foreground: colors.textPrimary, background: colors.background, name: 'Primary text on background' },
  { foreground: colors.textPrimary, background: colors.card, name: 'Primary text on card' },
  { foreground: colors.textPrimary, background: colors.surface, name: 'Primary text on surface' },
  { foreground: colors.textSecondary, background: colors.background, name: 'Secondary text on background' },
  { foreground: colors.textSecondary, background: colors.card, name: 'Secondary text on card' },
  { foreground: colors.textSecondary, background: colors.surface, name: 'Secondary text on surface' },
  { foreground: colors.primary, background: colors.background, name: 'Primary color on background' },
  { foreground: colors.primary, background: colors.card, name: 'Primary color on card' },
  { foreground: colors.accent, background: colors.background, name: 'Accent on background' },
  { foreground: colors.accent, background: colors.card, name: 'Accent on card' },
  { foreground: colors.success, background: colors.background, name: 'Success on background' },
  { foreground: colors.success, background: colors.card, name: 'Success on card' },
  { foreground: colors.danger, background: colors.background, name: 'Danger on background' },
  { foreground: colors.danger, background: colors.card, name: 'Danger on card' },
  { foreground: colors.warning, background: colors.background, name: 'Warning on background' },
  { foreground: colors.warning, background: colors.card, name: 'Warning on card' },
]

/**
 * Verify all color combinations
 * Returns a report of compliance
 */
export function verifyContrast(): {
  passed: number
  failed: number
  results: Array<{
    name: string
    ratio: number
    meetsAA: boolean
    meetsAALarge: boolean
  }>
} {
  const results = textCombinations.map(({ foreground, background, name }) => {
    const ratio = getContrastRatio(foreground, background)
    const meetsAA = meetsWCAGAA(foreground, background)
    const meetsAALarge = meetsWCAGAALarge(foreground, background)

    return {
      name,
      ratio,
      meetsAA,
      meetsAALarge,
    }
  })

  const passed = results.filter((r) => r.meetsAA).length
  const failed = results.length - passed

  return {
    passed,
    failed,
    results,
  }
}

/**
 * Log contrast verification results
 * Use this in development to check color compliance
 */
export function logContrastReport(): void {
  const report = verifyContrast()

  // eslint-disable-next-line no-console
  console.log('\n=== Color Contrast Verification Report ===\n')
  // eslint-disable-next-line no-console
  console.log(`Total combinations: ${report.results.length}`)
  // eslint-disable-next-line no-console
  console.log(`Passed (WCAG AA): ${report.passed}`)
  // eslint-disable-next-line no-console
  console.log(`Failed: ${report.failed}\n`)

  report.results.forEach((result) => {
    const status = result.meetsAA ? '✅' : '❌'
    const statusLarge = result.meetsAALarge ? '✅' : '❌'
    // eslint-disable-next-line no-console
    console.log(
      `${status} ${result.name}: ${result.ratio.toFixed(2)}:1 (AA: ${statusLarge}, AA Large: ${statusLarge})`
    )
  })

  // eslint-disable-next-line no-console
  console.log('\n==========================================\n')
}

