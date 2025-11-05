/**
 * Unit Tests for Haptic Manager
 * 
 * Location: apps/mobile/src/__tests__/effects/chat/core/haptic-manager.test.ts
 */

import * as Haptics from 'expo-haptics'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getHapticManager, triggerHaptic } from '../../../../effects/chat/core/haptic-manager'

// Mock expo-haptics
vi.mock('expo-haptics', () => ({
  impactAsync: vi.fn(),
  notificationAsync: vi.fn(),
  ImpactFeedbackStyle: {
    Light: 0,
    Medium: 1,
    Heavy: 2,
  },
  NotificationFeedbackType: {
    Success: 0,
    Warning: 1,
    Error: 2,
  },
}))

describe('Haptic Manager', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    const manager = getHapticManager()
    manager.resetCooldown()
  })

  describe('trigger', () => {
    it('should trigger light haptic', () => {
      triggerHaptic('light')
      expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Light)
    })

    it('should trigger medium haptic', () => {
      triggerHaptic('medium')
      expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Medium)
    })

    it('should trigger success haptic', () => {
      triggerHaptic('success')
      expect(Haptics.notificationAsync).toHaveBeenCalledWith(Haptics.NotificationFeedbackType.Success)
    })

    it('should respect cooldown', () => {
      triggerHaptic('light')
      vi.clearAllMocks()
      triggerHaptic('light')
      // Should not trigger again due to cooldown
      expect(Haptics.impactAsync).not.toHaveBeenCalled()
    })

    it('should bypass cooldown when requested', () => {
      triggerHaptic('light', true)
      triggerHaptic('light', true)
      expect(Haptics.impactAsync).toHaveBeenCalledTimes(2)
    })
  })

  describe('isCooldownActive', () => {
    it('should return true immediately after trigger', () => {
      const manager = getHapticManager()
      triggerHaptic('light')
      expect(manager.isCooldownActive()).toBe(true)
    })

    it('should return false after cooldown period', async () => {
      const manager = getHapticManager()
      triggerHaptic('light')
      await new Promise((resolve) => setTimeout(resolve, 260))
      expect(manager.isCooldownActive()).toBe(false)
    })
  })
})

