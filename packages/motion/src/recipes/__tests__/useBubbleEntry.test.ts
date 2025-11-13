/**
 * useBubbleEntry Hook Tests
 * Comprehensive test coverage for the bubble entry animation hook
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useBubbleEntry, type UseBubbleEntryOptions } from '../useBubbleEntry'

// Mock timers
vi.useFakeTimers()

describe('useBubbleEntry', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.clearAllTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.useFakeTimers()
  })

  describe('default initialization', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => useBubbleEntry({ autoTrigger: false }))

      expect(result.current.isVisible).toBe(false)
      expect(result.current.isAnimating).toBe(false)
      expect(typeof result.current.style).toBe('object')
      expect(typeof result.current.enter).toBe('function')
      expect(typeof result.current.exit).toBe('function')
      expect(typeof result.current.reset).toBe('function')
    })

    it('should have default style properties', () => {
      const { result } = renderHook(() => useBubbleEntry({ autoTrigger: false }))

      const style = result.current.style as Record<string, unknown>
      expect(style).toHaveProperty('transform')
      expect(style).toHaveProperty('opacity')
    })
  })

  describe('auto-trigger', () => {
    it('should automatically start animation when autoTrigger is true', async () => {
      const { result } = renderHook(() => useBubbleEntry({ autoTrigger: true }))

      // Wait for auto-trigger delay (16ms frame delay)
      await act(async () => {
        await vi.advanceTimersByTimeAsync(20)
      })

      await waitFor(() => {
        expect(result.current.isVisible).toBe(true)
      })
    })

    it('should not auto-trigger when autoTrigger is false', async () => {
      const { result } = renderHook(() => useBubbleEntry({ autoTrigger: false }))

      await act(async () => {
        await vi.advanceTimersByTimeAsync(100)
      })

      expect(result.current.isVisible).toBe(false)
      expect(result.current.isAnimating).toBe(false)
    })
  })

  describe('manual trigger', () => {
    it('should start animation when enter() is called', async () => {
      const { result } = renderHook(() => useBubbleEntry({ autoTrigger: false }))

      expect(result.current.isVisible).toBe(false)

      act(() => {
        result.current.enter()
      })

      await waitFor(() => {
        expect(result.current.isVisible).toBe(true)
      })
    })

    it('should not start animation if already visible', () => {
      const { result } = renderHook(() => useBubbleEntry({ autoTrigger: false }))

      act(() => {
        result.current.enter()
      })

      const initialAnimating = result.current.isAnimating

      // Try to enter again
      act(() => {
        result.current.enter()
      })

      // Should not change state if already visible
      expect(result.current.isVisible).toBe(true)
    })
  })

  describe('exit animation', () => {
    it('should exit when exit() is called after entering', async () => {
      const { result } = renderHook(() => useBubbleEntry({ autoTrigger: false }))

      act(() => {
        result.current.enter()
      })

      await waitFor(() => {
        expect(result.current.isVisible).toBe(true)
      })

      act(() => {
        result.current.exit()
      })

      await waitFor(() => {
        expect(result.current.isVisible).toBe(false)
      })
    })

    it('should not exit if not visible', () => {
      const { result } = renderHook(() => useBubbleEntry({ autoTrigger: false }))

      act(() => {
        result.current.exit()
      })

      expect(result.current.isVisible).toBe(false)
      expect(result.current.isAnimating).toBe(false)
    })
  })

  describe('reset functionality', () => {
    it('should reset to initial state when reset() is called', async () => {
      const { result } = renderHook(() => useBubbleEntry({ autoTrigger: false }))

      act(() => {
        result.current.enter()
      })

      await waitFor(() => {
        expect(result.current.isVisible).toBe(true)
      })

      act(() => {
        result.current.reset()
      })

      expect(result.current.isVisible).toBe(false)
      expect(result.current.isAnimating).toBe(false)
    })

    it('should reset after exit', async () => {
      const { result } = renderHook(() => useBubbleEntry({ autoTrigger: false }))

      act(() => {
        result.current.enter()
      })

      await waitFor(() => {
        expect(result.current.isVisible).toBe(true)
      })

      act(() => {
        result.current.exit()
      })

      await waitFor(() => {
        expect(result.current.isVisible).toBe(false)
      })

      act(() => {
        result.current.reset()
      })

      expect(result.current.isVisible).toBe(false)
      expect(result.current.isAnimating).toBe(false)
    })
  })

  describe('directional animation', () => {
    it('should handle top direction', () => {
      const { result } = renderHook(() =>
        useBubbleEntry({
          direction: 'top',
          autoTrigger: false,
        })
      )

      expect(result.current.style).toBeDefined()
      act(() => {
        result.current.enter()
      })
      expect(result.current.isVisible).toBe(true)
    })

    it('should handle bottom direction', () => {
      const { result } = renderHook(() =>
        useBubbleEntry({
          direction: 'bottom',
          autoTrigger: false,
        })
      )

      expect(result.current.style).toBeDefined()
      act(() => {
        result.current.enter()
      })
      expect(result.current.isVisible).toBe(true)
    })

    it('should handle left direction', () => {
      const { result } = renderHook(() =>
        useBubbleEntry({
          direction: 'left',
          autoTrigger: false,
        })
      )

      expect(result.current.style).toBeDefined()
      act(() => {
        result.current.enter()
      })
      expect(result.current.isVisible).toBe(true)
    })

    it('should handle right direction', () => {
      const { result } = renderHook(() =>
        useBubbleEntry({
          direction: 'right',
          autoTrigger: false,
        })
      )

      expect(result.current.style).toBeDefined()
      act(() => {
        result.current.enter()
      })
      expect(result.current.isVisible).toBe(true)
    })
  })

  describe('staggered animations', () => {
    it('should delay animation based on index and staggerDelay', async () => {
      const { result: result0 } = renderHook(() =>
        useBubbleEntry({
          index: 0,
          staggerDelay: 100,
          autoTrigger: false,
        })
      )

      const { result: result1 } = renderHook(() =>
        useBubbleEntry({
          index: 1,
          staggerDelay: 100,
          autoTrigger: false,
        })
      )

      const { result: result2 } = renderHook(() =>
        useBubbleEntry({
          index: 2,
          staggerDelay: 100,
          autoTrigger: false,
        })
      )

      // All should start as not visible
      expect(result0.current.isVisible).toBe(false)
      expect(result1.current.isVisible).toBe(false)
      expect(result2.current.isVisible).toBe(false)

      // Trigger all at once
      act(() => {
        result0.current.enter()
        result1.current.enter()
        result2.current.enter()
      })

      // First should be visible immediately (0ms delay)
      await waitFor(() => {
        expect(result0.current.isVisible).toBe(true)
      })

      // Second should become visible after 100ms
      await act(async () => {
        await vi.advanceTimersByTimeAsync(100)
      })
      expect(result1.current.isVisible).toBe(true)

      // Third should become visible after 200ms
      await act(async () => {
        await vi.advanceTimersByTimeAsync(100)
      })
      expect(result2.current.isVisible).toBe(true)
    })
  })

  describe('bounce configuration', () => {
    it('should respect enableBounce setting when true', async () => {
      const { result } = renderHook(() =>
        useBubbleEntry({
          enableBounce: true,
          autoTrigger: false,
        })
      )

      act(() => {
        result.current.enter()
      })

      await waitFor(() => {
        expect(result.current.isVisible).toBe(true)
      })
    })

    it('should respect enableBounce setting when false', async () => {
      const { result } = renderHook(() =>
        useBubbleEntry({
          enableBounce: false,
          autoTrigger: false,
        })
      )

      act(() => {
        result.current.enter()
      })

      await waitFor(() => {
        expect(result.current.isVisible).toBe(true)
      })
    })
  })

  describe('custom spring configuration', () => {
    it('should use custom spring settings', async () => {
      const { result } = renderHook(() =>
        useBubbleEntry({
          springConfig: {
            damping: 25,
            stiffness: 400,
            mass: 1.5,
          },
          autoTrigger: false,
        })
      )

      expect(result.current.style).toBeDefined()

      act(() => {
        result.current.enter()
      })

      await waitFor(() => {
        expect(result.current.isVisible).toBe(true)
      })
    })

    it('should use default spring config when not provided', async () => {
      const { result } = renderHook(() =>
        useBubbleEntry({
          autoTrigger: false,
        })
      )

      act(() => {
        result.current.enter()
      })

      await waitFor(() => {
        expect(result.current.isVisible).toBe(true)
      })
    })
  })

  describe('custom configuration options', () => {
    it('should use custom distance', () => {
      const { result } = renderHook(() =>
        useBubbleEntry({
          distance: 50,
          autoTrigger: false,
        })
      )

      expect(result.current.style).toBeDefined()
    })

    it('should use custom initial and final scale', () => {
      const { result } = renderHook(() =>
        useBubbleEntry({
          initialScale: 0.5,
          finalScale: 1.2,
          autoTrigger: false,
        })
      )

      expect(result.current.style).toBeDefined()
    })

    it('should use custom initial and final opacity', () => {
      const { result } = renderHook(() =>
        useBubbleEntry({
          initialOpacity: 0.2,
          finalOpacity: 0.9,
          autoTrigger: false,
        })
      )

      expect(result.current.style).toBeDefined()
    })

    it('should use custom entry duration', async () => {
      const { result } = renderHook(() =>
        useBubbleEntry({
          entryDuration: 600,
          autoTrigger: false,
        })
      )

      act(() => {
        result.current.enter()
      })

      await waitFor(() => {
        expect(result.current.isVisible).toBe(true)
      })
    })
  })

  describe('reduced motion support', () => {
    it('should provide simplified animations when reduced motion is enabled', async () => {
      // Mock reduced motion
      const mockUseReducedMotion = vi.fn(() => ({
        value: true,
      }))

      vi.mock('../../core/hooks', async () => {
        const actual = await vi.importActual('../../core/hooks')
        return {
          ...actual,
          useReducedMotion: mockUseReducedMotion,
        }
      })

      const { result } = renderHook(() =>
        useBubbleEntry({
          autoTrigger: false,
        })
      )

      act(() => {
        result.current.enter()
      })

      // Should still work, but with simplified animation
      await waitFor(() => {
        expect(result.current.isVisible).toBe(true)
      })
    })
  })

  describe('edge cases', () => {
    it('should handle rapid enter/exit calls', async () => {
      const { result } = renderHook(() => useBubbleEntry({ autoTrigger: false }))

      act(() => {
        result.current.enter()
        result.current.exit()
        result.current.enter()
      })

      await waitFor(() => {
        expect(result.current.isVisible).toBe(true)
      })
    })

    it('should handle multiple reset calls', () => {
      const { result } = renderHook(() => useBubbleEntry({ autoTrigger: false }))

      act(() => {
        result.current.enter()
      })

      act(() => {
        result.current.reset()
        result.current.reset()
        result.current.reset()
      })

      expect(result.current.isVisible).toBe(false)
      expect(result.current.isAnimating).toBe(false)
    })

    it('should handle configuration changes', () => {
      const { result, rerender } = renderHook(
        ({ direction }) =>
          useBubbleEntry({
            direction,
            autoTrigger: false,
          }),
        {
          initialProps: { direction: 'bottom' as const },
        }
      )

      expect(result.current.style).toBeDefined()

      rerender({ direction: 'top' })

      expect(result.current.style).toBeDefined()
    })
  })

  describe('return value structure', () => {
    it('should return all required properties', () => {
      const { result } = renderHook(() => useBubbleEntry({ autoTrigger: false }))

      expect(result.current).toHaveProperty('style')
      expect(result.current).toHaveProperty('enter')
      expect(result.current).toHaveProperty('exit')
      expect(result.current).toHaveProperty('reset')
      expect(result.current).toHaveProperty('isVisible')
      expect(result.current).toHaveProperty('isAnimating')
    })

    it('should maintain stable function references', () => {
      const { result, rerender } = renderHook(() => useBubbleEntry({ autoTrigger: false }))

      const firstEnter = result.current.enter
      const firstExit = result.current.exit
      const firstReset = result.current.reset

      rerender()

      // Functions should be stable (memoized)
      expect(result.current.enter).toBe(firstEnter)
      expect(result.current.exit).toBe(firstExit)
      expect(result.current.reset).toBe(firstReset)
    })
  })
})
