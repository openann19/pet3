/**
 * useStorage Hook Tests
 * Comprehensive test coverage for the storage hook
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useStorage } from '../use-storage'

// Mock localStorage
const createMockStorage = () => {
  const store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach(key => delete store[key])
    }),
    get length() {
      return Object.keys(store).length
    },
    key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
  }
}

describe('useStorage', () => {
  let mockStorage: ReturnType<typeof createMockStorage>

  beforeEach(() => {
    mockStorage = createMockStorage()
    
    // Mock window.localStorage
    Object.defineProperty(window, 'localStorage', {
      value: mockStorage,
      writable: true,
      configurable: true,
    })
  })

  describe('initialization', () => {
    it('should initialize with default value when key does not exist', () => {
      const { result } = renderHook(() => useStorage('test-key', 'default-value'))

      expect(result.current[0]).toBe('default-value')
    })

    it('should load value from storage when key exists', () => {
      mockStorage.setItem('test-key', JSON.stringify('stored-value'))

      const { result } = renderHook(() => useStorage('test-key', 'default-value'))

      expect(result.current[0]).toBe('stored-value')
    })

    it('should handle complex objects', () => {
      const complexObject = { name: 'Test', count: 42, nested: { value: true } }
      mockStorage.setItem('test-key', JSON.stringify(complexObject))

      const { result } = renderHook(() => useStorage('test-key', {}))

      expect(result.current[0]).toEqual(complexObject)
    })

    it('should handle arrays', () => {
      const arrayValue = [1, 2, 3, 'test']
      mockStorage.setItem('test-key', JSON.stringify(arrayValue))

      const { result } = renderHook(() => useStorage('test-key', []))

      expect(result.current[0]).toEqual(arrayValue)
    })

    it('should handle numbers', () => {
      mockStorage.setItem('test-key', JSON.stringify(42))

      const { result } = renderHook(() => useStorage('test-key', 0))

      expect(result.current[0]).toBe(42)
    })

    it('should handle booleans', () => {
      mockStorage.setItem('test-key', JSON.stringify(true))

      const { result } = renderHook(() => useStorage('test-key', false))

      expect(result.current[0]).toBe(true)
    })
  })

  describe('setValue', () => {
    it('should update value and persist to storage', () => {
      const { result } = renderHook(() => useStorage('test-key', 'initial'))

      act(() => {
        result.current[1]('updated')
      })

      expect(result.current[0]).toBe('updated')
      expect(mockStorage.setItem).toHaveBeenCalledWith('test-key', JSON.stringify('updated'))
    })

    it('should update value with function updater', () => {
      const { result } = renderHook(() => useStorage('test-key', 0))

      act(() => {
        result.current[1]((prev: number) => prev + 1)
      })

      expect(result.current[0]).toBe(1)

      act(() => {
        result.current[1]((prev: number) => prev + 5)
      })

      expect(result.current[0]).toBe(6)
    })

    it('should handle object updates', () => {
      const { result } = renderHook(() => useStorage('test-key', { count: 0 }))

      act(() => {
        result.current[1]({ count: 10, name: 'Test' })
      })

      expect(result.current[0]).toEqual({ count: 10, name: 'Test' })
      expect(mockStorage.setItem).toHaveBeenCalledWith(
        'test-key',
        JSON.stringify({ count: 10, name: 'Test' })
      )
    })

    it('should handle array updates', () => {
      const { result } = renderHook(() => useStorage('test-key', [1, 2]))

      act(() => {
        result.current[1]([1, 2, 3, 4])
      })

      expect(result.current[0]).toEqual([1, 2, 3, 4])
    })

    it('should handle function updater with objects', () => {
      const { result } = renderHook(() => useStorage('test-key', { count: 0 }))

      act(() => {
        result.current[1]((prev: { count: number }) => ({ ...prev, count: prev.count + 1 }))
      })

      expect(result.current[0]).toEqual({ count: 1 })
    })
  })

  describe('deleteValue', () => {
    it('should remove value from storage and reset to default', () => {
      mockStorage.setItem('test-key', JSON.stringify('stored-value'))

      const { result } = renderHook(() => useStorage('test-key', 'default-value'))

      expect(result.current[0]).toBe('stored-value')

      act(() => {
        result.current[2]()
      })

      expect(result.current[0]).toBe('default-value')
      expect(mockStorage.removeItem).toHaveBeenCalledWith('test-key')
    })

    it('should reset to default when deleting', () => {
      const { result } = renderHook(() => useStorage('test-key', { default: true }))

      act(() => {
        result.current[1]({ custom: 'value' })
      })

      expect(result.current[0]).toEqual({ custom: 'value' })

      act(() => {
        result.current[2]()
      })

      expect(result.current[0]).toEqual({ default: true })
    })
  })

  describe('key changes', () => {
    it('should load new value when key changes', () => {
      mockStorage.setItem('key-1', JSON.stringify('value-1'))
      mockStorage.setItem('key-2', JSON.stringify('value-2'))

      const { result, rerender } = renderHook(
        ({ key }: { key: string }) => useStorage(key, 'default'),
        {
          initialProps: { key: 'key-1' },
        }
      )

      expect(result.current[0]).toBe('value-1')

      rerender({ key: 'key-2' })

      expect(result.current[0]).toBe('value-2')
    })

    it('should use default when new key does not exist', () => {
      mockStorage.setItem('key-1', JSON.stringify('value-1'))

      const { result, rerender } = renderHook(
        ({ key }: { key: string }) => useStorage(key, 'default'),
        {
          initialProps: { key: 'key-1' },
        }
      )

      expect(result.current[0]).toBe('value-1')

      rerender({ key: 'key-2' })

      expect(result.current[0]).toBe('default')
    })
  })

  describe('error handling', () => {
    it('should handle localStorage unavailable (SSR)', () => {
      // Mock window as undefined
      const originalWindow = global.window
      // @ts-expect-error - intentionally setting to undefined for SSR test
      global.window = undefined

      const { result } = renderHook(() => useStorage('test-key', 'default-value'))

      expect(result.current[0]).toBe('default-value')

      act(() => {
        result.current[1]('updated')
      })

      // Should not throw, but value won't persist
      expect(result.current[0]).toBe('updated')

      // Restore window
      global.window = originalWindow
    })

    it('should handle localStorage unavailable (private mode)', () => {
      // Mock localStorage to throw on access
      Object.defineProperty(window, 'localStorage', {
        value: null,
        writable: true,
        configurable: true,
      })

      const { result } = renderHook(() => useStorage('test-key', 'default-value'))

      expect(result.current[0]).toBe('default-value')

      act(() => {
        result.current[1]('updated')
      })

      // Should not throw
      expect(result.current[0]).toBe('updated')
    })

    it('should handle corrupted JSON in storage', () => {
      mockStorage.setItem('test-key', 'invalid json {')

      const { result } = renderHook(() => useStorage('test-key', 'default-value'))

      // Should fall back to default value
      expect(result.current[0]).toBe('default-value')
    })

    it('should handle storage quota exceeded', () => {
      mockStorage.setItem.mockImplementationOnce(() => {
        const error = new Error('QuotaExceededError')
        error.name = 'QuotaExceededError'
        throw error
      })

      const { result } = renderHook(() => useStorage('test-key', 'default'))

      act(() => {
        result.current[1]('updated')
      })

      // Should not throw, but value may not persist
      expect(result.current[0]).toBe('updated')
    })

    it('should handle getItem throwing error', () => {
      mockStorage.getItem.mockImplementationOnce(() => {
        throw new Error('Storage error')
      })

      const { result } = renderHook(() => useStorage('test-key', 'default-value'))

      // Should fall back to default
      expect(result.current[0]).toBe('default-value')
    })

    it('should handle removeItem throwing error', () => {
      mockStorage.removeItem.mockImplementationOnce(() => {
        throw new Error('Remove error')
      })

      const { result } = renderHook(() => useStorage('test-key', 'default-value'))

      act(() => {
        result.current[1]('value')
      })

      act(() => {
        result.current[2]()
      })

      // Should reset to default even if removeItem fails
      expect(result.current[0]).toBe('default-value')
    })
  })

  describe('default value handling', () => {
    it('should use default value when storage is empty', () => {
      const { result } = renderHook(() => useStorage('test-key', { count: 0 }))

      expect(result.current[0]).toEqual({ count: 0 })
    })

    it('should update default value ref when it changes', () => {
      const { result, rerender } = renderHook(
        ({ defaultValue }: { defaultValue: string }) => useStorage('test-key', defaultValue),
        {
          initialProps: { defaultValue: 'default-1' },
        }
      )

      expect(result.current[0]).toBe('default-1')

      rerender({ defaultValue: 'default-2' })

      // Value should still be default-1 if not set
      expect(result.current[0]).toBe('default-1')

      // But deleteValue should use new default
      act(() => {
        result.current[1]('custom')
      })

      act(() => {
        result.current[2]()
      })

      expect(result.current[0]).toBe('default-2')
    })
  })

  describe('return value structure', () => {
    it('should return tuple with value, setValue, and deleteValue', () => {
      const { result } = renderHook(() => useStorage('test-key', 'default'))

      expect(Array.isArray(result.current)).toBe(true)
      expect(result.current).toHaveLength(3)
      expect(typeof result.current[0]).toBe('string')
      expect(typeof result.current[1]).toBe('function')
      expect(typeof result.current[2]).toBe('function')
    })

    it('should maintain stable function references', () => {
      const { result, rerender } = renderHook(() => useStorage('test-key', 'default'))

      const firstSetValue = result.current[1]
      const firstDeleteValue = result.current[2]

      rerender()

      expect(result.current[1]).toBe(firstSetValue)
      expect(result.current[2]).toBe(firstDeleteValue)
    })
  })

  describe('edge cases', () => {
    it('should handle null values', () => {
      mockStorage.setItem('test-key', JSON.stringify(null))

      const { result } = renderHook(() => useStorage('test-key', 'default'))

      expect(result.current[0]).toBeNull()
    })

    it('should handle undefined values by using default', () => {
      // localStorage.getItem returns null for missing keys, not undefined
      const { result } = renderHook(() => useStorage('test-key', 'default'))

      expect(result.current[0]).toBe('default')
    })

    it('should handle empty strings', () => {
      mockStorage.setItem('test-key', JSON.stringify(''))

      const { result } = renderHook(() => useStorage('test-key', 'default'))

      expect(result.current[0]).toBe('')
    })

    it('should handle zero values', () => {
      mockStorage.setItem('test-key', JSON.stringify(0))

      const { result } = renderHook(() => useStorage('test-key', 10))

      expect(result.current[0]).toBe(0)
    })

    it('should handle false values', () => {
      mockStorage.setItem('test-key', JSON.stringify(false))

      const { result } = renderHook(() => useStorage('test-key', true))

      expect(result.current[0]).toBe(false)
    })
  })
})

