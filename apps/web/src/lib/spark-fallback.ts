/**
 * Spark API Fallback Utility
 * 
 * Provides localStorage fallback for Spark APIs when authentication fails
 * (e.g., in local development without Spark authentication)
 */

import { createLogger } from './logger'

const logger = createLogger('spark-fallback')
const STORAGE_PREFIX = 'spark-fallback:'
const AUTH_ERROR_CODES = [401, 'Unauthorized']
const IS_DEV = import.meta.env.DEV || window.location.hostname === 'localhost'

/**
 * Check if an error is an authentication error
 */
function isAuthError(error: unknown): boolean {
  if (!error) return false
  
  const errorObj = error as Record<string, unknown>
  const message = String(errorObj?.message || error || '').toLowerCase()
  const status = errorObj?.status || errorObj?.statusCode
  
  return (
    status === 401 ||
    message.includes('unauthorized') ||
    message.includes('401') ||
    AUTH_ERROR_CODES.some(code => String(message).includes(String(code)))
  )
}

/**
 * Check if an error is a rate limit error
 */
function isRateLimitError(error: unknown): boolean {
  if (!error) return false
  
  const errorObj = error as Record<string, unknown>
  const message = String(errorObj?.message || error || '').toLowerCase()
  // Check status on error object or nested response object
  const response = errorObj?.response as Record<string, unknown> | undefined
  const status = errorObj?.status || errorObj?.statusCode || response?.status
  
  return (
    status === 403 ||
    status === 429 ||
    message.includes('rate limit') ||
    message.includes('rate limit exceeded') ||
    message.includes('403') ||
    message.includes('429')
  )
}

/**
 * Check if an error should fall back to localStorage
 */
function shouldFallbackToLocalStorage(error: unknown): boolean {
  return isAuthError(error) || isRateLimitError(error)
}

/**
 * Get value from localStorage with fallback
 */
function getLocalStorage<T>(key: string): T | null {
  try {
    const item = localStorage.getItem(`${STORAGE_PREFIX}${key}`)
    return item ? JSON.parse(item) : null
  } catch {
    return null
  }
}

/**
 * Set value in localStorage
 */
function setLocalStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(value))
  } catch (error) {
    logger.warn(`Failed to save to localStorage for key ${key}`, { error })
  }
}

/**
 * Delete value from localStorage
 */
function deleteLocalStorage(key: string): void {
  try {
    localStorage.removeItem(`${STORAGE_PREFIX}${key}`)
  } catch (error) {
    logger.warn(`Failed to delete from localStorage for key ${key}`, { error })
  }
}

/**
 * Spark KV wrapper with localStorage fallback
 */
export const sparkKV = {
  /**
   * Get a value from Spark KV with localStorage fallback
   */
  async get<T>(key: string): Promise<T | null> {
    // Try Spark KV first
    try {
      if (typeof window !== 'undefined' && window.spark?.kv?.get) {
        const value = await window.spark.kv.get<T>(key)
        // Cache successful reads in localStorage for fallback
        if (value !== null && value !== undefined) {
          setLocalStorage(key, value)
        }
        return value ?? null
      }
    } catch (error) {
      if (shouldFallbackToLocalStorage(error)) {
        const errorType = isRateLimitError(error) ? 'Rate limit' : 'Auth'
        logger.warn(`${errorType} error for ${key}, using localStorage fallback`, { key, errorType })
        // Fall back to localStorage
        return getLocalStorage<T>(key)
      }
      // For other errors, rethrow
      throw error
    }
    
    // If Spark is not available, use localStorage
    if (IS_DEV) {
      logger.warn(`Spark KV not available for ${key}, using localStorage`, { key })
      return getLocalStorage<T>(key)
    }
    
    return null
  },

  /**
   * Set a value in Spark KV with localStorage fallback
   */
  async set<T>(key: string, value: T): Promise<void> {
    // Always save to localStorage for fallback
    setLocalStorage(key, value)
    
    // Try Spark KV
    try {
      if (typeof window !== 'undefined' && window.spark?.kv?.set) {
        await window.spark.kv.set(key, value)
        return
      }
    } catch (error) {
      if (shouldFallbackToLocalStorage(error)) {
        const errorType = isRateLimitError(error) ? 'Rate limit' : 'Auth'
        logger.warn(`${errorType} error setting ${key}, saved to localStorage only`, { key, errorType })
        return
      }
      // For other errors, rethrow
      throw error
    }
    
    // If Spark is not available, localStorage is already saved
    if (IS_DEV) {
      logger.warn(`Spark KV not available for ${key}, saved to localStorage only`, { key })
    }
  },

  /**
   * Delete a value from Spark KV with localStorage fallback
   */
  async delete(key: string): Promise<void> {
    // Delete from localStorage
    deleteLocalStorage(key)
    
    // Try Spark KV
    try {
      if (typeof window !== 'undefined' && window.spark?.kv?.delete) {
        await window.spark.kv.delete(key)
        return
      }
    } catch (error) {
      if (shouldFallbackToLocalStorage(error)) {
        const errorType = isRateLimitError(error) ? 'Rate limit' : 'Auth'
        logger.warn(`${errorType} error deleting ${key}, deleted from localStorage only`, { key, errorType })
        return
      }
      throw error
    }
    
    if (IS_DEV) {
      logger.warn(`Spark KV not available for ${key}, deleted from localStorage only`, { key })
    }
  },

  /**
   * Get all keys from Spark KV with localStorage fallback
   */
  async keys(): Promise<string[]> {
    try {
      if (typeof window !== 'undefined' && window.spark?.kv?.keys) {
        return await window.spark.kv.keys()
      }
    } catch (error) {
      if (shouldFallbackToLocalStorage(error)) {
        const errorType = isRateLimitError(error) ? 'Rate limit' : 'Auth'
        logger.warn(`${errorType} error getting keys, using localStorage fallback`, { errorType })
        // Fall back to localStorage keys
        const keys: string[] = []
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key && key.startsWith(STORAGE_PREFIX)) {
            keys.push(key.substring(STORAGE_PREFIX.length))
          }
        }
        return keys
      }
      throw error
    }
    
    if (IS_DEV) {
      // Get keys from localStorage
      const keys: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith(STORAGE_PREFIX)) {
          keys.push(key.substring(STORAGE_PREFIX.length))
        }
      }
      return keys
    }
    
    return []
  }
}

