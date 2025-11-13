/**
 * Device Security Utilities
 *
 * Production-grade security checks for mobile devices:
 * - Jailbreak/root detection (iOS/Android)
 * - Emulator/simulator detection
 * - Debugger detection
 * - Tampering detection
 *
 * Location: apps/mobile/src/utils/device-security.ts
 */

import { Platform } from 'react-native'
import DeviceInfo from 'react-native-device-info'
import { createLogger } from './logger'

const logger = createLogger('device-security')

export interface SecurityCheckResult {
  isSecure: boolean
  threats: SecurityThreat[]
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
}

export interface SecurityThreat {
  type: 'jailbreak' | 'root' | 'emulator' | 'debugger' | 'tampering' | 'unknown'
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  detected: boolean
}

/**
 * Check if device is jailbroken (iOS) or rooted (Android)
 */
export async function checkJailbreakRoot(): Promise<SecurityThreat> {
  try {
    if (Platform.OS === 'ios') {
      const isJailbroken = await DeviceInfo.isJailBroken()
      return {
        type: 'jailbreak',
        severity: 'critical',
        description: isJailbroken
          ? 'Device is jailbroken. This compromises device security.'
          : 'Device is not jailbroken.',
        detected: isJailbroken,
      }
    }

    if (Platform.OS === 'android') {
      const isRooted = await DeviceInfo.isRooted()
      return {
        type: 'root',
        severity: 'critical',
        description: isRooted
          ? 'Device is rooted. This compromises device security.'
          : 'Device is not rooted.',
        detected: isRooted,
      }
    }

    return {
      type: 'unknown',
      severity: 'low',
      description: 'Platform not supported for jailbreak/root detection.',
      detected: false,
    }
  } catch (error) {
    logger.error('Failed to check jailbreak/root status', error)
    return {
      type: 'unknown',
      severity: 'medium',
      description: 'Unable to verify device security status.',
      detected: true, // Fail secure - assume threat if check fails
    }
  }
}

/**
 * Check if running on emulator/simulator
 */
export async function checkEmulator(): Promise<SecurityThreat> {
  try {
    const isEmulator = await DeviceInfo.isEmulator()
    return {
      type: 'emulator',
      severity: 'low',
      description: isEmulator
        ? 'Running on emulator/simulator. This is acceptable in development.'
        : 'Running on physical device.',
      detected: isEmulator,
    }
  } catch (error) {
    logger.error('Failed to check emulator status', error)
    return {
      type: 'emulator',
      severity: 'low',
      description: 'Unable to verify emulator status.',
      detected: false,
    }
  }
}

/**
 * Check for debugger attachment
 * Note: This is a basic check and may not catch all debuggers
 */
export function checkDebugger(): SecurityThreat {
  try {
    // In production, __DEV__ should be false
    const isDev = typeof __DEV__ !== 'undefined' && __DEV__
    
    // Additional checks for React Native debugger
    const hasRemoteDebugger = typeof global !== 'undefined' && 
      (global as unknown as { __fbBatchedBridge?: unknown }).__fbBatchedBridge !== undefined

    const detected = isDev || hasRemoteDebugger

    return {
      type: 'debugger',
      severity: detected && !isDev ? 'high' : 'low',
      description: detected
        ? 'Debugger detected. This may indicate development mode or security risk.'
        : 'No debugger detected.',
      detected,
    }
  } catch (error) {
    logger.error('Failed to check debugger status', error)
    return {
      type: 'debugger',
      severity: 'low',
      description: 'Unable to verify debugger status.',
      detected: false,
    }
  }
}

/**
 * Check for app tampering
 * Basic checks for common tampering indicators
 */
export function checkTampering(): SecurityThreat {
  try {
    // Check if running in development mode (which is acceptable)
    const isDev = typeof __DEV__ !== 'undefined' && __DEV__
    
    // In production, we should not be in dev mode
    const isProduction = process.env['NODE_ENV'] === 'production'
    const detected = isProduction && isDev

    return {
      type: 'tampering',
      severity: detected ? 'high' : 'low',
      description: detected
        ? 'App appears to be running in development mode in production build.'
        : 'No tampering indicators detected.',
      detected,
    }
  } catch (error) {
    logger.error('Failed to check tampering status', error)
    return {
      type: 'tampering',
      severity: 'low',
      description: 'Unable to verify tampering status.',
      detected: false,
    }
  }
}

/**
 * Perform comprehensive security check
 */
export async function performSecurityCheck(options: {
  allowEmulator?: boolean
  allowDevMode?: boolean
} = {}): Promise<SecurityCheckResult> {
  const { allowEmulator = false, allowDevMode = false } = options

  const threats: SecurityThreat[] = []

  // Check jailbreak/root
  const jailbreakThreat = await checkJailbreakRoot()
  if (jailbreakThreat.detected) {
    threats.push(jailbreakThreat)
  }

  // Check emulator (only if not allowed)
  if (!allowEmulator) {
    const emulatorThreat = await checkEmulator()
    if (emulatorThreat.detected) {
      threats.push(emulatorThreat)
    }
  }

  // Check debugger (only if not in allowed dev mode)
  if (!allowDevMode) {
    const debuggerThreat = checkDebugger()
    if (debuggerThreat.detected && debuggerThreat.severity !== 'low') {
      threats.push(debuggerThreat)
    }
  }

  // Check tampering
  const tamperingThreat = checkTampering()
  if (tamperingThreat.detected) {
    threats.push(tamperingThreat)
  }

  // Determine risk level
  const criticalThreats = threats.filter(t => t.severity === 'critical')
  const highThreats = threats.filter(t => t.severity === 'high')
  const mediumThreats = threats.filter(t => t.severity === 'medium')

  let riskLevel: 'low' | 'medium' | 'high' | 'critical'
  if (criticalThreats.length > 0) {
    riskLevel = 'critical'
  } else if (highThreats.length > 0) {
    riskLevel = 'high'
  } else if (mediumThreats.length > 0) {
    riskLevel = 'medium'
  } else {
    riskLevel = 'low'
  }

  const isSecure = threats.filter(t => 
    t.severity === 'critical' || t.severity === 'high'
  ).length === 0

  return {
    isSecure,
    threats,
    riskLevel,
  }
}

/**
 * Check if device is secure enough for sensitive operations
 */
export async function isDeviceSecure(options: {
  allowEmulator?: boolean
  allowDevMode?: boolean
} = {}): Promise<boolean> {
  const result = await performSecurityCheck(options)
  return result.isSecure
}

/**
 * Get security status summary for logging/telemetry
 */
export async function getSecurityStatus(): Promise<{
  isSecure: boolean
  riskLevel: string
  threatCount: number
  platform: string
}> {
  const result = await performSecurityCheck({
    allowEmulator: __DEV__, // Allow emulator in dev mode
    allowDevMode: __DEV__, // Allow dev mode in development
  })

  return {
    isSecure: result.isSecure,
    riskLevel: result.riskLevel,
    threatCount: result.threats.length,
    platform: Platform.OS,
  }
}

