/**
 * Unit Tests for Chat Effects Core Utilities
 * 
 * Tests for reduced motion, haptics, performance, and telemetry
 * 
 * Location: apps/mobile/src/__tests__/effects/chat/core/reduced-motion.test.ts
 */

import { AccessibilityInfo } from 'react-native'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { isReduceMotionEnabled } from '../../../../effects/chat/core/reduced-motion'

// Mock AccessibilityInfo
vi.mock('react-native', () => ({
  AccessibilityInfo: {
    isReduceMotionEnabled: vi.fn(),
    addEventListener: vi.fn(),
  },
  Platform: {
    OS: 'ios',
  },
}))

describe('Reduced Motion', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('isReduceMotionEnabled', () => {
    it('should return false when reduced motion is disabled', () => {
      ;(AccessibilityInfo.isReduceMotionEnabled as any).mockReturnValue(false)
      expect(isReduceMotionEnabled()).toBe(false)
    })

    it('should return true when reduced motion is enabled', () => {
      ;(AccessibilityInfo.isReduceMotionEnabled as any).mockReturnValue(true)
      expect(isReduceMotionEnabled()).toBe(true)
    })

    it('should return false on error', () => {
      ;(AccessibilityInfo.isReduceMotionEnabled as any).mockImplementation(() => {
        throw new Error('Test error')
      })
      expect(isReduceMotionEnabled()).toBe(false)
    })
  })
})

