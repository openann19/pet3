/**
 * Storage Service
 * 
 * Unified storage API using IndexedDB for large data and localStorage for small config.
 * Replaces window.spark.kv functionality.
 */

import { createLogger } from './logger'

const logger = createLogger('StorageService')

const DB_NAME = 'petspark-db'
const DB_VERSION = 1
const STORE_NAME = 'kv-store'
const LOCAL_STORAGE_PREFIX = 'petspark:'
const MAX_LOCALSTORAGE_SIZE = 5 * 1024 * 1024 // 5MB threshold

// Keys that should always use localStorage (small config values)
const LOCALSTORAGE_KEYS = new Set([
  'app-language',
  'theme',
  'notification-preferences',
  'last-notification-check',
  'has-seen-welcome-v2',
  'is-authenticated',
  'data-initialized',
])

interface StorageItem<T = unknown> {
  key: string
  value: T
  timestamp: number
}

class StorageService {
  private db: IDBDatabase | null = null
  private initPromise: Promise<void> | null = null
  private inMemoryCache: Map<string, { value: unknown; timestamp: number }> = new Map()
  private cacheTTL = 5000 // 5 seconds

  /**
   * Initialize IndexedDB
   */
  async initDB(): Promise<void> {
    if (this.db) return

    if (this.initPromise) {
      return this.initPromise
    }

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => {
        const error = request.error || new Error('Failed to open IndexedDB')
        logger.error('Failed to open IndexedDB', error instanceof Error ? error : new Error(String(error)))
        reject(error)
      }

      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'key' })
        }
      }
    })

    return this.initPromise
  }

  /**
   * Check if a key should use localStorage
   */
  private shouldUseLocalStorage(key: string): boolean {
    return LOCALSTORAGE_KEYS.has(key) || key.length < 50
  }

  /**
   * Estimate size of a value in bytes
   */
  private estimateSize(value: unknown): number {
    try {
      return JSON.stringify(value).length
    } catch {
      return 0
    }
  }

  /**
   * Get value from localStorage
   */
  private getFromLocalStorage<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}${key}`)
      if (!item) return null
      return JSON.parse(item) as T
    } catch (error) {
      logger.warn(`Failed to read from localStorage for key ${key}`, { error: error instanceof Error ? error.message : String(error) })
      return null
    }
  }

  /**
   * Set value in localStorage
   */
  private setToLocalStorage<T>(key: string, value: T): void {
    try {
      localStorage.setItem(`${LOCAL_STORAGE_PREFIX}${key}`, JSON.stringify(value))
    } catch (error) {
      logger.warn(`Failed to write to localStorage for key ${key}`, { error: error instanceof Error ? error.message : String(error) })
    }
  }

  /**
   * Delete value from localStorage
   */
  private deleteFromLocalStorage(key: string): void {
    try {
      localStorage.removeItem(`${LOCAL_STORAGE_PREFIX}${key}`)
    } catch (error) {
      logger.warn(`Failed to delete from localStorage for key ${key}`, { error: error instanceof Error ? error.message : String(error) })
    }
  }

  /**
   * Get value from IndexedDB
   */
  private async getFromIndexedDB<T>(key: string): Promise<T | null> {
    if (!this.db) {
      await this.initDB()
    }

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'))
        return
      }

      const transaction = this.db.transaction([STORE_NAME], 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.get(key)

      request.onerror = () => {
        reject(request.error)
      }

      request.onsuccess = () => {
        const item = request.result as StorageItem<T> | undefined
        resolve(item ? item.value : null)
      }
    })
  }

  /**
   * Set value in IndexedDB
   */
  private async setToIndexedDB<T>(key: string, value: T): Promise<void> {
    if (!this.db) {
      await this.initDB()
    }

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'))
        return
      }

      const transaction = this.db.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const item: StorageItem<T> = {
        key,
        value,
        timestamp: Date.now(),
      }
      const request = store.put(item)

      request.onerror = () => {
        reject(request.error)
      }

      request.onsuccess = () => {
        resolve()
      }
    })
  }

  /**
   * Delete value from IndexedDB
   */
  private async deleteFromIndexedDB(key: string): Promise<void> {
    if (!this.db) {
      await this.initDB()
    }

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'))
        return
      }

      const transaction = this.db.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.delete(key)

      request.onerror = () => {
        reject(request.error)
      }

      request.onsuccess = () => {
        resolve()
      }
    })
  }

  /**
   * Get all keys from storage
   */
  async keys(): Promise<string[]> {
    const keys: string[] = []

    // Get keys from localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(LOCAL_STORAGE_PREFIX)) {
        keys.push(key.substring(LOCAL_STORAGE_PREFIX.length))
      }
    }

    // Get keys from IndexedDB
    try {
      if (!this.db) {
        await this.initDB()
      }

      if (this.db) {
        const transaction = this.db.transaction([STORE_NAME], 'readonly')
        const store = transaction.objectStore(STORE_NAME)
        const request = store.openCursor()

        await new Promise<void>((resolve, reject) => {
          request.onerror = () => reject(request.error)
          request.onsuccess = (event) => {
            const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result
            if (cursor) {
              keys.push(cursor.value.key)
              cursor.continue()
            } else {
              resolve()
            }
          }
        })
      }
    } catch (error) {
      logger.warn('Failed to get keys from IndexedDB', { error: error instanceof Error ? error.message : String(error) })
    }

    return [...new Set(keys)] // Remove duplicates
  }

  /**
   * Get a value from storage
   */
  async get<T = unknown>(key: string): Promise<T | undefined> {
    // Check in-memory cache first
    const cached = this.inMemoryCache.get(key)
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.value as T
    }

    let value: T | null = null

    if (this.shouldUseLocalStorage(key)) {
      value = this.getFromLocalStorage<T>(key)
    } else {
      try {
        value = await this.getFromIndexedDB<T>(key)
      } catch (error) {
        logger.warn(`Failed to read from IndexedDB for key ${key}, falling back to localStorage`, { error: error instanceof Error ? error.message : String(error) })
        value = this.getFromLocalStorage<T>(key)
      }
    }

    // Cache the result
    if (value !== null && value !== undefined) {
      this.inMemoryCache.set(key, { value, timestamp: Date.now() })
    }

    return value ?? undefined
  }

  /**
   * Set a value in storage
   */
  async set<T = unknown>(key: string, value: T): Promise<void> {
    // Update in-memory cache
    this.inMemoryCache.set(key, { value, timestamp: Date.now() })

    const size = this.estimateSize(value)

    if (this.shouldUseLocalStorage(key) || size < MAX_LOCALSTORAGE_SIZE) {
      this.setToLocalStorage(key, value)
      // Also store in IndexedDB as backup for large localStorage keys
      if (size >= MAX_LOCALSTORAGE_SIZE) {
        try {
          await this.setToIndexedDB(key, value)
        } catch (error) {
          logger.warn(`Failed to write to IndexedDB for key ${key}`, { error: error instanceof Error ? error.message : String(error) })
        }
      }
    } else {
      try {
        await this.setToIndexedDB(key, value)
      } catch (error) {
        logger.warn(`Failed to write to IndexedDB for key ${key}, falling back to localStorage`, { error: error instanceof Error ? error.message : String(error) })
        this.setToLocalStorage(key, value)
      }
    }
  }

  /**
   * Delete a value from storage
   */
  async delete(key: string): Promise<void> {
    // Remove from cache
    this.inMemoryCache.delete(key)

    // Delete from both storages
    this.deleteFromLocalStorage(key)
    try {
      await this.deleteFromIndexedDB(key)
    } catch (error) {
      logger.warn(`Failed to delete from IndexedDB for key ${key}`, { error: error instanceof Error ? error.message : String(error) })
    }
  }

  /**
   * Clear all storage
   */
  async clear(): Promise<void> {
    // Clear cache
    this.inMemoryCache.clear()

    // Clear localStorage
    const keysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(LOCAL_STORAGE_PREFIX)) {
        keysToRemove.push(key)
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key))

    // Clear IndexedDB
    try {
      if (!this.db) {
        await this.initDB()
      }

      if (this.db) {
        const transaction = this.db.transaction([STORE_NAME], 'readwrite')
        const store = transaction.objectStore(STORE_NAME)
        await store.clear()
      }
    } catch (error) {
      logger.warn('Failed to clear IndexedDB', { error: error instanceof Error ? error.message : String(error) })
    }
  }
}

// Export singleton instance
export const storage = new StorageService()

// Initialize on module load (but don't block)
if (typeof window !== 'undefined') {
  // Initialize asynchronously to avoid blocking
  storage.initDB().catch((error) => {
    logger.warn('Failed to initialize IndexedDB, using localStorage only', { error: error instanceof Error ? error.message : String(error) })
  })
}

