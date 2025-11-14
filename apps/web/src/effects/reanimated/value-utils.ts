/**
 * Reanimated Value Utilities
 * 
 * Shared utilities for working with reanimated SharedValue types
 */

/**
 * Type guard to check if value is a transition object
 */
export function isTransitionObject(value: unknown): value is { target: number; transition?: unknown } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'target' in value &&
    typeof (value as { target: unknown }).target === 'number'
  );
}

/**
 * Helper function to safely extract numeric value from SharedValue
 * 
 * @param value - The value to extract (can be number or transition object)
 * @param defaultValue - Default value to return if extraction fails
 * @returns The numeric value
 */
export function extractNumberValue(value: unknown, defaultValue: number): number {
  if (value === undefined || value === null) return defaultValue;
  if (typeof value === 'number') return value;
  if (isTransitionObject(value)) {
    return value.target;
  }
  return defaultValue;
}

