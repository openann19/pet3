/**
 * Haptic Manager for Chat Effects
 * 
 * Manages haptic feedback with cooldown (≥250ms) and respect for reduced motion.
 * Prevents haptic spam and ensures consistent tactile feedback.
 * 
 * Location: apps/mobile/src/effects/chat/core/haptic-manager.ts
 */

import * as Haptics from 'expo-haptics'
import { createLogger } from '../../../utils/logger'
import { isReduceMotionEnabled } from './reduced-motion'

const logger = createLogger('haptic-manager')

/**
 * Haptic feedback types supported by the manager
 */
export type HapticType = 'selection' | 'light' | 'medium' | 'success'

/**
 * Haptic Manager with cooldown enforcement
 * 
 * Ensures haptics are not triggered more frequently than 250ms apart.
 * Respects reduced motion preference (no haptics if enabled).
 */
export class HapticManager {
  private lastTriggerTime: number = 0
  private readonly cooldownMs: number = 250
  private reducedMotionEnabled: boolean = false

  constructor() {
    // Check reduced motion preference on initialization
    this.updateReducedMotionPreference()
  }

  /**
   * Update reduced motion preference (call when preference changes)
   */
  updateReducedMotionPreference(): void {
    this.reducedMotionEnabled = isReduceMotionEnabled()
  }

  /**
   * Trigger haptic feedback with cooldown enforcement
   * 
   * @param type - Type of haptic feedback
   * @param bypassCooldown - If true, bypasses cooldown (use sparingly)
   * @returns true if haptic was triggered, false if skipped
   */
  trigger(type: HapticType, bypassCooldown: boolean = false): boolean {
    // Respect reduced motion - no haptics if enabled
    if (this.reducedMotionEnabled) {
      return false
    }

    // Check cooldown
    const now = Date.now()
    const timeSinceLastTrigger = now - this.lastTriggerTime

    if (!bypassCooldown && timeSinceLastTrigger < this.cooldownMs) {
      logger.debug('Haptic skipped due to cooldown', {
        type,
        timeSinceLastTrigger,
        cooldownMs: this.cooldownMs,
      })
      return false
    }

    // Trigger haptic based on type
    try {
      switch (type) {
        case 'selection':
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
          break
        case 'light':
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
          break
        case 'medium':
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
          break
        case 'success':
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
          break
        default:
          logger.warn('Unknown haptic type', { type })
          return false
      }

      this.lastTriggerTime = now
      return true
    } catch (error) {
      // Haptics may not be available on all platforms/devices
      logger.warn('Failed to trigger haptic', error instanceof Error ? error : new Error(String(error)))                                                        
      return false
    }
  }

  /**
   * Get time since last haptic trigger
   */
  getTimeSinceLastTrigger(): number {
    return Date.now() - this.lastTriggerTime
  }

  /**
   * Check if cooldown is active
   */
  isCooldownActive(): boolean {
    return this.getTimeSinceLastTrigger() < this.cooldownMs
  }

  /**
   * Reset cooldown (for testing or special cases)
   */
  resetCooldown(): void {
    this.lastTriggerTime = 0
  }
}

// Singleton instance
let hapticManagerInstance: HapticManager | null = null

/**
 * Get the singleton HapticManager instance
 */
export function getHapticManager(): HapticManager {
  if (!hapticManagerInstance) {
    hapticManagerInstance = new HapticManager()
  }
  return hapticManagerInstance
}

/**
 * Hook to use HapticManager in React components
 */
export function useHapticManager(): HapticManager {
  return getHapticManager()
}

/**
 * Convenience function to trigger haptic feedback
 * Uses the singleton instance
 */
export function triggerHaptic(type: HapticType, bypassCooldown: boolean = false): boolean {
  return getHapticManager().trigger(type, bypassCooldown)
}