/**
 * Spark User wrapper with localStorage fallback
 */
export const sparkUser = {
  /**
   * Get current user from Spark with localStorage fallback
   */
  async user(): Promise<unknown | null> {
    try {
      if (typeof window !== 'undefined' && window.spark?.user) {
        const user = await window.spark.user()
        // Cache user in localStorage
        if (user) {
          setLocalStorage('current-user', user)
        }
        return user
      }
    } catch (error) {
      if (shouldFallbackToLocalStorage(error)) {
        const errorType = isRateLimitError(error) ? 'Rate limit' : 'Auth'
        logger.warn(`${errorType} error getting user, using localStorage fallback`, { errorType })
        // Return guest user from localStorage
        const cachedUser = getLocalStorage<unknown>('current-user')
        if (cachedUser) {
          return cachedUser
        }
        // Return a guest user object
        return {
          id: 'guest-' + Date.now(),
          login: null,
          avatarUrl: null,
          email: null,
          isGuest: true
        }
      }
      throw error
    }
    
    if (IS_DEV) {
      // Return guest user
      const cachedUser = getLocalStorage<unknown>('current-user')
      if (cachedUser) {
        return cachedUser
      }
      return {
        id: 'guest-' + Date.now(),
        login: null,
        avatarUrl: null,
        email: null,
        isGuest: true
      }
    }
    
    return null
  }
}

/**
 * Spark LLM wrapper with error handling
 */
export const sparkLLM = {
  /**
   * Call Spark LLM with error handling
   */
  async llm(prompt: string | unknown, model?: string, jsonMode?: boolean): Promise<string> {
    try {
      if (typeof window !== 'undefined' && window.spark?.llm) {
        const promptString = typeof prompt === 'string' ? prompt : String(prompt)
        return await window.spark.llm(promptString, model, jsonMode)
      }
    } catch (error) {
      if (shouldFallbackToLocalStorage(error)) {
        const errorType = isRateLimitError(error) ? 'rate limit' : 'authentication'
        logger.warn(`LLM ${errorType} error, returning fallback message`, { errorType })
        const message = isRateLimitError(error)
          ? 'LLM service temporarily unavailable due to rate limits. Please try again in a moment.'
          : 'LLM service unavailable: Authentication required. Please sign in to use AI features.'
        throw new Error(message)
      }
      throw error
    }
    
    throw new Error('LLM service not available')
  }
}

/**
 * Check if Spark is available and authenticated
 */
export function isSparkAvailable(): boolean {
  return typeof window !== 'undefined' && 
         window.spark !== undefined &&
         window.spark.kv !== undefined
}

/**
 * Show a helpful message about Spark authentication
 */
export function showSparkAuthMessage(): void {
  if (IS_DEV) {
    logger.warn(`
╔══════════════════════════════════════════════════════════════╗
║  Spark Authentication Required                               ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  This app requires GitHub Spark authentication.              ║
║  The app is running in fallback mode using localStorage.     ║
║                                                              ║
║  To use Spark features:                                      ║
║  1. Run this app in a GitHub Codespace                       ║
║  2. Or configure Spark authentication                        ║
║                                                              ║
║  The app will continue to work using localStorage for        ║
║  development purposes.                                       ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
    `)
  }
}

// Show message on first load if Spark is not available
if (typeof window !== 'undefined' && IS_DEV) {
  setTimeout(() => {
    if (!isSparkAvailable()) {
      showSparkAuthMessage()
    }
  }, 1000)
}

