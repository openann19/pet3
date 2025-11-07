/**
 * User Service
 * 
 * Manages current user authentication and profile.
 * Uses backend API for user data with local caching.
 */

import { APIClient } from './api-client'
import { ENDPOINTS } from './endpoints'
import { storage } from './storage'
import { createLogger } from './logger'
import { ENV } from '@/config/env'
import { isTruthy, isDefined } from '@petspark/shared';

const logger = createLogger('UserService')

export interface User {
  id: string
  login: string | null
  avatarUrl: string | null
  email: string | null
  displayName?: string
  isGuest?: boolean
  [key: string]: unknown
}

class UserService {
  private currentUser: User | null = null
  private currentUserPromise: Promise<User | null> | null = null
  private readonly useMocks = ENV.VITE_USE_MOCKS === 'true'

  /**
   * Get current user
   * Returns guest user if not authenticated
   */
  async user(): Promise<User | null> {
    // Return cached user if available
    if (isTruthy(this.currentUser)) {
      return this.currentUser
    }

    // Return existing promise if already loading
    if (isTruthy(this.currentUserPromise)) {
      return this.currentUserPromise
    }

    // Load user from backend or storage (if mocks enabled)
    this.currentUserPromise = this.loadUser()

    try {
      const user = await this.currentUserPromise
      this.currentUser = user
      return user
    } finally {
      this.currentUserPromise = null
    }
  }

  /**
   * Load user from backend API or storage (if mocks enabled)
   */
  private async loadUser(): Promise<User | null> {
    try {
      // If mocks are enabled, use storage fallback
      if (this.useMocks) {
        return this.loadUserFromStorage()
      }

      // Check if user is authenticated
      if (!APIClient.isAuthenticated()) {
        return this.createGuestUser()
      }

      // Fetch user from backend
      try {
        const response = await APIClient.get<User>(ENDPOINTS.AUTH.ME)
        const user = response.data
        
        // Cache user locally
        await this.cacheUser(user)
        
        return user
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        // If 401, user is not authenticated
        if ('status' in err && (err as { status: number }).status === 401) {
          return this.createGuestUser()
        }
        logger.error('Failed to fetch user from backend', err)
        // Fallback to cached user if available
        return this.loadUserFromStorage()
      }
    } catch (error) {
      logger.error('Failed to load user', error instanceof Error ? error : new Error(String(error)))
      return this.createGuestUser()
    }
  }

  /**
   * Load user from local storage (fallback/mock mode)
   */
  private async loadUserFromStorage(): Promise<User | null> {
    try {
      const userId = await storage.get<string>('current-user-id')
      
      if (isTruthy(userId)) {
        const user = await storage.get<User>(`user:${String(userId ?? '')}`)
        if (isTruthy(user)) {
          return user
        }
      }

      const isAuthenticated = await storage.get<boolean>('is-authenticated')
      
      if (isTruthy(isAuthenticated)) {
        const allUsers = await storage.get<User[]>('all-users') || []
        const user = allUsers.find(u => u.id === userId)
        if (isTruthy(user)) {
          return user
        }
      }

      return this.createGuestUser()
    } catch (error) {
      logger.error('Failed to load user from storage', error instanceof Error ? error : new Error(String(error)))
      return this.createGuestUser()
    }
  }

  /**
   * Cache user locally
   */
  private async cacheUser(user: User): Promise<void> {
    try {
      await storage.set('current-user-id', user.id)
      await storage.set(`user:${String(user.id ?? '')}`, user)
      
      const allUsers = await storage.get<User[]>('all-users') || []
      const existingIndex = allUsers.findIndex(u => u.id === user.id)
      
      if (existingIndex >= 0) {
        allUsers[existingIndex] = user
      } else {
        allUsers.push(user)
      }
      
      await storage.set('all-users', allUsers)
      await storage.set('is-authenticated', !user.isGuest)
    } catch (error) {
      logger.warn('Failed to cache user', { error: error instanceof Error ? error.message : String(error) })
    }
  }

  /**
   * Create a guest user object
   */
  private createGuestUser(): User {
    return {
      id: `guest-${String(Date.now() ?? '')}`,
      login: null,
      avatarUrl: null,
      email: null,
      isGuest: true,
    }
  }

  /**
   * Set current user
   */
  async setUser(user: User): Promise<void> {
    this.currentUser = user
    await this.cacheUser(user)
  }

  /**
   * Clear current user (logout)
   */
  async clearUser(): Promise<void> {
    this.currentUser = null
    await storage.delete('current-user-id')
    await storage.set('is-authenticated', false)
  }

  /**
   * Get user by ID from backend API
   */
  async getUserById(userId: string): Promise<User | null> {
    try {
      // If mocks are enabled, use storage
      if (this.useMocks) {
        const user = await storage.get<User>(`user:${String(userId ?? '')}`)
        if (isTruthy(user)) {
          return user
        }
        const allUsers = await storage.get<User[]>('all-users') || []
        return allUsers.find(u => u.id === userId) || null
      }

      // Fetch from backend
      try {
        const response = await APIClient.get<User>(
          `${String(ENDPOINTS.USERS.PROFILE ?? '')}?userId=${String(userId ?? '')}`
        )
        const user = response.data
        // Cache for future use
        await this.cacheUser(user)
        return user
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        // If 404, user doesn't exist
        if ('status' in err && (err as { status: number }).status === 404) {
          return null
        }
        logger.error('Failed to get user by ID from backend', err, { userId })
        // Fallback to cached user
        return this.loadUserFromStorage()
      }
    } catch (error) {
      logger.error(`Failed to get user ${String(userId ?? '')}`, error instanceof Error ? error : new Error(String(error)))
      return null
    }
  }
}

// Export singleton instance
export const userService = new UserService()

