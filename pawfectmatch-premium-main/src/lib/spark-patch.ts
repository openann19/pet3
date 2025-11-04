/**
 * Spark API Patch
 * 
 * Patches window.spark APIs to fall back to localStorage when authentication fails
 * This allows the app to work in local development without Spark authentication
 */

import { createLogger } from './logger'

const logger = createLogger('SparkPatch')

const STORAGE_PREFIX = 'spark-fallback:'
const IS_DEV = import.meta.env.DEV || window.location.hostname === 'localhost'

function isAuthError(error: unknown): boolean {
  if (!error) return false
  const errorObj = error as { message?: string; status?: number; statusCode?: number }
  const message = String(errorObj?.message || error || '').toLowerCase()
  const status = errorObj?.status || errorObj?.statusCode
  return (
    status === 401 ||
    message.includes('unauthorized') ||
    message.includes('401')
  )
}

function isRateLimitError(error: unknown): boolean {
  if (!error) return false
  const errorObj = error as { message?: string; status?: number; statusCode?: number; response?: { status?: number } }
  const message = String(errorObj?.message || error || '').toLowerCase()
  // Check status on error object or nested response object
  const status = errorObj?.status || errorObj?.statusCode || errorObj?.response?.status
  return (
    status === 403 ||
    status === 429 ||
    message.includes('rate limit') ||
    message.includes('rate limit exceeded') ||
    message.includes('403') ||
    message.includes('429')
  )
}

function shouldFallbackToLocalStorage(error: unknown): boolean {
  return isAuthError(error) || isRateLimitError(error)
}

function getLocalStorage<T>(key: string): T | null {
  try {
    const item = localStorage.getItem(`${STORAGE_PREFIX}${key}`)
    return item ? JSON.parse(item) : null
  } catch {
    return null
  }
}

function setLocalStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(value))
  } catch (error) {
    logger.warn(`Failed to save to localStorage for key ${key}`, error instanceof Error ? error : new Error(String(error)))
  }
}

function deleteLocalStorage(key: string): void {
  try {
    localStorage.removeItem(`${STORAGE_PREFIX}${key}`)
  } catch (error) {
    logger.warn(`Failed to delete from localStorage for key ${key}`, error instanceof Error ? error : new Error(String(error)))
  }
}

function getLocalStorageKeys(): string[] {
  const keys: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith(STORAGE_PREFIX)) {
      keys.push(key.substring(STORAGE_PREFIX.length))
    }
  }
  return keys
}

/**
 * Patch Spark KV API
 */
function patchSparkKV() {
  if (typeof window === 'undefined' || !window.spark?.kv) {
    return
  }

  const originalGet = window.spark.kv.get.bind(window.spark.kv)
  const originalSet = window.spark.kv.set.bind(window.spark.kv)
  const originalDelete = window.spark.kv.delete?.bind(window.spark.kv)
  const originalKeys = window.spark.kv.keys?.bind(window.spark.kv)

  // Patch get
  window.spark.kv.get = async function<T = unknown>(key: string): Promise<T | undefined> {
    try {
      const value = await originalGet(key) as T | undefined
      // Cache successful reads
      if (value !== null && value !== undefined) {
        setLocalStorage(key, value)
      }
      return value
    } catch (error) {
      if (shouldFallbackToLocalStorage(error)) {
        const errorType = isRateLimitError(error) ? 'Rate limit' : 'Auth'
        logger.warn(`${errorType} error for ${key}, using localStorage fallback`)
        const fallback = getLocalStorage<T>(key)
        return fallback ?? undefined
      }
      throw error
    }
  } as typeof originalGet

  // Patch set
  window.spark.kv.set = async function<T = unknown>(key: string, value: T): Promise<void> {
    // Always save to localStorage as backup
    setLocalStorage(key, value)
    
    try {
      await originalSet(key, value)
    } catch (error) {
      if (shouldFallbackToLocalStorage(error)) {
        const errorType = isRateLimitError(error) ? 'Rate limit' : 'Auth'
        logger.warn(`${errorType} error setting ${key}, saved to localStorage only`)
        return
      }
      throw error
    }
  } as any

  // Patch delete
  if (originalDelete) {
    window.spark.kv.delete = async function(key: string): Promise<void> {
      deleteLocalStorage(key)
      
      try {
        await originalDelete(key)
      } catch (error) {
        if (shouldFallbackToLocalStorage(error)) {
          const errorType = isRateLimitError(error) ? 'Rate limit' : 'Auth'
          logger.warn(`${errorType} error deleting ${key}, deleted from localStorage only`)
          return
        }
        throw error
      }
    }
  }

  // Patch keys
  if (originalKeys) {
    window.spark.kv.keys = async function(): Promise<string[]> {
      try {
        return await originalKeys()
      } catch (error) {
        if (shouldFallbackToLocalStorage(error)) {
          const errorType = isRateLimitError(error) ? 'Rate limit' : 'Auth'
          logger.warn(`${errorType} error getting keys, using localStorage fallback`)
          return getLocalStorageKeys()
        }
        throw error
      }
    }
  }
}

