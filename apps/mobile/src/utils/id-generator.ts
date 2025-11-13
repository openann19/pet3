/**
 * ID Generation Utilities
 * 
 * Provides type-safe ID generation functions for various entities.
 * Location: apps/mobile/src/utils/id-generator.ts
 */

/**
 * Generate a unique call ID
 * Uses timestamp and random component for uniqueness
 */
export function generateCallId(): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 9)
  return `call-${timestamp}-${random}`
}

/**
 * Generate a unique temporary ID
 * For use when API-provided IDs are not yet available
 */
export function generateTempId(prefix = 'temp'): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 9)
  return `${prefix}-${timestamp}-${random}`
}

/**
 * Validate if a string looks like a valid ID
 * Checks for non-empty string with reasonable length
 */
export function isValidId(id: unknown): id is string {
  return typeof id === 'string' && id.length > 0 && id.length < 256
}

/**
 * Extract ID from a composite identifier
 * Handles patterns like "user-123" or "match-456"
 */
export function extractId(compositeId: string, prefix: string): string | null {
  if (!compositeId.startsWith(`${prefix}-`)) {
    return null
  }
  const id = compositeId.substring(prefix.length + 1)
  return isValidId(id) ? id : null
}

