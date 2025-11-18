/**
 * Simple ULID generator for mock purposes
 */
export function generateULID(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 15);
  return `${timestamp}_${randomPart}`;
}