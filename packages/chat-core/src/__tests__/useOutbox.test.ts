/**
 * useOutbox Hook Tests
 * Comprehensive test coverage for the outbox queue management hook
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
// @ts-expect-error - @testing-library/react types may not be fully available but works at runtime
import { renderHook, waitFor } from '@testing-library/react'
import { useOutbox, type OutboxItem, type UseOutboxReturn } from '../useOutbox'

// Helper to access result.current with type safety
// In test contexts, renderHook always returns a valid result, so type assertions are safe
// This helper centralizes the type assertion to avoid repetitive @ts-expect-error comments
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getCurrent = (result: any): UseOutboxReturn => {
  const current = result.current as unknown as UseOutboxReturn
  return current
}

// Mock window and navigator
const mockNavigator = {
  onLine: true,
}

Object.defineProperty(global, 'navigator', {
  value: mockNavigator,
  writable: true,
})

// Mock timers
vi.useFakeTimers()

describe('useOutbox', () => {
  let mockSendFn: (payload: unknown) => Promise<void>
  let mockStorage: {
    getItem: (key: string) => Promise<string | null>
    setItem: (key: string, value: string) => Promise<void>
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.clearAllTimers()
    
    mockSendFn = vi.fn<[unknown], Promise<void>>().mockResolvedValue(undefined)
    
    mockStorage = {
      getItem: vi.fn<[string], Promise<string | null>>().mockResolvedValue(null),
      setItem: vi.fn<[string, string], Promise<void>>().mockResolvedValue(undefined),
    }

    mockNavigator.onLine = true
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.useFakeTimers()
  })

  describe('initialization', () => {
    it('should initialize with default options', () => {
      const { result } = renderHook(() =>
        useOutbox({
          sendFn: mockSendFn,
        })
      )

      const current = getCurrent(result)
      expect(current.queue).toEqual([])
      expect(current.isOnline).toBe(true)
      expect(typeof current.enqueue).toBe('function')
      expect(typeof current.clear).toBe('function')
      expect(typeof current.flush).toBe('function')
    })

    it('should initialize with custom options', () => {
      const { result } = renderHook(() =>
        useOutbox({
          sendFn: mockSendFn,
          storageKey: 'custom-key',
          baseRetryDelay: 500,
          maxAttempts: 5,
          maxDelay: 10000,
          jitter: false,
        })
      )

      const current = getCurrent(result)
      expect(current.queue).toEqual([])
    })

    it('should initialize with storage', async () => {
      const storedQueue: OutboxItem[] = [
        {
          clientId: 'msg-1',
          payload: { text: 'Hello' },
          attempt: 0,
          nextAt: Date.now(),
          createdAt: Date.now() - 1000,
        },
      ]

      ;(mockStorage.getItem as ReturnType<typeof vi.fn>).mockResolvedValueOnce(JSON.stringify(storedQueue))

      const { result } = renderHook(() =>
        useOutbox({
          sendFn: mockSendFn,
          storage: mockStorage,
        })
      )

      await waitFor(() => {
        const current = getCurrent(result)
        expect(current.queue.length).toBeGreaterThan(0)
      })

      const current = getCurrent(result)
      expect(current.queue).toHaveLength(1)
      expect(current.queue[0]?.clientId).toBe('msg-1')
    })
  })

  describe('enqueue', () => {
    it('should add item to queue', () => {
      const { result } = renderHook(() =>
        useOutbox({
          sendFn: mockSendFn,
        })
      )

      const current = getCurrent(result)
      current.enqueue('msg-1', { text: 'Hello' })

      expect(current.queue).toHaveLength(1)
      expect(current.queue[0]?.clientId).toBe('msg-1')
      expect(current.queue[0]?.payload).toEqual({ text: 'Hello' })
      expect(current.queue[0]?.attempt).toBe(0)
    })

    it('should generate idempotency key when not provided', () => {
      const { result } = renderHook(() =>
        useOutbox({
          sendFn: mockSendFn,
        })
      )

      const current = getCurrent(result)
      current.enqueue('msg-1', { text: 'Hello' })

      expect(current.queue[0]?.idempotencyKey).toBeDefined()
      expect(typeof current.queue[0]?.idempotencyKey).toBe('string')
    })

    it('should use provided idempotency key', () => {
      const { result } = renderHook(() =>
        useOutbox({
          sendFn: mockSendFn,
        })
      )

      const current = getCurrent(result)
      current.enqueue('msg-1', { text: 'Hello' }, 'custom-key-123')

      expect(current.queue[0]?.idempotencyKey).toBe('custom-key-123')
    })

    it('should update existing item with same clientId', () => {
      const { result } = renderHook(() =>
        useOutbox({
          sendFn: mockSendFn,
        })
      )

      const current = getCurrent(result)
      current.enqueue('msg-1', { text: 'Hello' })
      current.enqueue('msg-1', { text: 'Updated' })

      expect(current.queue).toHaveLength(1)
      expect(current.queue[0]?.payload).toEqual({ text: 'Updated' })
      expect(current.queue[0]?.attempt).toBe(0)
    })

    it('should update existing item with same idempotency key', () => {
      const { result } = renderHook(() =>
        useOutbox({
          sendFn: mockSendFn,
        })
      )

      const current = getCurrent(result)
      current.enqueue('msg-1', { text: 'Hello' }, 'key-123')
      current.enqueue('msg-2', { text: 'Updated' }, 'key-123')

      expect(current.queue).toHaveLength(1)
      expect(current.queue[0]?.clientId).toBe('msg-2')
      expect(current.queue[0]?.payload).toEqual({ text: 'Updated' })
    })

    it('should add multiple items to queue', () => {
      const { result } = renderHook(() =>
        useOutbox({
          sendFn: mockSendFn,
        })
      )

      const current = getCurrent(result)
      current.enqueue('msg-1', { text: 'Hello' })
      current.enqueue('msg-2', { text: 'World' })
      current.enqueue('msg-3', { text: 'Test' })

      expect(current.queue).toHaveLength(3)
    })
  })

  describe('queue processing', () => {
    it('should process queue when online', async () => {
      const { result } = renderHook(() =>
        useOutbox({
          sendFn: mockSendFn,
        })
      )

      const current = getCurrent(result)
      current.enqueue('msg-1', { text: 'Hello' })

      await waitFor(
        () => {
          expect(mockSendFn).toHaveBeenCalledWith({ text: 'Hello' })
        },
        { timeout: 2000 }
      )

      await waitFor(() => {
        const currentAfter = getCurrent(result)
        expect(currentAfter.queue).toHaveLength(0)
      })
    })

    it('should not process queue when offline', async () => {
      mockNavigator.onLine = false

      const { result } = renderHook(() =>
        useOutbox({
          sendFn: mockSendFn,
        })
      )

      const current = getCurrent(result)
      current.enqueue('msg-1', { text: 'Hello' })

      // Advance timers
      await vi.advanceTimersByTimeAsync(1000)

      const currentAfter = getCurrent(result)
      expect(mockSendFn).not.toHaveBeenCalled()
      expect(currentAfter.queue).toHaveLength(1)
    })

    it('should retry failed sends with exponential backoff', async () => {
      let attemptCount = 0
      ;(mockSendFn as ReturnType<typeof vi.fn>).mockImplementation(() => {
        attemptCount++
        if (attemptCount < 3) {
          throw new Error('Network error')
        }
        return Promise.resolve()
      })

      const { result } = renderHook(() =>
        useOutbox({
          sendFn: mockSendFn,
          baseRetryDelay: 100,
          maxAttempts: 5,
        })
      )

      const current = getCurrent(result)
      current.enqueue('msg-1', { text: 'Hello' })

      // First attempt fails
      await vi.advanceTimersByTimeAsync(200)
      expect(mockSendFn).toHaveBeenCalledTimes(1)

      // Wait for retry delay (exponential backoff)
      await vi.advanceTimersByTimeAsync(300)
      expect(mockSendFn).toHaveBeenCalledTimes(2)

      // Wait for next retry
      await vi.advanceTimersByTimeAsync(500)
      expect(mockSendFn).toHaveBeenCalledTimes(3)

      // Should succeed on third attempt
      await waitFor(() => {
        const current = getCurrent(result)
        expect(current.queue).toHaveLength(0)
      })
    })

    it('should remove item after max attempts exceeded', async () => {
      ;(mockSendFn as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Persistent error'))

      const { result } = renderHook(() =>
        useOutbox({
          sendFn: mockSendFn,
          baseRetryDelay: 50,
          maxAttempts: 3,
        })
      )

      const current = getCurrent(result)
      current.enqueue('msg-1', { text: 'Hello' })

      // Process through all attempts
      for (let i = 0; i < 3; i++) {
        await vi.advanceTimersByTimeAsync(200)
      }

      await waitFor(() => {
        const current = getCurrent(result)
        expect(current.queue).toHaveLength(0)
      })

      expect(mockSendFn).toHaveBeenCalledTimes(3)
    })

    it('should process multiple items in queue', async () => {
      const { result } = renderHook(() =>
        useOutbox({
          sendFn: mockSendFn,
        })
      )

      const current = getCurrent(result)
      current.enqueue('msg-1', { text: 'Hello' })
      current.enqueue('msg-2', { text: 'World' })
      current.enqueue('msg-3', { text: 'Test' })

      await waitFor(
        () => {
          expect(mockSendFn).toHaveBeenCalledTimes(3)
        },
        { timeout: 2000 }
      )

      await waitFor(() => {
        const current = getCurrent(result)
        expect(current.queue).toHaveLength(0)
      })
    })

    it('should call onFlush callback after processing', async () => {
      const onFlush = vi.fn()

      const { result } = renderHook(() =>
        useOutbox({
          sendFn: mockSendFn,
          onFlush,
        })
      )

      const current = getCurrent(result)
      current.enqueue('msg-1', { text: 'Hello' })

      await waitFor(
        () => {
          expect(onFlush).toHaveBeenCalled()
        },
        { timeout: 2000 }
      )
    })
  })

  describe('storage integration', () => {
    it('should load queue from storage on mount', async () => {
      const storedQueue: OutboxItem[] = [
        {
          clientId: 'msg-1',
          payload: { text: 'Hello' },
          attempt: 0,
          nextAt: Date.now(),
          createdAt: Date.now() - 1000,
        },
        {
          clientId: 'msg-2',
          payload: { text: 'World' },
          attempt: 1,
          nextAt: Date.now() + 1000,
          createdAt: Date.now() - 2000,
        },
      ]

      ;(mockStorage.getItem as ReturnType<typeof vi.fn>).mockResolvedValueOnce(JSON.stringify(storedQueue))

      const { result } = renderHook(() =>
        useOutbox({
          sendFn: mockSendFn,
          storage: mockStorage,
        })
      )

      await waitFor(() => {
        const current = getCurrent(result)
        expect(current.queue.length).toBe(2)
      })

      const current = getCurrent(result)
      expect(current.queue[0]?.clientId).toBe('msg-1')
      expect(current.queue[1]?.clientId).toBe('msg-2')
    })

    it('should save queue to storage when it changes', async () => {
      const { result } = renderHook(() =>
        useOutbox({
          sendFn: mockSendFn,
          storage: mockStorage,
        })
      )

      await waitFor(() => {
        expect(mockStorage.getItem).toHaveBeenCalled()
      })

      const current = getCurrent(result)
      current.enqueue('msg-1', { text: 'Hello' })

      await waitFor(() => {
        expect(mockStorage.setItem).toHaveBeenCalled()
      })

      const setItemCalls = (mockStorage.setItem as ReturnType<typeof vi.fn>).mock.calls
      const lastCall = setItemCalls[setItemCalls.length - 1]
      if (lastCall !== undefined && lastCall[1] !== undefined) {
        const savedQueue = JSON.parse(lastCall[1] as string) as OutboxItem[]
        expect(savedQueue).toHaveLength(1)
        expect(savedQueue[0]?.clientId).toBe('msg-1')
      }
    })

    it('should handle corrupted storage data', async () => {
      ;(mockStorage.getItem as ReturnType<typeof vi.fn>).mockResolvedValueOnce('invalid json')

      const { result } = renderHook(() =>
        useOutbox({
          sendFn: mockSendFn,
          storage: mockStorage,
        })
      )

      await waitFor(() => {
        const current = getCurrent(result)
        expect(current.queue).toEqual([])
      })
    })

    it('should handle storage read failure', async () => {
      ;(mockStorage.getItem as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Storage error'))

      const { result } = renderHook(() =>
        useOutbox({
          sendFn: mockSendFn,
          storage: mockStorage,
        })
      )

      await waitFor(() => {
        const current = getCurrent(result)
        expect(current.queue).toEqual([])
      })
    })

    it('should handle storage write failure gracefully', async () => {
      ;(mockStorage.setItem as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Quota exceeded'))

      const { result } = renderHook(() =>
        useOutbox({
          sendFn: mockSendFn,
          storage: mockStorage,
        })
      )

      const current = getCurrent(result)
      current.enqueue('msg-1', { text: 'Hello' })

      // Should not throw error
      await waitFor(() => {
        const currentAfter = getCurrent(result)
        expect(currentAfter.queue).toHaveLength(1)
      })
    })

    it('should handle non-array storage data', async () => {
      ;(mockStorage.getItem as ReturnType<typeof vi.fn>).mockResolvedValueOnce(JSON.stringify({ invalid: 'data' }))

      const { result } = renderHook(() =>
        useOutbox({
          sendFn: mockSendFn,
          storage: mockStorage,
        })
      )

      await waitFor(() => {
        const current = getCurrent(result)
        expect(current.queue).toEqual([])
      })
    })
  })

  describe('online/offline handling', () => {
    it('should resume processing when coming online', async () => {
      mockNavigator.onLine = false

      const { result } = renderHook(() =>
        useOutbox({
          sendFn: mockSendFn,
        })
      )

      const current = getCurrent(result)
      current.enqueue('msg-1', { text: 'Hello' })

      // Should not process while offline
      await vi.advanceTimersByTimeAsync(1000)
      expect(mockSendFn).not.toHaveBeenCalled()

      // Go online
      mockNavigator.onLine = true
      window.dispatchEvent(new Event('online'))

      await waitFor(
        () => {
          expect(mockSendFn).toHaveBeenCalled()
        },
        { timeout: 2000 }
      )
    })

    it('should pause processing when going offline', async () => {
      const { result } = renderHook(() =>
        useOutbox({
          sendFn: mockSendFn,
        })
      )

      const current = getCurrent(result)
      current.enqueue('msg-1', { text: 'Hello' })

      // Start processing
      await vi.advanceTimersByTimeAsync(100)

      // Go offline
      mockNavigator.onLine = false
      window.dispatchEvent(new Event('offline'))

      // Should stop processing new items
      current.enqueue('msg-2', { text: 'World' })
      await vi.advanceTimersByTimeAsync(1000)

      // First message may have been processed, but second should not
      expect(current.queue.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('flush', () => {
    it('should manually process queue when online', async () => {
      const { result } = renderHook(() =>
        useOutbox({
          sendFn: mockSendFn,
        })
      )

      const current = getCurrent(result)
      current.enqueue('msg-1', { text: 'Hello' })

      await current.flush()

      expect(mockSendFn).toHaveBeenCalledWith({ text: 'Hello' })
      await waitFor(() => {
        const currentAfter = getCurrent(result)
        expect(currentAfter.queue).toHaveLength(0)
      })
    })

    it('should not process queue when offline', async () => {
      mockNavigator.onLine = false

      const { result } = renderHook(() =>
        useOutbox({
          sendFn: mockSendFn,
        })
      )

      const current = getCurrent(result)
      current.enqueue('msg-1', { text: 'Hello' })

      await current.flush()

      expect(mockSendFn).not.toHaveBeenCalled()
      expect(current.queue).toHaveLength(1)
    })
  })

  describe('clear', () => {
    it('should clear queue', () => {
      const { result } = renderHook(() =>
        useOutbox({
          sendFn: mockSendFn,
        })
      )

      const current = getCurrent(result)
      current.enqueue('msg-1', { text: 'Hello' })
      current.enqueue('msg-2', { text: 'World' })

      expect(current.queue).toHaveLength(2)

      current.clear()

      expect(current.queue).toHaveLength(0)
    })

    it('should clear timers when clearing queue', () => {
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout')

      const { result } = renderHook(() =>
        useOutbox({
          sendFn: mockSendFn,
        })
      )

      const current = getCurrent(result)
      current.enqueue('msg-1', { text: 'Hello' })
      current.clear()

      expect(clearTimeoutSpy).toHaveBeenCalled()
    })
  })

  describe('edge cases', () => {
    it('should handle empty queue gracefully', async () => {
      const { result } = renderHook(() =>
        useOutbox({
          sendFn: mockSendFn,
        })
      )

      const current = getCurrent(result)
      await current.flush()

      expect(mockSendFn).not.toHaveBeenCalled()
    })

    it('should handle sendFn that throws synchronously', async () => {
      ;(mockSendFn as ReturnType<typeof vi.fn>).mockImplementation(() => {
        throw new Error('Sync error')
      })

      const { result } = renderHook(() =>
        useOutbox({
          sendFn: mockSendFn,
          baseRetryDelay: 50,
          maxAttempts: 2,
        })
      )

      const current = getCurrent(result)
      current.enqueue('msg-1', { text: 'Hello' })

      await vi.advanceTimersByTimeAsync(200)

      await waitFor(() => {
        const currentAfter = getCurrent(result)
        expect(currentAfter.queue).toHaveLength(0)
      })
    })

    it('should handle items with future nextAt times', async () => {
      const { result } = renderHook(() =>
        useOutbox({
          sendFn: mockSendFn,
        })
      )

      // Manually add item with future time (simulating retry)
      const futureTime = Date.now() + 5000
      const current = getCurrent(result)
      current.enqueue('msg-1', { text: 'Hello' })

      // Modify queue item to have future time
      const queue = current.queue
      if (queue[0] !== undefined) {
        queue[0].nextAt = futureTime
      }

      await vi.advanceTimersByTimeAsync(1000)

      // Should not process yet
      expect(mockSendFn).not.toHaveBeenCalled()
    })

    it('should handle storage key changes', async () => {
      const { result, rerender } = renderHook(
        ({ storageKey }: { storageKey: string }) =>
          useOutbox({
            sendFn: mockSendFn,
            storage: mockStorage,
            storageKey,
          }),
        {
          initialProps: { storageKey: 'key-1' },
        }
      )

      const current = getCurrent(result)
      current.enqueue('msg-1', { text: 'Hello' })

      await waitFor(() => {
        expect(mockStorage.setItem).toHaveBeenCalledWith('key-1', expect.any(String))
      })

      rerender({ storageKey: 'key-2' })

      await waitFor(() => {
        expect(mockStorage.getItem).toHaveBeenCalledWith('key-2')
      })
    })
  })
})