/**
 * Patch Spark User API
 */
function patchSparkUser() {
  if (typeof window === 'undefined' || !window.spark?.user) {
    return
  }

  const originalUser = window.spark.user.bind(window.spark)

  window.spark.user = async function(): Promise<UserInfo> {
    try {
      const userResult = await originalUser()
      const user = userResult as unknown as UserInfo
      if (user) {
        setLocalStorage('current-user', user)
      }
      return user
    } catch (error) {
      if (shouldFallbackToLocalStorage(error)) {
        const errorType = isRateLimitError(error) ? 'Rate limit' : 'Auth'
        logger.warn(`${errorType} error getting user, using localStorage fallback`)
        const cachedUser = getLocalStorage<UserInfo>('current-user')
        if (cachedUser) {
          return cachedUser
        }
        // Return guest user matching UserInfo format
        return {
          id: `guest-${Date.now()}`,
          login: '',
          avatarUrl: '',
          email: '',
          isOwner: false
        }
      }
      throw error
    }
  } as typeof originalUser
}

/**
 * Patch Spark LLM API
 */
function patchSparkLLM() {
  if (typeof window === 'undefined' || !window.spark?.llm) {
    return
  }

  const originalLLM = window.spark.llm.bind(window.spark)

  window.spark.llm = async function(prompt: string | unknown, model?: string, jsonMode?: boolean): Promise<string> {
    try {
      const promptString = typeof prompt === 'string' ? prompt : String(prompt)
      return await originalLLM(promptString, model, jsonMode)
    } catch (error) {
      if (shouldFallbackToLocalStorage(error)) {
        const errorType = isRateLimitError(error) ? 'rate limit' : 'authentication'
        logger.warn(`LLM ${errorType} error, returning fallback message`)
        const message = isRateLimitError(error)
          ? 'LLM service temporarily unavailable due to rate limits. Please try again in a moment.'
          : 'LLM service unavailable: Authentication required. Please sign in to use AI features.'
        throw new Error(message)
      }
      throw error
    }
  }
}

/**
 * Initialize Spark patches
 */
export function initSparkPatch() {
  if (typeof window === 'undefined') {
    return
  }

  // Wait for Spark to be available
  const checkSpark = setInterval(() => {
    if (window.spark) {
      clearInterval(checkSpark)
      
      patchSparkKV()
      patchSparkUser()
      patchSparkLLM()
      
      if (IS_DEV) {
        logger.info('Spark APIs patched with localStorage fallback')
      }
    }
  }, 100)

  // Timeout after 5 seconds
  setTimeout(() => {
    clearInterval(checkSpark)
    if (IS_DEV && !window.spark) {
      logger.warn('Spark Not Available - Using localStorage fallback. Running in development mode with localStorage fallback. The app will work but some features may be limited.')
    }
  }, 5000)
}

// Auto-initialize if in browser
if (typeof window !== 'undefined') {
  // Initialize immediately and also wait for DOM
  initSparkPatch()
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSparkPatch)
  }
}

