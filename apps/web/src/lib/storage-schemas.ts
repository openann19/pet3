/**
 * Zod Schemas for Storage Data Validation
 * Ensures all data stored/retrieved from localStorage is properly validated
 */

import { z } from 'zod';

/**
 * Pet schema
 */
export const petSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  breed: z.string().optional(),
  age: z.number().int().min(0).max(30).optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  size: z.enum(['tiny', 'small', 'medium', 'large', 'extra-large']).optional(),
  photo: z.string().url().optional(),
  location: z.string().optional(),
  coordinates: z.object({
    lat: z.number(),
    lng: z.number(),
  }).optional(),
  verified: z.boolean().optional(),
  personality: z.array(z.string()).optional(),
  interests: z.array(z.string()).optional(),
  lookingFor: z.array(z.string()).optional(),
  trustProfile: z.object({
    badges: z.array(z.string()).optional(),
    ratings: z.record(z.number()).optional(),
  }).optional(),
});

/**
 * Match schema
 */
export const matchSchema = z.object({
  id: z.string().min(1),
  petId: z.string().min(1),
  matchedPetId: z.string().min(1),
  compatibilityScore: z.number().min(0).max(100),
  reasoning: z.array(z.string()),
  matchedAt: z.string(),
  status: z.enum(['active', 'archived', 'blocked']),
});

/**
 * SwipeAction schema
 */
export const swipeActionSchema = z.object({
  petId: z.string().min(1),
  targetPetId: z.string().min(1),
  action: z.enum(['like', 'pass']),
  timestamp: z.string(),
});

/**
 * DiscoveryPreferences schema
 */
export const discoveryPreferencesSchema = z.object({
  minAge: z.number().int().min(0).max(30).optional(),
  maxAge: z.number().int().min(0).max(30).optional(),
  sizes: z.array(z.enum(['small', 'medium', 'large', 'extra-large'])).optional(),
  maxDistance: z.number().min(0).max(1000).optional(),
  personalities: z.array(z.string()).optional(),
  interests: z.array(z.string()).optional(),
  lookingFor: z.array(z.string()).optional(),
  minCompatibility: z.number().min(0).max(100).optional(),
  mediaFilters: z.object({
    cropSize: z.string().optional(),
    photoQuality: z.string().optional(),
    hasVideo: z.boolean().optional(),
    minPhotos: z.number().int().min(0).optional(),
  }).optional(),
  advancedFilters: z.object({
    verified: z.boolean().optional(),
    activeToday: z.boolean().optional(),
    hasStories: z.boolean().optional(),
    respondQuickly: z.boolean().optional(),
    superLikesOnly: z.boolean().optional(),
  }).optional(),
});

/**
 * VerificationRequest schema
 */
export const verificationRequestSchema = z.object({
  id: z.string().min(1),
  petId: z.string().min(1),
  verificationLevel: z.enum(['basic', 'premium', 'verified']).optional(),
  status: z.string().optional(),
});

/**
 * Storage key to schema mapping
 */
export const storageSchemas = {
  'user-pets': z.array(petSchema),
  'all-pets': z.array(petSchema),
  'matches': z.array(matchSchema),
  'swipe-history': z.array(swipeActionSchema),
  'discovery-preferences': discoveryPreferencesSchema,
  'verification-requests': z.record(z.string(), verificationRequestSchema),
  'favorited-adoption-profiles': z.array(z.string()),
  'adoption-favorites': z.array(z.string()),
  'saved-places': z.array(z.string()),
  'map-precise-sharing': z.boolean(),
  'map-precise-until': z.number().nullable(),
  'adoptable-pet-ids': z.instanceof(Set).or(z.array(z.string())),
} as const;

export type StorageKey = keyof typeof storageSchemas;

/**
 * Get schema for a storage key
 */
export function getStorageSchema<T extends StorageKey>(key: T): z.ZodSchema<z.infer<typeof storageSchemas[T]>> {
  return storageSchemas[key] as z.ZodSchema<z.infer<typeof storageSchemas[T]>>;
}

/**
 * Validate storage data with schema
 */
export function validateStorageData<T extends StorageKey>(
  key: T,
  data: unknown
): z.infer<typeof storageSchemas[T]> | undefined {
  const schema = getStorageSchema(key);
  try {
    return schema.parse(data);
  } catch {
    return undefined;
  }
}

