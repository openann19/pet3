import { createLogger } from './logger'
import { APIClient } from './api-client'
import { ENV } from '@/config/env'
import { isTruthy, isDefined } from '@petspark/shared';

type EventProperties = Record<string, string | number | boolean>

const logger = createLogger('Analytics')

class Analytics {
  private readonly useMocks = ENV.VITE_USE_MOCKS === 'true'
  private eventQueue: Array<{ eventName: string; properties?: EventProperties; timestamp: number }> = []
  private flushInterval: number | null = null

  constructor() {
    // Flush events every 5 seconds
    if (typeof window !== 'undefined') {
      this.flushInterval = window.setInterval(() => {
        this.flushEvents().catch((error) => {
          logger.error('Failed to flush analytics events', error instanceof Error ? error : new Error(String(error)))
        })
      }, 5000)
    }
  }

  /**
   * Track an analytics event
   */
  track(eventName: string, properties?: EventProperties) {
    if (typeof window === 'undefined') return
    
    logger.debug('Track event', { eventName, properties })
    
    // If mocks are enabled, use window.spark_analytics if available
    if (this.useMocks && isTruthy(window.spark_analytics)) {
      window.spark_analytics.track(eventName, properties)
      return
    }

    // Queue event for batch sending
    this.eventQueue.push({
      eventName,
      properties,
      timestamp: Date.now()
    })

    // Flush immediately if queue is getting large
    if (this.eventQueue.length >= 10) {
      this.flushEvents().catch((error) => {
        logger.error('Failed to flush analytics events', error instanceof Error ? error : new Error(String(error)))
      })
    }
  }

  /**
   * Flush queued events to backend
   */
  private async flushEvents(): Promise<void> {
    if (this.eventQueue.length === 0) return

    const events = [...this.eventQueue]
    this.eventQueue = []

    try {
      // Send events to backend analytics endpoint
      await APIClient.post('/analytics/events', {
        events,
        timestamp: Date.now()
      })
      logger.debug('Analytics events flushed', { count: events.length })
    } catch (error) {
      // Re-queue events on failure (up to a limit)
      if (this.eventQueue.length < 100) {
        this.eventQueue.unshift(...events)
      }
      logger.error('Failed to send analytics events', error instanceof Error ? error : new Error(String(error)))
    }
  }

  /**
   * Flush events immediately (called on page unload)
   */
  async flush(): Promise<void> {
    if (this.flushInterval !== null && typeof window !== 'undefined') {
      window.clearInterval(this.flushInterval)
      this.flushInterval = null
    }
    await this.flushEvents()
  }
}

export const analytics = new Analytics()

// Flush events on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    analytics.flush().catch(() => {
      // Ignore errors during unload
    })
  })
}

declare global {
  interface Window {
    spark_analytics?: {
      track: (eventName: string, properties?: EventProperties) => void
    }
  }
}
