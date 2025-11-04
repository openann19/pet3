/**
 * Content Moderation Service
 * 
 * Implements NSFW/profanity screening, content fingerprinting, and duplicate detection.
 * All content must pass moderation before being stored or displayed.
 */

import { createLogger } from '@/lib/logger'

const logger = createLogger('ContentModeration')

export interface ContentModerationResult {
  passed: boolean
  nsfwScore: number
  profanityScore: number
  contentFingerprint: string
  blockedReasons: string[]
  requiresReview: boolean
}

export interface MediaModerationResult {
  passed: boolean
  nsfwScore: number
  contentFingerprint: string
  blockedReasons: string[]
  requiresReview: boolean
}

/**
 * NSFW detection threshold - scores above this require review
 */
export const NSFW_REVIEW_THRESHOLD = 0.7
export const NSFW_BLOCK_THRESHOLD = 0.9

/**
 * Profanity detection threshold
 */
export const PROFANITY_REVIEW_THRESHOLD = 0.5
export const PROFANITY_BLOCK_THRESHOLD = 0.8

/**
 * Profanity word list (basic implementation)
 * In production, use a comprehensive profanity detection library
 */
const PROFANITY_WORDS: Set<string> = new Set<string>([
  // Add common profanity words here
  // This is a placeholder - use a proper library in production
])

/**
 * Generate content fingerprint for duplicate detection
 * Uses a hash of text content and media URLs
 */
export function generateContentFingerprint(text: string, mediaUrls: readonly string[]): string {                                                                
  const content = `${text.trim().toLowerCase()}|${[...mediaUrls].sort().join('|')}`                                                                             
  
  // Hash function (use crypto.subtle in production)
  let hash = 0
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  
  return `fp_${Math.abs(hash).toString(36)}`
}

/**
 * Check for profanity in text
 * Returns score between 0 and 1
 */
function detectProfanity(text: string): number {
  if (!text || text.trim().length === 0) return 0
  
  const words = text.toLowerCase().split(/\s+/)
  const profanityCount = words.filter(word => PROFANITY_WORDS.has(word)).length
  const totalWords = words.length
  
  if (totalWords === 0) return 0
  
  // Score based on ratio of profanity words
  return Math.min(profanityCount / totalWords, 1.0)
}

/**
 * Detect NSFW content in text
 * Returns score between 0 and 1
 * In production, use a proper ML model or API
 */
function detectNSFWText(text: string): number {
  if (!text || text.trim().length === 0) return 0
  
  // Basic heuristic (replace with ML model in production)
  const nsfwKeywords = [
    'explicit', 'adult', 'nsfw', 'xxx', 'porn', 'sexual'
  ]
  
  const lowerText = text.toLowerCase()
  const matches = nsfwKeywords.filter(keyword => lowerText.includes(keyword)).length
  
  // Scoring implementation (use proper ML model in production)
  return Math.min(matches * 0.2, 1.0)
}

/**
 * Detect NSFW content in media
 * Returns score between 0 and 1
 * In production, use a proper image/video analysis API (e.g., Google Vision API, AWS Rekognition)
 */
async function detectNSFWMedia(_mediaUrl: string, _mediaType: 'image' | 'video'): Promise<number> {
  // Placeholder implementation
  // In production, use:
  // - Google Cloud Vision API SafeSearch
  // - AWS Rekognition Content Moderation
  // - Cloudinary Moderation Add-on
  // - TensorFlow.js models for client-side pre-check
  
  try {
    // For now, return 0 (safe) - implement actual detection
    // In production, this would call an API or use a model
    return 0
  } catch (error) {
    logger.error('Failed to analyze media for NSFW content', error instanceof Error ? error : new Error(String(error)))
    // On error, require review to be safe
    return 0.5
  }
}

/**
 * Moderate text content
 */
export async function moderateTextContent(text: string): Promise<ContentModerationResult> {
  const nsfwScore = detectNSFWText(text)
  const profanityScore = detectProfanity(text)
  const contentFingerprint = generateContentFingerprint(text, [])
  
  const blockedReasons: string[] = []
  let requiresReview = false
  
  if (nsfwScore >= NSFW_BLOCK_THRESHOLD || profanityScore >= PROFANITY_BLOCK_THRESHOLD) {
    blockedReasons.push('Content violates community guidelines')
    return {
      passed: false,
      nsfwScore,
      profanityScore,
      contentFingerprint,
      blockedReasons,
      requiresReview: false
    }
  }
  
  if (nsfwScore >= NSFW_REVIEW_THRESHOLD || profanityScore >= PROFANITY_REVIEW_THRESHOLD) {
    requiresReview = true
    if (nsfwScore >= NSFW_REVIEW_THRESHOLD) {
      blockedReasons.push('NSFW content detected - requires review')
    }
    if (profanityScore >= PROFANITY_REVIEW_THRESHOLD) {
      blockedReasons.push('Profanity detected - requires review')
    }
  }
  
  return {
    passed: true,
    nsfwScore,
    profanityScore,
    contentFingerprint,
    blockedReasons,
    requiresReview
  }
}

/**
 * Moderate media content
 */
export async function moderateMediaContent(
  mediaUrl: string,
  mediaType: 'image' | 'video'
): Promise<MediaModerationResult> {
  const nsfwScore = await detectNSFWMedia(mediaUrl, mediaType)
  const contentFingerprint = generateContentFingerprint('', [mediaUrl])
  
  const blockedReasons: string[] = []
  let requiresReview = false
  
  if (nsfwScore >= NSFW_BLOCK_THRESHOLD) {
    blockedReasons.push('Media violates community guidelines')
    return {
      passed: false,
      nsfwScore,
      contentFingerprint,
      blockedReasons,
      requiresReview: false
    }
  }
  
  if (nsfwScore >= NSFW_REVIEW_THRESHOLD) {
    requiresReview = true
    blockedReasons.push('NSFW content detected - requires review')
  }
  
  return {
    passed: true,
    nsfwScore,
    contentFingerprint,
    blockedReasons,
    requiresReview
  }
}

/**
 * Moderate complete post (text + media)
 */
export async function moderatePost(
  text: string,
  mediaUrls: string[]
): Promise<ContentModerationResult> {
  // Moderate text
  const textModeration = await moderateTextContent(text)
  
  // Moderate all media
  const mediaResults = await Promise.all(
    mediaUrls.map(url => moderateMediaContent(url, 'image'))
  )
  
  // Combine results
  const maxNSFWScore = Math.max(
    textModeration.nsfwScore,
    ...mediaResults.map(r => r.nsfwScore)
  )
  
  const contentFingerprint = generateContentFingerprint(text, mediaUrls)
  
  const blockedReasons = [
    ...textModeration.blockedReasons,
    ...mediaResults.flatMap(r => r.blockedReasons)
  ]
  
  const requiresReview = textModeration.requiresReview || 
    mediaResults.some(r => r.requiresReview) ||
    maxNSFWScore >= NSFW_REVIEW_THRESHOLD
  
  const passed = textModeration.passed && 
    mediaResults.every(r => r.passed) &&
    maxNSFWScore < NSFW_BLOCK_THRESHOLD
  
  return {
    passed,
    nsfwScore: maxNSFWScore,
    profanityScore: textModeration.profanityScore,
    contentFingerprint,
    blockedReasons,
    requiresReview
  }
}

/**
 * Check for duplicate content using fingerprint
 */
export async function checkDuplicateContent(
  fingerprint: string,
  existingFingerprints: Set<string>
): Promise<boolean> {
  return existingFingerprints.has(fingerprint)
}

