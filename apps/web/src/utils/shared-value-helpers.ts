/**
 * Shared utility functions for safely extracting values from SharedValue objects
 * Used across animation hooks and components
 */

/**
 * Type guard to check if value is a transition object
 */
function isTransitionObject(value: unknown): value is { target: number; transition?: unknown } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'target' in value &&
    typeof (value as { target: unknown }).target === 'number'
  );
}

/**
 * Helper function to safely extract numeric value from SharedValue
 * Handles both number values and transition objects with target property
 */
export function extractNumberValue(value: unknown, defaultValue: number): number {
  if (value === undefined || value === null) return defaultValue;
  if (typeof value === 'number') return value;
  if (isTransitionObject(value)) {
    return value.target;
  }
  return defaultValue;
}

