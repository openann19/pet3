/**
 * Health Service
 * 
 * Provides health check endpoints and observability utilities
 */

import { APIClient } from './api-client'
import { ENDPOINTS } from './endpoints'
import { config } from './config'
import { generateCorrelationId } from './utils'
import { createLogger } from './logger'
import { ENV } from '@/config/env'

const logger = createLogger('HealthService')

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy'
  version: string
  commitSha: string
  timestamp: string
  uptime: number
  checks: HealthCheck[]
}

export interface HealthCheck {
  name: string
  status: 'pass' | 'fail' | 'warn'
  message?: string
  duration?: number
  timestamp: string
}

export interface ReadinessStatus {
  ready: boolean
  dependencies: DependencyStatus[]
  timestamp: string
}

export interface DependencyStatus {
  name: string
  status: 'available' | 'unavailable'
  latency?: number
  error?: string
}

export class HealthService {
  private startTime: number

  constructor() {
    this.startTime = Date.now()
  }

  /**
   * Check liveness - basic health check
   */
  async checkLiveness(): Promise<HealthStatus> {
    const correlationId = generateCorrelationId()
    
    try {
      const response = await APIClient.get<{ data: HealthStatus }>('/healthz')
      
      logger.debug('Liveness check passed', {
        status: response.data.status,
        correlationId
      })

      return response.data
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Liveness check failed', err, {
        correlationId
      })
      
      throw error
    }
  }

  /**
   * Check readiness - dependencies check
   */
  async checkReadiness(): Promise<ReadinessStatus> {
    const correlationId = generateCorrelationId()
    
    try {
      const response = await APIClient.get<{ data: ReadinessStatus }>('/readyz')
      
      logger.debug('Readiness check completed', {
        ready: response.data.ready,
        dependencies: response.data.dependencies.length,
        correlationId
      })

      return response.data
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Readiness check failed', err, {
        correlationId
      })
      
      throw error
    }
  }

  /**
   * Get version info from backend /api/version endpoint
   */
  async getVersion(): Promise<{
    version: string
    commitSha: string
    buildTime?: string
    environment: string
    featureFlags?: Record<string, boolean>
  }> {
    const correlationId = generateCorrelationId()
    
    try {
      const response = await APIClient.get<{
        data: {
          version: string
          commitSha: string
          buildTime?: string
          environment: string
          featureFlags?: Record<string, boolean>
        }
      }>('/api/version')

      logger.debug('Version info retrieved', {
        version: response.data.version,
        commitSha: response.data.commitSha,
        correlationId
      })

      return response.data
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.warn('Failed to fetch version from backend, using local config', {
        error: err.message,
        correlationId
      })

      return {
        version: ENV.VITE_APP_VERSION,
        commitSha: import.meta.env.VITE_COMMIT_SHA || 'unknown',
        environment: ENV.VITE_ENVIRONMENT
      }
    }
  }

  /**
   * Fetch runtime configuration from backend
   * This includes feature flags, API endpoints, and other dynamic config
   */
  async fetchRuntimeConfig(): Promise<{
    version: string
    commitSha: string
    buildTime?: string
    environment: string
    featureFlags?: Record<string, boolean>
    apiEndpoints?: Record<string, string>
    cdnUrl?: string
  }> {
    const correlationId = generateCorrelationId()
    
    try {
      const response = await APIClient.get<{
        data: {
          version: string
          commitSha: string
          buildTime?: string
          environment: string
          featureFlags?: Record<string, boolean>
          apiEndpoints?: Record<string, string>
          cdnUrl?: string
        }
      }>('/api/version')

      logger.info('Runtime config fetched from backend', {
        version: response.data.version,
        environment: response.data.environment,
        correlationId
      })

      return response.data
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.warn('Failed to fetch runtime config from backend, using defaults', {
        error: err.message,
        correlationId
      })

      // Return default config from environment variables
      return {
        version: ENV.VITE_APP_VERSION,
        commitSha: import.meta.env.VITE_COMMIT_SHA || 'unknown',
        environment: ENV.VITE_ENVIRONMENT,
        featureFlags: {
          KYC: ENV.VITE_ENABLE_KYC,
          PAYMENTS: ENV.VITE_ENABLE_PAYMENTS,
          LIVE_STREAMING: ENV.VITE_ENABLE_LIVE_STREAMING
        },
        apiEndpoints: {
          base: ENV.VITE_API_URL,
          ws: ENV.VITE_WS_URL
        }
      }
    }
  }

  /**
   * Sync version with backend
   */
  async syncVersion(): Promise<void> {
    const correlationId = generateCorrelationId()
    
    try {
      const version = await this.getVersion()
      
      logger.info('Version synced with backend', {
        version: version.version,
        commitSha: version.commitSha,
        environment: version.environment,
        correlationId
      })
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to sync version', err, {
        correlationId
      })
    }
  }

  /**
   * Create local health status (for client-side checks)
   */
  getLocalHealth(): HealthStatus {
    const checks: HealthCheck[] = [
      {
        name: 'config',
        status: 'pass',
        message: 'Configuration loaded',
        timestamp: new Date().toISOString()
      },
      {
        name: 'api_client',
        status: 'pass',
        message: 'API client initialized',
        timestamp: new Date().toISOString()
      }
    ]

    return {
      status: 'healthy',
      version: ENV.VITE_APP_VERSION,
      commitSha: import.meta.env.VITE_COMMIT_SHA || 'unknown',
      timestamp: new Date().toISOString(),
      uptime: Date.now() - this.startTime,
      checks
    }
  }
}

export const healthService = new HealthService()

