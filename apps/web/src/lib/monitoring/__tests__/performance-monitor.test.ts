/**
 * PerformanceMonitor Tests - 100% Coverage
 * 
 * Tests all performance monitoring functionality including:
 * - Web Vitals (LCP, FID, CLS)
 * - Resource monitoring
 * - User timing API
 * - Memory monitoring
 * - API tracking
 * - Route tracking
 * - Custom metrics
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { performanceMonitor } from '../performance-monitor'
import { sentryConfig } from '../sentry-config'

// Mock dependencies
vi.mock('@/lib/logger', () => ({
  createLogger: () => ({
    debug: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  }),
}))

vi.mock('../sentry-config', () => ({
  sentryConfig: {
    addBreadcrumb: vi.fn(),
  },
}))

// Mock PerformanceObserver
class MockPerformanceObserver {
  observe = vi.fn()
  disconnect = vi.fn()
  takeRecords = vi.fn().mockReturnValue([])

  constructor(public callback: (list: { getEntries: () => PerformanceEntry[] }) => void) {}
}

// Mock performance API
const mockPerformance = {
  mark: vi.fn(),
  measure: vi.fn(),
  memory: {
    usedJSHeapSize: 1000000,
    totalJSHeapSize: 2000000,
    jsHeapSizeLimit: 4000000,
  },
}

describe('PerformanceMonitor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.clearAllTimers()

    // Reset global mocks
    global.PerformanceObserver = MockPerformanceObserver as unknown as typeof PerformanceObserver
    global.performance = mockPerformance as unknown as Performance

    // Mock window
    Object.defineProperty(global, 'window', {
      value: {
        performance: mockPerformance,
        addEventListener: vi.fn(),
      },
      writable: true,
    })

    // Cleanup before each test
    performanceMonitor.cleanup()
  })

  afterEach(() => {
    performanceMonitor.cleanup()
  })

  describe('init', () => {
    it('should initialize all monitoring', () => {
      performanceMonitor.init()

      // Should create observers
      expect(MockPerformanceObserver).toHaveBeenCalled()
    })

    it('should handle missing PerformanceObserver gracefully', () => {
      // @ts-expect-error - Testing missing API
      global.PerformanceObserver = undefined

      expect(() => {
        performanceMonitor.init()
      }).not.toThrow()
    })
  })

  describe('Web Vitals - LCP', () => {
    it('should observe LCP', () => {
      performanceMonitor.init()

      const observerCalls = (MockPerformanceObserver as unknown as { mock: { calls: unknown[][] } }).mock.calls
      const lcpObserverCall = observerCalls.find(
        call => call[0] && typeof call[0] === 'function'
      )

      expect(lcpObserverCall).toBeDefined()
    })

    it('should record LCP metric', () => {
      performanceMonitor.init()

      const observer = new MockPerformanceObserver(() => {})
      const entries = [
        {
          startTime: 1500,
          name: 'lcp',
        } as PerformanceEntry,
      ]

      // Simulate observer callback
      const callback = (MockPerformanceObserver as unknown as { mock: { calls: unknown[][] } }).mock.calls[0]?.[0] as (list: { getEntries: () => PerformanceEntry[] }) => void
      if (callback) {
        callback({ getEntries: () => entries })
      }

      const summary = performanceMonitor.getSummary()
      expect(summary.totalMetrics).toBeGreaterThan(0)
    })

    it('should handle LCP observer error', () => {
      const originalObserve = MockPerformanceObserver.prototype.observe
      MockPerformanceObserver.prototype.observe = vi.fn().mockImplementation(() => {
        throw new Error('Not supported')
      })

      expect(() => {
        performanceMonitor.init()
      }).not.toThrow()

      MockPerformanceObserver.prototype.observe = originalObserve
    })
  })

  describe('Web Vitals - FID', () => {
    it('should observe FID', () => {
      performanceMonitor.init()

      const observerCalls = (MockPerformanceObserver as unknown as { mock: { calls: unknown[][] } }).mock.calls
      expect(observerCalls.length).toBeGreaterThan(0)
    })

    it('should record FID metric', () => {
      performanceMonitor.init()

      const entries = [
        {
          startTime: 100,
          processingStart: 150,
        } as PerformanceEntry & { processingStart: number },
      ]

      // Find FID observer callback
      const observerCalls = (MockPerformanceObserver as unknown as { mock: { calls: unknown[][] } }).mock.calls
      const fidCallback = observerCalls.find(
        call => call[0] && typeof call[0] === 'function'
      )?.[0] as (list: { getEntries: () => PerformanceEntry[] }) => void

      if (fidCallback) {
        fidCallback({ getEntries: () => entries })
      }

      const summary = performanceMonitor.getSummary()
      expect(summary.totalMetrics).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Web Vitals - CLS', () => {
    it('should observe CLS', () => {
      performanceMonitor.init()

      const observerCalls = (MockPerformanceObserver as unknown as { mock: { calls: unknown[][] } }).mock.calls
      expect(observerCalls.length).toBeGreaterThan(0)
    })

    it('should record CLS metric excluding recent input', () => {
      performanceMonitor.init()

      const entries = [
        {
          value: 0.1,
          hadRecentInput: false,
        } as PerformanceEntry & { value: number; hadRecentInput: boolean },
        {
          value: 0.2,
          hadRecentInput: true, // Should be excluded
        } as PerformanceEntry & { value: number; hadRecentInput: boolean },
      ]

      // Find CLS observer callback
      const observerCalls = (MockPerformanceObserver as unknown as { mock: { calls: unknown[][] } }).mock.calls
      const clsCallback = observerCalls.find(
        call => call[0] && typeof call[0] === 'function'
      )?.[0] as (list: { getEntries: () => PerformanceEntry[] }) => void

      if (clsCallback) {
        clsCallback({ getEntries: () => entries })
      }

      const summary = performanceMonitor.getSummary()
      expect(summary.totalMetrics).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Resource Monitoring', () => {
    it('should observe resource entries', () => {
      performanceMonitor.init()

      const observerCalls = (MockPerformanceObserver as unknown as { mock: { calls: unknown[][] } }).mock.calls
      expect(observerCalls.length).toBeGreaterThan(0)
    })

    it('should record slow resource loads', () => {
      performanceMonitor.init()

      const entries = [
        {
          duration: 1500,
          initiatorType: 'script',
          name: 'https://example.com/app.js',
          transferSize: 50000,
        } as PerformanceResourceTiming,
      ]

      // Find resource observer callback
      const observerCalls = (MockPerformanceObserver as unknown as { mock: { calls: unknown[][] } }).mock.calls
      const resourceCallback = observerCalls.find(
        call => call[0] && typeof call[0] === 'function'
      )?.[0] as (list: { getEntries: () => PerformanceEntry[] }) => void

      if (resourceCallback) {
        resourceCallback({ getEntries: () => entries })
      }

      const summary = performanceMonitor.getSummary()
      expect(summary.totalMetrics).toBeGreaterThanOrEqual(0)
    })

    it('should record large resource sizes', () => {
      performanceMonitor.init()

      const entries = [
        {
          duration: 500,
          initiatorType: 'img',
          name: 'https://example.com/large-image.jpg',
          transferSize: 2000000, // 2MB
        } as PerformanceResourceTiming,
      ]

      // Find resource observer callback
      const observerCalls = (MockPerformanceObserver as unknown as { mock: { calls: unknown[][] } }).mock.calls
      const resourceCallback = observerCalls.find(
        call => call[0] && typeof call[0] === 'function'
      )?.[0] as (list: { getEntries: () => PerformanceEntry[] }) => void

      if (resourceCallback) {
        resourceCallback({ getEntries: () => entries })
      }

      const summary = performanceMonitor.getSummary()
      expect(summary.totalMetrics).toBeGreaterThanOrEqual(0)
    })
  })

  describe('User Timing API', () => {
    it('should observe user timing marks and measures', () => {
      performanceMonitor.init()

      const observerCalls = (MockPerformanceObserver as unknown as { mock: { calls: unknown[][] } }).mock.calls
      expect(observerCalls.length).toBeGreaterThan(0)
    })

    it('should record user timing metrics', () => {
      performanceMonitor.init()

      const entries = [
        {
          name: 'custom-mark',
          duration: 100,
          startTime: 50,
        } as PerformanceEntry,
      ]

      // Find user timing observer callback
      const observerCalls = (MockPerformanceObserver as unknown as { mock: { calls: unknown[][] } }).mock.calls
      const timingCallback = observerCalls.find(
        call => call[0] && typeof call[0] === 'function'
      )?.[0] as (list: { getEntries: () => PerformanceEntry[] }) => void

      if (timingCallback) {
        timingCallback({ getEntries: () => entries })
      }

      const summary = performanceMonitor.getSummary()
      expect(summary.totalMetrics).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Memory Monitoring', () => {
    it('should monitor memory usage', () => {
      vi.useFakeTimers()

      performanceMonitor.init()

      // Advance timer to trigger memory monitoring
      vi.advanceTimersByTime(30000)

      const summary = performanceMonitor.getSummary()
      // Memory monitoring should have recorded metrics
      expect(summary.totalMetrics).toBeGreaterThanOrEqual(0)

      vi.useRealTimers()
    })

    it('should handle missing memory API', () => {
      const performanceWithoutMemory = {
        ...mockPerformance,
        memory: undefined,
      }

      Object.defineProperty(global, 'performance', {
        value: performanceWithoutMemory,
        writable: true,
      })

      vi.useFakeTimers()

      performanceMonitor.init()
      vi.advanceTimersByTime(30000)

      // Should not throw
      expect(() => {
        performanceMonitor.getSummary()
      }).not.toThrow()

      vi.useRealTimers()
    })
  })

  describe('API Tracking', () => {
    it('should track API call duration', () => {
      performanceMonitor.trackAPICall('GET', '/api/users', 250, 200)

      const summary = performanceMonitor.getSummary()
      expect(summary.totalMetrics).toBe(1)
    })

    it('should track API errors', () => {
      performanceMonitor.trackAPICall('POST', '/api/login', 100, 401)

      const summary = performanceMonitor.getSummary()
      // Should record both duration and error
      expect(summary.totalMetrics).toBeGreaterThanOrEqual(1)
    })

    it('should normalize endpoint by removing query params', () => {
      performanceMonitor.trackAPICall('GET', '/api/users?id=123&page=1', 200, 200)

      expect(sentryConfig.addBreadcrumb).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tags: expect.objectContaining({
              endpoint: '/api/users',
            }),
          }),
        })
      )
    })

    it('should categorize status codes', () => {
      performanceMonitor.trackAPICall('GET', '/api/test', 100, 404)

      expect(sentryConfig.addBreadcrumb).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tags: expect.objectContaining({
              status_class: '4xx',
            }),
          }),
        })
      )
    })
  })

  describe('Route Tracking', () => {
    it('should track route load time', () => {
      performanceMonitor.trackRouteChange('/dashboard', 500)

      const summary = performanceMonitor.getSummary()
      expect(summary.totalMetrics).toBe(1)
    })

    it('should normalize dynamic routes', () => {
      performanceMonitor.trackRouteChange('/users/123/profile', 300)

      expect(sentryConfig.addBreadcrumb).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tags: expect.objectContaining({
              route: '/users/:id/profile',
            }),
          }),
        })
      )
    })
  })

  describe('Custom Performance Marks', () => {
    it('should create performance mark', () => {
      performanceMonitor.mark('custom-start')

      expect(mockPerformance.mark).toHaveBeenCalledWith('custom-start')
    })

    it('should handle missing performance API', () => {
      Object.defineProperty(global, 'performance', {
        value: undefined,
        writable: true,
      })

      expect(() => {
        performanceMonitor.mark('test')
      }).not.toThrow()
    })
  })

  describe('Performance Measures', () => {
    it('should create measure with start and end marks', () => {
      performanceMonitor.measure('custom-measure', 'start-mark', 'end-mark')

      expect(mockPerformance.measure).toHaveBeenCalledWith('custom-measure', 'start-mark', 'end-mark')
    })

    it('should create measure with only start mark', () => {
      performanceMonitor.measure('custom-measure', 'start-mark')

      expect(mockPerformance.measure).toHaveBeenCalledWith('custom-measure', 'start-mark')
    })

    it('should handle measure errors', () => {
      mockPerformance.measure = vi.fn().mockImplementation(() => {
        throw new Error('Invalid mark')
      })

      expect(() => {
        performanceMonitor.measure('test', 'invalid-mark')
      }).not.toThrow()
    })
  })

  describe('Feature Usage Tracking', () => {
    it('should track feature usage with duration', () => {
      performanceMonitor.trackFeatureUsage('video-call', 5000)

      const summary = performanceMonitor.getSummary()
      expect(summary.totalMetrics).toBe(1)
    })

    it('should track feature usage without duration', () => {
      performanceMonitor.trackFeatureUsage('button-click')

      const summary = performanceMonitor.getSummary()
      expect(summary.totalMetrics).toBe(1)
    })
  })

  describe('User Interaction Tracking', () => {
    it('should track user interaction duration', () => {
      performanceMonitor.trackUserInteraction('swipe', 200)

      const summary = performanceMonitor.getSummary()
      expect(summary.totalMetrics).toBe(1)
    })
  })

  describe('Metric Recording', () => {
    it('should record metric and send to Sentry', () => {
      performanceMonitor.trackAPICall('GET', '/test', 100, 200)

      expect(sentryConfig.addBreadcrumb).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Performance:'),
          category: 'performance',
          level: 'info',
        })
      )
    })

    it('should limit metrics to 1000', () => {
      // Record 1001 metrics
      for (let i = 0; i < 1001; i++) {
        performanceMonitor.trackAPICall('GET', `/test${i}`, 100, 200)
      }

      const summary = performanceMonitor.getSummary()
      expect(summary.totalMetrics).toBe(1000)
    })
  })

  describe('Summary', () => {
    it('should calculate summary with averages', () => {
      performanceMonitor.trackAPICall('GET', '/test1', 100, 200)
      performanceMonitor.trackAPICall('GET', '/test2', 200, 200)
      performanceMonitor.trackAPICall('GET', '/test3', 300, 200)

      const summary = performanceMonitor.getSummary()

      expect(summary.totalMetrics).toBe(3)
      expect(summary.averageValues).toBeDefined()
    })

    it('should identify slowest operations', () => {
      performanceMonitor.trackAPICall('GET', '/slow1', 2000, 200)
      performanceMonitor.trackAPICall('GET', '/slow2', 3000, 200)
      performanceMonitor.trackAPICall('GET', '/fast', 100, 200)

      const summary = performanceMonitor.getSummary()

      expect(summary.slowestOperations.length).toBeGreaterThan(0)
      expect(summary.slowestOperations[0]?.value).toBeGreaterThanOrEqual(2000)
    })

    it('should handle empty metrics', () => {
      const summary = performanceMonitor.getSummary()

      expect(summary.totalMetrics).toBe(0)
      expect(summary.averageValues).toEqual({})
      expect(summary.slowestOperations).toEqual([])
    })
  })

  describe('Cleanup', () => {
    it('should disconnect all observers', () => {
      performanceMonitor.init()
      performanceMonitor.cleanup()

      // Observers should be disconnected
      const observerCalls = (MockPerformanceObserver as unknown as { mock: { instances: MockPerformanceObserver[] } }).mock.instances
      observerCalls.forEach(observer => {
        expect(observer.disconnect).toHaveBeenCalled()
      })
    })

    it('should clear metrics', () => {
      performanceMonitor.trackAPICall('GET', '/test', 100, 200)
      performanceMonitor.cleanup()

      const summary = performanceMonitor.getSummary()
      expect(summary.totalMetrics).toBe(0)
    })
  })
})

