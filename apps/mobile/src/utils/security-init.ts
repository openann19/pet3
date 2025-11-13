/**
 * Security Initialization Module
 *
 * Centralized security setup for the mobile app:
 * - Device security checks
 * - Certificate pinning setup
 * - Security monitoring
 *
 * Location: apps/mobile/src/utils/security-init.ts
 */

import { createLogger } from './logger'
import { setupCertificatePinning, isCertificatePinningEnabled } from './certificate-pinning'
import { performSecurityCheck, getSecurityStatus } from './device-security'

const logger = createLogger('security-init')

export interface SecurityInitResult {
  success: boolean
  certificatePinningEnabled: boolean
  deviceSecure: boolean
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  errors: string[]
}

/**
 * Initialize all security features
 * Should be called during app startup
 */
export async function initializeSecurity(options: {
  allowEmulator?: boolean
  allowDevMode?: boolean
  strictMode?: boolean
} = {}): Promise<SecurityInitResult> {
  const { allowEmulator = __DEV__, allowDevMode = __DEV__, strictMode = false } = options
  const errors: string[] = []

  try {
    // Setup certificate pinning
    try {
      await setupCertificatePinning()
      const pinningEnabled = isCertificatePinningEnabled()
      
      if (strictMode && !pinningEnabled && process.env['NODE_ENV'] === 'production') {
        errors.push('Certificate pinning not configured in production')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      errors.push(`Certificate pinning setup failed: ${errorMessage}`)
      logger.error('Certificate pinning setup failed', error)
    }

    // Perform device security check
    let deviceSecure = true
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low'
    
    try {
      const securityCheck = await performSecurityCheck({
        allowEmulator,
        allowDevMode,
      })
      
      deviceSecure = securityCheck.isSecure
      riskLevel = securityCheck.riskLevel

      if (!deviceSecure && strictMode) {
        errors.push(`Device security check failed: ${securityCheck.threats.map(t => t.type).join(', ')}`)
      }

      // Log security status
      logger.info('Device security check completed', {
        isSecure: deviceSecure,
        riskLevel,
        threatCount: securityCheck.threats.length,
        threats: securityCheck.threats.map(t => ({
          type: t.type,
          severity: t.severity,
          detected: t.detected,
        })),
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      errors.push(`Device security check failed: ${errorMessage}`)
      logger.error('Device security check failed', error)
      
      if (strictMode) {
        deviceSecure = false
        riskLevel = 'critical'
      }
    }

    // Get security status summary
    const status = await getSecurityStatus()
    logger.info('Security initialization completed', {
      certificatePinningEnabled: isCertificatePinningEnabled(),
      deviceSecure,
      riskLevel,
      platform: status.platform,
    })

    return {
      success: errors.length === 0 || (!strictMode && deviceSecure),
      certificatePinningEnabled: isCertificatePinningEnabled(),
      deviceSecure,
      riskLevel,
      errors,
    }
  } catch (error) {
    logger.error('Security initialization failed', error)
    return {
      success: false,
      certificatePinningEnabled: false,
      deviceSecure: false,
      riskLevel: 'critical',
      errors: [error instanceof Error ? error.message : 'Unknown error'],
    }
  }
}

/**
 * Periodic security check
 * Can be called periodically to monitor device security
 */
export async function performPeriodicSecurityCheck(): Promise<void> {
  try {
    const status = await getSecurityStatus()
    
    if (!status.isSecure || status.riskLevel === 'high' || status.riskLevel === 'critical') {
      logger.warn('Periodic security check detected issues', status)
      
      // In production, you might want to:
      // - Log to telemetry
      // - Show user warning
      // - Restrict app functionality
      // - Report to backend
    }
  } catch (error) {
    logger.error('Periodic security check failed', error)
  }
}

/**
 * Check if app should continue running based on security status
 */
export async function shouldContinueRunning(): Promise<boolean> {
  try {
    const securityCheck = await performSecurityCheck({
      allowEmulator: __DEV__,
      allowDevMode: __DEV__,
    })

    // In production, block on critical threats
    if (process.env['NODE_ENV'] === 'production') {
      const criticalThreats = securityCheck.threats.filter(t => t.severity === 'critical')
      if (criticalThreats.length > 0) {
        logger.error('Critical security threats detected, app should not continue', {
          threats: criticalThreats,
        })
        return false
      }
    }

    return true
  } catch (error) {
    logger.error('Failed to check if app should continue', error)
    // Fail secure - allow in case of check failure
    return true
  }
}

