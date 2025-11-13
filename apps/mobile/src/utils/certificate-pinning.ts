/**
 * Certificate Pinning Utilities
 *
 * Production-grade SSL/TLS certificate pinning for API requests.
 * Prevents man-in-the-middle attacks by validating server certificates.
 *
 * Note: In Expo managed workflow, certificate pinning requires
 * custom native code or a library like react-native-ssl-pinning.
 * This module provides the interface and fallback validation.
 *
 * Location: apps/mobile/src/utils/certificate-pinning.ts
 */

import { Platform } from 'react-native'
import { createLogger } from './logger'

const logger = createLogger('certificate-pinning')

export interface PinnedCertificate {
  hostname: string
  publicKeyHashes: string[] // SHA-256 hashes of public keys
  backupHashes?: string[] // Backup hashes for certificate rotation
}

export interface CertificateValidationResult {
  isValid: boolean
  error?: string
  hostname?: string
}

/**
 * Certificate pins for production API endpoints
 * These should be set via environment variables in production
 */
const DEFAULT_CERTIFICATE_PINS: PinnedCertificate[] = []

/**
 * Get certificate pins from environment or config
 */
function getCertificatePins(): PinnedCertificate[] {
  try {
    // In production, pins should come from secure config
    const pinsEnv = process.env['EXPO_PUBLIC_CERT_PINS']
    if (pinsEnv) {
      try {
        return JSON.parse(pinsEnv) as PinnedCertificate[]
      } catch {
        logger.warn('Failed to parse certificate pins from environment')
      }
    }

    // Fallback to default pins (should be empty in production)
    return DEFAULT_CERTIFICATE_PINS
  } catch (error) {
    logger.error('Failed to get certificate pins', error)
    return []
  }
}

/**
 * Validate certificate pin for a hostname
 * 
 * Note: This is a placeholder implementation. In a production app,
 * you would use a native module or library like:
 * - react-native-ssl-pinning (for bare React Native)
 * - Custom native module (for Expo with custom native code)
 * 
 * For Expo managed workflow, certificate pinning requires ejecting
 * or using a config plugin with native code.
 */
export async function validateCertificatePin(
  hostname: string,
  pins: PinnedCertificate[] = getCertificatePins()
): Promise<CertificateValidationResult> {
  try {
    // Find matching pin configuration
    const pinConfig = pins.find(p => 
      p.hostname === hostname || hostname.endsWith(`.${p.hostname}`)
    )

    if (!pinConfig) {
      // No pin configured - allow in development, warn in production
      if (process.env['NODE_ENV'] === 'production') {
        logger.warn('No certificate pin configured for hostname', { hostname })
        return {
          isValid: false,
          error: 'No certificate pin configured',
          hostname,
        }
      }

      // In development, allow requests without pinning
      return {
        isValid: true,
        hostname,
      }
    }

    // In a real implementation, this would:
    // 1. Extract the certificate from the TLS connection
    // 2. Calculate SHA-256 hash of the public key
    // 3. Compare against pinned hashes
    // 
    // For now, we log a warning and return valid
    // This should be replaced with actual pinning logic
    logger.warn('Certificate pinning not fully implemented', {
      hostname,
      note: 'Requires native module or library integration',
    })

    // In production, this should fail if pinning is not implemented
    if (process.env['NODE_ENV'] === 'production') {
      return {
        isValid: false,
        error: 'Certificate pinning not implemented',
        hostname,
      }
    }

    return {
      isValid: true,
      hostname,
    }
  } catch (error) {
    logger.error('Certificate validation failed', error, { hostname })
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      hostname,
    }
  }
}

/**
 * Extract hostname from URL
 */
export function extractHostname(url: string): string | null {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname
  } catch {
    return null
  }
}

/**
 * Check if certificate pinning is enabled
 */
export function isCertificatePinningEnabled(): boolean {
  const pins = getCertificatePins()
  return pins.length > 0
}

/**
 * Validate certificate for a URL
 */
export async function validateCertificateForUrl(
  url: string
): Promise<CertificateValidationResult> {
  const hostname = extractHostname(url)
  if (!hostname) {
    return {
      isValid: false,
      error: 'Invalid URL',
    }
  }

  return validateCertificatePin(hostname)
}

/**
 * Setup certificate pinning for API client
 * This should be called during app initialization
 */
export async function setupCertificatePinning(): Promise<void> {
  try {
    const pins = getCertificatePins()
    
    if (pins.length === 0) {
      if (process.env['NODE_ENV'] === 'production') {
        logger.warn('Certificate pinning not configured for production')
      } else {
        logger.info('Certificate pinning not configured (development mode)')
      }
      return
    }

    logger.info('Certificate pinning configured', {
      pinCount: pins.length,
      hostnames: pins.map(p => p.hostname),
    })

    // In a real implementation, this would:
    // 1. Register certificate pins with native module
    // 2. Set up network interceptor
    // 3. Validate certificates on each request
  } catch (error) {
    logger.error('Failed to setup certificate pinning', error)
  }
}

/**
 * Production-ready certificate pinning implementation guide:
 * 
 * 1. For Expo managed workflow:
 *    - Use expo-build-properties to configure network security config (Android)
 *    - Use Info.plist for App Transport Security (iOS)
 *    - Consider ejecting or using config plugin for native pinning
 * 
 * 2. For bare React Native:
 *    - Use react-native-ssl-pinning library
 *    - Configure pins in native code
 *    - Set up network security config (Android) and ATS (iOS)
 * 
 * 3. Certificate pin format:
 *    - SHA-256 hash of public key (preferred)
 *    - Backup pins for certificate rotation
 *    - Store pins securely (not in code)
 * 
 * 4. Testing:
 *    - Test with valid certificates
 *    - Test with invalid certificates (should fail)
 *    - Test certificate rotation
 *    - Test in production environment
 */

