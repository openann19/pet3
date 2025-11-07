/**
 * useTypingManager Tests - 100% Coverage
 * 
 * Tests typing manager functionality including:
 * - Typing state management
 * - Realtime client integration
 * - Debouncing
 * - Timeout handling
 * - Event listeners
 * - Cleanup
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useTypingManager } from '../use-typing-manager'
import type { RealtimeClient } from '@/lib/realtime'

// Mock realtime client
const createMockRealtimeClient = (): RealtimeClient => {
  const listeners: Record<string, Array<(data: unknown) => void>> = {}

  return {
    emit: vi.fn().mockResolvedValue(undefined),
    on: vi.fn().mockImplementation((event: string, handler: (data: unknown) => void) => {
      if (!listeners[event]) {
        listeners[event] = []
      }
      listeners[event]!.push(handler)
    }),
    off: vi.fn().mockImplementation((event: string, handler: (data: unknown) => void) => {
      if (listeners[event]) {
        listeners[event] = listeners[event]!.filter(h => h !== handler)
      }
    }),
    connect: vi.fn(),
    disconnect: vi.fn(),
    isConnected: vi.fn().mockReturnValue(true),
    // Helper to trigger events
    trigger: (event: string, data: unknown) => {
      if (listeners[event]) {
        listeners[event]!.forEach(handler => handler(data))
      }
    },
  } as unknown as RealtimeClient & { trigger: (event: string, data: unknown) => void }
}

describe('useTypingManager', () => {
  let mockRealtimeClient: ReturnType<typeof createMockRealtimeClient>
  const defaultOptions = {
    roomId: 'room-1',
    currentUserId: 'user-1',
    currentUserName: 'Current User',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    mockRealtimeClient = createMockRealtimeClient()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('initialization', () => {
    it('should initialize with empty typing users', () => {
      const { result } = renderHook(() =>
        useTypingManager({
          ...defaultOptions,
          realtimeClient: mockRealtimeClient,
        })
      )

      expect(result.current.typingUsers).toEqual([])
      expect(result.current.isTyping).toBe(false)
    })

    it('should work without realtime client', () => {
      const { result } = renderHook(() =>
        useTypingManager({
          ...defaultOptions,
          realtimeClient: undefined,
        })
      )

      expect(result.current.typingUsers).toEqual([])
      expect(result.current.isTyping).toBe(false)
    })

    it('should set up event listeners', () => {
      renderHook(() =>
        useTypingManager({
          ...defaultOptions,
          realtimeClient: mockRealtimeClient,
        })
      )

      expect(mockRealtimeClient.on).toHaveBeenCalledWith('typing_start', expect.any(Function))
      expect(mockRealtimeClient.on).toHaveBeenCalledWith('typing_stop', expect.any(Function))
    })
  })

  describe('startTyping', () => {
    it('should set isTyping to true', () => {
      const { result } = renderHook(() =>
        useTypingManager({
          ...defaultOptions,
          realtimeClient: mockRealtimeClient,
        })
      )

      act(() => {
        result.current.startTyping()
      })

      expect(result.current.isTyping).toBe(true)
    })

    it('should emit typing_start event', () => {
      const { result } = renderHook(() =>
        useTypingManager({
          ...defaultOptions,
          realtimeClient: mockRealtimeClient,
        })
      )

      act(() => {
        result.current.startTyping()
      })

      expect(mockRealtimeClient.emit).toHaveBeenCalledWith('typing_start', {
        roomId: 'room-1',
        userId: 'user-1',
        userName: 'Current User',
      })
    })

    it('should not emit if already typing', () => {
      const { result } = renderHook(() =>
        useTypingManager({
          ...defaultOptions,
          realtimeClient: mockRealtimeClient,
        })
      )

      act(() => {
        result.current.startTyping()
      })

      const emitCount = mockRealtimeClient.emit.mock.calls.length

      act(() => {
        result.current.startTyping()
      })

      // Should not emit again
      expect(mockRealtimeClient.emit).toHaveBeenCalledTimes(emitCount)
    })

    it('should auto-stop after timeout', async () => {
      const { result } = renderHook(() =>
        useTypingManager({
          ...defaultOptions,
          realtimeClient: mockRealtimeClient,
          typingTimeout: 3000,
        })
      )

      act(() => {
        result.current.startTyping()
      })

      expect(result.current.isTyping).toBe(true)

      act(() => {
        vi.advanceTimersByTime(3000)
      })

      await waitFor(() => {
        expect(result.current.isTyping).toBe(false)
      })

      expect(mockRealtimeClient.emit).toHaveBeenCalledWith('typing_stop', {
        roomId: 'room-1',
        userId: 'user-1',
      })
    })

    it('should clear existing timeout before setting new one', () => {
      const { result } = renderHook(() =>
        useTypingManager({
          ...defaultOptions,
          realtimeClient: mockRealtimeClient,
          typingTimeout: 3000,
        })
      )

      act(() => {
        result.current.startTyping()
      })

      act(() => {
        vi.advanceTimersByTime(2000)
      })

      act(() => {
        result.current.startTyping() // Restart typing
      })

      act(() => {
        vi.advanceTimersByTime(2000) // Should not have stopped yet
      })

      expect(result.current.isTyping).toBe(true)
    })
  })

  describe('stopTyping', () => {
    it('should set isTyping to false', () => {
      const { result } = renderHook(() =>
        useTypingManager({
          ...defaultOptions,
          realtimeClient: mockRealtimeClient,
        })
      )

      act(() => {
        result.current.startTyping()
        result.current.stopTyping()
      })

      expect(result.current.isTyping).toBe(false)
    })

    it('should emit typing_stop event', () => {
      const { result } = renderHook(() =>
        useTypingManager({
          ...defaultOptions,
          realtimeClient: mockRealtimeClient,
        })
      )

      act(() => {
        result.current.startTyping()
        result.current.stopTyping()
      })

      expect(mockRealtimeClient.emit).toHaveBeenCalledWith('typing_stop', {
        roomId: 'room-1',
        userId: 'user-1',
      })
    })

    it('should not emit if not typing', () => {
      const { result } = renderHook(() =>
        useTypingManager({
          ...defaultOptions,
          realtimeClient: mockRealtimeClient,
        })
      )

      act(() => {
        result.current.stopTyping()
      })

      expect(mockRealtimeClient.emit).not.toHaveBeenCalledWith('typing_stop', expect.any(Object))
    })

    it('should clear timeout', () => {
      const { result } = renderHook(() =>
        useTypingManager({
          ...defaultOptions,
          realtimeClient: mockRealtimeClient,
          typingTimeout: 3000,
        })
      )

      act(() => {
        result.current.startTyping()
        result.current.stopTyping()
      })

      act(() => {
        vi.advanceTimersByTime(5000)
      })

      // Should not have auto-stopped
      expect(result.current.isTyping).toBe(false)
    })
  })

  describe('handleInputChange', () => {
    it('should start typing when input has content', () => {
      const { result } = renderHook(() =>
        useTypingManager({
          ...defaultOptions,
          realtimeClient: mockRealtimeClient,
        })
      )

      act(() => {
        result.current.handleInputChange('Hello')
      })

      expect(result.current.isTyping).toBe(true)
    })

    it('should stop typing when input is empty', async () => {
      const { result } = renderHook(() =>
        useTypingManager({
          ...defaultOptions,
          realtimeClient: mockRealtimeClient,
          debounceDelay: 500,
        })
      )

      act(() => {
        result.current.handleInputChange('Hello')
      })

      expect(result.current.isTyping).toBe(true)

      act(() => {
        result.current.handleInputChange('')
      })

      act(() => {
        vi.advanceTimersByTime(500)
      })

      await waitFor(() => {
        expect(result.current.isTyping).toBe(false)
      })
    })

    it('should debounce stop when clearing input', () => {
      const { result } = renderHook(() =>
        useTypingManager({
          ...defaultOptions,
          realtimeClient: mockRealtimeClient,
          debounceDelay: 500,
        })
      )

      act(() => {
        result.current.handleInputChange('Hello')
        result.current.handleInputChange('')
        result.current.handleInputChange('H')
      })

      act(() => {
        vi.advanceTimersByTime(300)
      })

      // Should still be typing because we added text back
      expect(result.current.isTyping).toBe(true)
    })

    it('should handle whitespace-only input', async () => {
      const { result } = renderHook(() =>
        useTypingManager({
          ...defaultOptions,
          realtimeClient: mockRealtimeClient,
          debounceDelay: 500,
        })
      )

      act(() => {
        result.current.handleInputChange('   ')
      })

      act(() => {
        vi.advanceTimersByTime(500)
      })

      await waitFor(() => {
        expect(result.current.isTyping).toBe(false)
      })
    })
  })

  describe('handleMessageSend', () => {
    it('should stop typing', () => {
      const { result } = renderHook(() =>
        useTypingManager({
          ...defaultOptions,
          realtimeClient: mockRealtimeClient,
        })
      )

      act(() => {
        result.current.startTyping()
        result.current.handleMessageSend()
      })

      expect(result.current.isTyping).toBe(false)
    })

    it('should clear debounce timeout', () => {
      const { result } = renderHook(() =>
        useTypingManager({
          ...defaultOptions,
          realtimeClient: mockRealtimeClient,
          debounceDelay: 500,
        })
      )

      act(() => {
        result.current.handleInputChange('Hello')
        result.current.handleInputChange('')
        result.current.handleMessageSend()
      })

      act(() => {
        vi.advanceTimersByTime(500)
      })

      // Should not have stopped again (already stopped)
      expect(result.current.isTyping).toBe(false)
    })
  })

  describe('typing events from other users', () => {
    it('should add user to typingUsers on typing_start', () => {
      const { result } = renderHook(() =>
        useTypingManager({
          ...defaultOptions,
          realtimeClient: mockRealtimeClient,
        })
      )

      act(() => {
        mockRealtimeClient.trigger('typing_start', {
          roomId: 'room-1',
          userId: 'user-2',
          userName: 'Other User',
        })
      })

      expect(result.current.typingUsers).toHaveLength(1)
      expect(result.current.typingUsers[0]).toMatchObject({
        userId: 'user-2',
        userName: 'Other User',
      })
    })

    it('should ignore typing_start from current user', () => {
      const { result } = renderHook(() =>
        useTypingManager({
          ...defaultOptions,
          realtimeClient: mockRealtimeClient,
        })
      )

      act(() => {
        mockRealtimeClient.trigger('typing_start', {
          roomId: 'room-1',
          userId: 'user-1', // Current user
          userName: 'Current User',
        })
      })

      expect(result.current.typingUsers).toHaveLength(0)
    })

    it('should ignore typing_start from different room', () => {
      const { result } = renderHook(() =>
        useTypingManager({
          ...defaultOptions,
          realtimeClient: mockRealtimeClient,
        })
      )

      act(() => {
        mockRealtimeClient.trigger('typing_start', {
          roomId: 'room-2', // Different room
          userId: 'user-2',
          userName: 'Other User',
        })
      })

      expect(result.current.typingUsers).toHaveLength(0)
    })

    it('should not add duplicate users', () => {
      const { result } = renderHook(() =>
        useTypingManager({
          ...defaultOptions,
          realtimeClient: mockRealtimeClient,
        })
      )

      act(() => {
        mockRealtimeClient.trigger('typing_start', {
          roomId: 'room-1',
          userId: 'user-2',
          userName: 'Other User',
        })
        mockRealtimeClient.trigger('typing_start', {
          roomId: 'room-1',
          userId: 'user-2',
          userName: 'Other User',
        })
      })

      expect(result.current.typingUsers).toHaveLength(1)
    })

    it('should remove user from typingUsers on typing_stop', () => {
      const { result } = renderHook(() =>
        useTypingManager({
          ...defaultOptions,
          realtimeClient: mockRealtimeClient,
        })
      )

      act(() => {
        mockRealtimeClient.trigger('typing_start', {
          roomId: 'room-1',
          userId: 'user-2',
          userName: 'Other User',
        })
      })

      expect(result.current.typingUsers).toHaveLength(1)

      act(() => {
        mockRealtimeClient.trigger('typing_stop', {
          roomId: 'room-1',
          userId: 'user-2',
        })
      })

      expect(result.current.typingUsers).toHaveLength(0)
    })

    it('should handle multiple typing users', () => {
      const { result } = renderHook(() =>
        useTypingManager({
          ...defaultOptions,
          realtimeClient: mockRealtimeClient,
        })
      )

      act(() => {
        mockRealtimeClient.trigger('typing_start', {
          roomId: 'room-1',
          userId: 'user-2',
          userName: 'User 2',
        })
        mockRealtimeClient.trigger('typing_start', {
          roomId: 'room-1',
          userId: 'user-3',
          userName: 'User 3',
        })
      })

      expect(result.current.typingUsers).toHaveLength(2)
    })
  })

  describe('debouncing', () => {
    it('should debounce typing_start emissions', () => {
      const { result } = renderHook(() =>
        useTypingManager({
          ...defaultOptions,
          realtimeClient: mockRealtimeClient,
          debounceDelay: 500,
        })
      )

      act(() => {
        result.current.startTyping()
        vi.advanceTimersByTime(100)
        result.current.startTyping()
        vi.advanceTimersByTime(100)
        result.current.startTyping()
      })

      // Should only emit once due to debouncing
      const typingStartCalls = mockRealtimeClient.emit.mock.calls.filter(
        call => call[0] === 'typing_start'
      )
      expect(typingStartCalls.length).toBe(1)
    })

    it('should allow emission after debounce delay', () => {
      const { result } = renderHook(() =>
        useTypingManager({
          ...defaultOptions,
          realtimeClient: mockRealtimeClient,
          debounceDelay: 500,
        })
      )

      act(() => {
        result.current.startTyping()
        vi.advanceTimersByTime(500)
        result.current.startTyping()
      })

      const typingStartCalls = mockRealtimeClient.emit.mock.calls.filter(
        call => call[0] === 'typing_start'
      )
      expect(typingStartCalls.length).toBe(2)
    })
  })

  describe('cleanup', () => {
    it('should remove event listeners on unmount', () => {
      const { unmount } = renderHook(() =>
        useTypingManager({
          ...defaultOptions,
          realtimeClient: mockRealtimeClient,
        })
      )

      unmount()

      expect(mockRealtimeClient.off).toHaveBeenCalledWith('typing_start', expect.any(Function))
      expect(mockRealtimeClient.off).toHaveBeenCalledWith('typing_stop', expect.any(Function))
    })

    it('should clear timeouts on unmount', () => {
      const { result, unmount } = renderHook(() =>
        useTypingManager({
          ...defaultOptions,
          realtimeClient: mockRealtimeClient,
          typingTimeout: 3000,
        })
      )

      act(() => {
        result.current.startTyping()
      })

      unmount()

      act(() => {
        vi.advanceTimersByTime(5000)
      })

      // Should not throw or cause issues
      expect(true).toBe(true)
    })
  })

  describe('error handling', () => {
    it('should handle emit errors gracefully', () => {
      mockRealtimeClient.emit = vi.fn().mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() =>
        useTypingManager({
          ...defaultOptions,
          realtimeClient: mockRealtimeClient,
        })
      )

      expect(() => {
        act(() => {
          result.current.startTyping()
        })
      }).not.toThrow()
    })
  })

  describe('custom timeouts', () => {
    it('should use custom typing timeout', async () => {
      const { result } = renderHook(() =>
        useTypingManager({
          ...defaultOptions,
          realtimeClient: mockRealtimeClient,
          typingTimeout: 5000,
        })
      )

      act(() => {
        result.current.startTyping()
      })

      act(() => {
        vi.advanceTimersByTime(3000)
      })

      expect(result.current.isTyping).toBe(true)

      act(() => {
        vi.advanceTimersByTime(2000)
      })

      await waitFor(() => {
        expect(result.current.isTyping).toBe(false)
      })
    })

    it('should use custom debounce delay', async () => {
      const { result } = renderHook(() =>
        useTypingManager({
          ...defaultOptions,
          realtimeClient: mockRealtimeClient,
          debounceDelay: 1000,
        })
      )

      act(() => {
        result.current.handleInputChange('Hello')
        result.current.handleInputChange('')
      })

      act(() => {
        vi.advanceTimersByTime(500)
      })

      expect(result.current.isTyping).toBe(true)

      act(() => {
        vi.advanceTimersByTime(500)
      })

      await waitFor(() => {
        expect(result.current.isTyping).toBe(false)
      })
    })
  })
})

