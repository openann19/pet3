/**
 * Entitlements Engine
 * 
 * Infrastructure layer for entitlement checks with storage access.
 * Uses domain logic from src/core/domain/business.ts for pure calculations.
 */

import type { Plan, Entitlements, UsageCounter } from '@/core/domain/business'
import { getEntitlementsForPlan, checkUsageWithinLimits, isFeatureEnabled } from '@/core/domain/business'

const KV_PREFIX = {
  ENTITLEMENTS: 'entitlements:',
  USAGE: 'usage:',
}

/**
 * Get user's current plan from storage
 */
export async function getUserPlan(userId: string): Promise<Plan> {
  try {
    const key = `${KV_PREFIX.ENTITLEMENTS}${userId}`
    const data = await window.spark.kv.get<{ plan: Plan }>(key)
    return data?.plan || 'free'
  } catch {
    return 'free'
  }
}

/**
 * Get user's current entitlements
 */
export async function getUserEntitlements(userId: string): Promise<Entitlements> {
  const plan = await getUserPlan(userId)
  return getEntitlementsForPlan(plan)
}

/**
 * Check if user can perform an action
 * 
 * Uses domain logic from src/core/domain/business.ts for pure calculations.
 */
export async function canPerformAction(
  userId: string,
  action: 'swipe' | 'super_like' | 'boost' | 'see_who_liked' | 'video_call' | 'advanced_filter' | 'read_receipt' | 'adoption_listing'                           
): Promise<{ allowed: boolean; reason?: string; limit?: number; remaining?: number }> {                                                                         
  const entitlements = await getUserEntitlements(userId)
  const usage = await getUsageCounter(userId)

  // Use domain logic for usage-based actions
  switch (action) {
    case 'swipe':
    case 'super_like':
    case 'boost':
      return checkUsageWithinLimits(entitlements, usage, action)

    case 'see_who_liked':
      return { allowed: isFeatureEnabled(entitlements, 'see_who_liked_you') }

    case 'video_call':
      return { allowed: isFeatureEnabled(entitlements, 'video_call') }

    case 'advanced_filter':
      return { allowed: isFeatureEnabled(entitlements, 'advanced_filter') }

    case 'read_receipt':
      return { allowed: isFeatureEnabled(entitlements, 'read_receipt') }

    case 'adoption_listing':
      // Check active adoption listings count
      const activeListings = await getActiveAdoptionListingsCount(userId)
      if (activeListings >= entitlements.adoptionListingLimit) {
        return {
          allowed: false,
          reason: 'Adoption listing limit reached',
          limit: entitlements.adoptionListingLimit,
          remaining: 0,
        }
      }
      return { allowed: true, remaining: entitlements.adoptionListingLimit - activeListings }

    default:
      return { allowed: false, reason: 'Unknown action' }
  }
}

/**
 * Get usage counter for user (today)
 */
export async function getUsageCounter(userId: string): Promise<UsageCounter> {
  const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD
  if (!today) {
    throw new Error('Failed to get today date')
  }
  const weekStart = getWeekStart(today)

  try {
    const key = `${KV_PREFIX.USAGE}${userId}:${today}`
    const usage = await window.spark.kv.get<{
      swipes: number
      superLikes: number
      boostsThisWeek: number
      week: string
    }>(key)

    if (usage && usage.week === weekStart) {
      return {
        userId,
        day: today,
        week: weekStart,
        swipes: usage.swipes || 0,
        superLikes: usage.superLikes || 0,
        boostsThisWeek: usage.boostsThisWeek || 0,
        updatedAt: new Date().toISOString(),
      }
    }
  } catch {
    // Ignore errors
  }

  return {
    userId,
    day: today,
    week: weekStart,
    swipes: 0,
    superLikes: 0,
    boostsThisWeek: 0,
    updatedAt: new Date().toISOString(),
  }
}

/**
 * Increment usage counter atomically (idempotent with operationId)
 */
export async function incrementUsage(
  userId: string,
  type: 'swipe' | 'super_like' | 'boost',
  operationId?: string // For idempotency
): Promise<{ success: boolean; remaining?: number; limit?: number }> {
  const today = new Date().toISOString().split('T')[0]
  if (!today) {
    throw new Error('Failed to get today date')
  }
  const weekStart = getWeekStart(today)

  // Check if already processed (idempotency)
  if (operationId) {
    const idempotencyKey = `${KV_PREFIX.USAGE}${userId}:${operationId}`
    const processed = await window.spark.kv.get<boolean>(idempotencyKey)
    if (processed) {
      const usage = await getUsageCounter(userId)
      return { success: true, remaining: usage.swipes }
    }
  }

  const entitlements = await getUserEntitlements(userId)
  const usage = await getUsageCounter(userId)

  // Check limits
  if (type === 'swipe' && entitlements.swipeDailyCap !== 'unlimited') {
    if (usage.swipes >= entitlements.swipeDailyCap) {
      return {
        success: false,
        remaining: 0,
        limit: entitlements.swipeDailyCap,
      }
    }
  } else if (type === 'super_like') {
    if (usage.superLikes >= entitlements.superLikesPerDay) {
      return {
        success: false,
        remaining: 0,
        limit: entitlements.superLikesPerDay,
      }
    }
  } else if (type === 'boost') {
    if (usage.boostsThisWeek >= entitlements.boostsPerWeek) {
      return {
        success: false,
        remaining: 0,
        limit: entitlements.boostsPerWeek,
      }
    }
  }

  // Increment atomically
  const key = `${KV_PREFIX.USAGE}${userId}:${today}`
  const newUsage = {
    swipes: type === 'swipe' ? usage.swipes + 1 : usage.swipes,
    superLikes: type === 'super_like' ? usage.superLikes + 1 : usage.superLikes,
    boostsThisWeek: type === 'boost' ? usage.boostsThisWeek + 1 : usage.boostsThisWeek,
    week: weekStart,
    updatedAt: new Date().toISOString(),
  }

  await window.spark.kv.set(key, newUsage)

  // Mark as processed (idempotency)
  if (operationId) {
    const idempotencyKey = `${KV_PREFIX.USAGE}${userId}:${operationId}`
    await window.spark.kv.set(idempotencyKey, true)
    // Clean up after 24 hours
    setTimeout(() => {
      window.spark.kv.delete(idempotencyKey).catch(() => {})
    }, 24 * 60 * 60 * 1000)
  }

  return {
    success: true,
    remaining: entitlements.swipeDailyCap === 'unlimited' 
      ? undefined 
      : (entitlements.swipeDailyCap - newUsage.swipes),
  }
}

/**
 * Get week start (Monday) for a date
 */
function getWeekStart(date: string): string {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Adjust when day is Sunday
  const monday = new Date(d.setDate(diff))
  const year = monday.getFullYear()
  const week = Math.ceil((monday.getTime() - new Date(year, 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000))
  return `${year}-W${week.toString().padStart(2, '0')}`
}

/**
 * Get active adoption listings count for user
 */
async function getActiveAdoptionListingsCount(userId: string): Promise<number> {
  try {
    const listings = await window.spark.kv.get<Array<{ userId: string; status: string }>>('adoption-listings') || []
    return listings.filter(l => l.userId === userId && l.status === 'active').length
  } catch {
    return 0
  }
}

