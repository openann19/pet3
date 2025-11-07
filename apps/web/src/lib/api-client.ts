import type { Environment } from '@/config/env'
import { ENV } from '@/config/env'
import { createLogger } from '@/lib/logger'
import { retry } from '@/lib/retry'
import { ENDPOINTS } from '@/lib/endpoints'

const logger = createLogger('APIClient')

export interface PaginatedResponse {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface APIResponse<T = unknown> {
  data: T
  message?: string
  errors?: string[]
  pagination?: PaginatedResponse
}

export interface APIErrorDetails {
  message?: string
  code?: string
  details?: Record<string, unknown>
}

export interface APIError extends Error {
  status: number
  code?: string
  details?: Record<string, unknown>
}

export class APIClientError extends Error implements APIError {
  status: number
  code?: string
  details?: Record<string, unknown>

  constructor(
    message: string,
    init: { status: number; code?: string; details?: Record<string, unknown>; cause?: unknown },
  ) {
    super(message, init.cause ? { cause: init.cause } : undefined)
    this.name = 'APIClientError'
    this.status = init.status
    if (init.code !== undefined) {
      this.code = init.code
    }
    if (init.details !== undefined) {
      this.details = init.details
    }
  }
}

export class NetworkError extends Error {
  readonly status = 0
  readonly code = 'NETWORK_UNREACHABLE'
  readonly url: string
  readonly method: string
  readonly isNetworkError = true as const

  constructor(message: string, options: { url: string; method: string; cause?: unknown }) {
    super(message, options.cause ? { cause: options.cause } : undefined)
    this.name = 'NetworkError'
    this.url = options.url
    this.method = options.method
  }
}

export interface RetryConfig {
  attempts: number
  delay: number
  exponentialBackoff?: boolean
}

export interface RequestConfig extends RequestInit {
  timeout?: number
  retry?: RetryConfig
  idempotent?: boolean
}

type RequestHeaders = Record<string, string>

// RefreshToken property is now in class for non-cookie mode

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  attempts: 3,
  delay: 1000,
  exponentialBackoff: true
}

class APIClientImpl {
  private readonly baseUrl: string
  private readonly timeout: number
  private accessToken: string | null = null // Stored in memory only (from response, not localStorage)
  private refreshToken: string | null = null // Only used when not using cookies
  private csrfToken: string | null = null
  private refreshPromise: Promise<void> | null = null
  private readonly useCookies: boolean // Use httpOnly cookies for refresh token

  constructor(config: Environment) {
    this.baseUrl = config.VITE_API_URL
    this.timeout = config.VITE_API_TIMEOUT
    // Use cookies in production, localStorage in development (if VITE_USE_MOCKS is false)
    this.useCookies = config.VITE_USE_MOCKS !== 'true'

    // Load CSRF token if available (from cookie or meta tag)
    this.loadCSRFToken()
  }

  /**
   * Load CSRF token from meta tag or cookie
   */
  private loadCSRFToken(): void {
    if (typeof document === 'undefined') return

    // Try to get from meta tag first
    const metaTag = document.querySelector('meta[name="csrf-token"]')
    if (metaTag) {
      this.csrfToken = metaTag.getAttribute('content') ?? null
      return
    }

    // Try to get from cookie (if backend sets it)
    const cookies = document.cookie.split(';')
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=')
      if (name === 'csrf-token' && value) {
        this.csrfToken = value
        return
      }
    }
  }

  /**
   * Get CSRF token (fetch from backend if not available)
   */
  private async getCSRFToken(): Promise<string | null> {
    if (this.csrfToken) {
      return this.csrfToken
    }

    // Try to fetch CSRF token from backend
    try {
      const response = await fetch(`${String(this.baseUrl ?? '')}/auth/csrf-token`, {
        method: 'GET',
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json() as { csrfToken?: string }
        if (data.csrfToken) {
          this.csrfToken = data.csrfToken
          return this.csrfToken
        }
      }
    } catch (error) {
      logger.debug('Failed to fetch CSRF token', { error: error instanceof Error ? error : new Error(String(error)) })
    }

    return null
  }

  private clearTokens(): void {
    this.accessToken = null
    // Don't clear cookies - they're httpOnly and managed by backend
  }

  private async refreshAccessToken(): Promise<void> {
    // If using cookies, refresh token is in httpOnly cookie
    // If not using cookies, check if we have refresh token in memory
    if (!this.useCookies && !this.refreshToken) {
      throw new Error('No refresh token available')
    }

    if (this.refreshPromise) {
      await this.refreshPromise
      return
    }

    this.refreshPromise = this.performTokenRefresh()

    try {
      await this.refreshPromise
    } finally {
      this.refreshPromise = null
    }
  }

  private async performTokenRefresh(): Promise<void> {
    const csrfToken = await this.getCSRFToken()
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    }

    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken
    }

    const response = await fetch(`${String(this.baseUrl ?? '')}${String(ENDPOINTS.AUTH.REFRESH ?? '')}`, {
      method: 'POST',
      headers,
      credentials: 'include', // Include httpOnly cookies
      ...(this.useCookies ? {} : {
        // Fallback: if not using cookies, send refresh token in body (for development)
        body: JSON.stringify({ refreshToken: this.refreshToken })
      })
    })

    if (!response.ok) {
      this.clearTokens()
      throw await this.createAPIError(response)
    }

    const data = await response.json() as { 
      accessToken: string
      refreshToken?: string
      csrfToken?: string
    }
    
    // Store access token in memory (not localStorage)
    this.accessToken = data.accessToken
    
    // Refresh token is in httpOnly cookie (if using cookies)
    // If not using cookies, store in memory only
    if (!this.useCookies && data.refreshToken) {
      // For development mode without cookies, we still need to track refresh token
      // But don't store in localStorage - keep in memory only
      this.refreshToken = data.refreshToken
    }
    
    // Update CSRF token if provided
    if (data.csrfToken) {
      this.csrfToken = data.csrfToken
    }
  }

  private async makeRequest<T>(endpoint: string, config: RequestConfig = {}): Promise<APIResponse<T>> {
    const {
      timeout = this.timeout,
      retry: retryConfig = DEFAULT_RETRY_CONFIG,
      idempotent = false,
      ...requestInit
    } = config

    const retryConfigResolved: RetryConfig = {
      ...DEFAULT_RETRY_CONFIG,
      ...retryConfig
    }

    const executeRequest = async (): Promise<APIResponse<T>> => {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => { controller.abort(); }, timeout)

      try {
        const requestHeaders = await this.prepareHeaders(requestInit.headers)
        const response = await fetch(`${String(this.baseUrl ?? '')}${String(endpoint ?? '')}`, {
          ...requestInit,
          headers: requestHeaders,
          credentials: 'include', // Always include cookies for httpOnly refresh token
          signal: controller.signal
        })

        // Handle 401 with token refresh
        if (response.status === 401 && (this.useCookies || this.refreshToken)) {
          await this.handleUnauthorized()

          // Retry request with new access token
          const retryHeaders = await this.prepareHeaders(requestInit.headers)
          const retryResponse = await fetch(`${String(this.baseUrl ?? '')}${String(endpoint ?? '')}`, {
            ...requestInit,
            headers: retryHeaders,
            credentials: 'include',
            signal: controller.signal
          })

          await this.ensureSuccessfulResponse(retryResponse)
          return retryResponse.json() as Promise<APIResponse<T>>
        }

        await this.ensureSuccessfulResponse(response)
        return response.json() as Promise<APIResponse<T>>
      } catch (error) {
        throw this.normaliseRequestError(error, endpoint, (requestInit.method ?? 'GET').toString())
      } finally {
        clearTimeout(timeoutId)
      }
    }

    if (idempotent) {
      return retry(executeRequest, retryConfigResolved)
    }

    return executeRequest()
  }

  private async prepareHeaders(headers?: HeadersInit): Promise<RequestHeaders> {
    const merged: RequestHeaders = {
      'Content-Type': 'application/json',
      ...(headers as RequestHeaders | undefined)
    }

    // Add access token if available (stored in memory)
    if (this.accessToken) {
      merged['Authorization'] = `Bearer ${this.accessToken}`
    }

    // Add CSRF token for state-changing requests
    const csrfToken = await this.getCSRFToken()
    if (csrfToken) {
      merged['X-CSRF-Token'] = csrfToken
    }

    return merged
  }

  private async ensureSuccessfulResponse(response: Response): Promise<void> {
    if (!response.ok) {
      throw await this.createAPIError(response)
    }
  }

  private async handleUnauthorized(): Promise<void> {
    try {
      await this.refreshAccessToken()
    } catch (error) {
      logger.warn('Token refresh failed, clearing session', { error })
      this.clearTokens()
      throw error
    }
  }

  private async parseErrorDetails(response: Response): Promise<APIErrorDetails> {
    try {
      return await response.json() as APIErrorDetails
    } catch (error) {
      logger.debug('Failed to parse error body as JSON', { error: error instanceof Error ? error : new Error(String(error)) })
      return { message: response.statusText }
    }
  }

  private async createAPIError(response: Response): Promise<APIClientError> {
    const errorDetails = await this.parseErrorDetails(response)

    return new APIClientError(errorDetails.message ?? `HTTP ${response.status}`, {
      status: response.status,
      ...(errorDetails.code ? { code: errorDetails.code } : {}),
      ...(errorDetails.details ? { details: errorDetails.details } : {}),
    })
  }

  private normaliseRequestError(error: unknown, endpoint: string, method: string): Error {
    if (error instanceof NetworkError) {
      return error
    }

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return new NetworkError('Request timed out while contacting backend service', {
          url: endpoint,
          method,
          cause: error,
        })
      }

      if (error instanceof TypeError) {
        return new NetworkError('Unable to reach backend service', {
          url: endpoint,
          method,
          cause: error,
        })
      }

      return error
    }

    if (typeof error === 'object' && error !== null && 'message' in error) {
      const message = String((error as { message: unknown }).message)
      return new NetworkError(message, { url: endpoint, method, cause: error })
    }

    return new NetworkError('Network request failed', { url: endpoint, method, cause: error })
  }

  // Public API methods
  async get<T>(endpoint: string, config: RequestConfig = {}): Promise<APIResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      method: 'GET',
      idempotent: true,
      ...config
    })
  }

  async post<T>(endpoint: string, data?: unknown, config: RequestConfig = {}): Promise<APIResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      method: 'POST',
      ...(data ? { body: JSON.stringify(data) } : {}),
      ...config
    })
  }

  async put<T>(endpoint: string, data?: unknown, config: RequestConfig = {}): Promise<APIResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      method: 'PUT',
      ...(data ? { body: JSON.stringify(data) } : {}),
      idempotent: true,
      ...config
    })
  }

  async patch<T>(endpoint: string, data?: unknown, config: RequestConfig = {}): Promise<APIResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      method: 'PATCH',
      ...(data ? { body: JSON.stringify(data) } : {}),
      ...config
    })
  }

  async delete<T>(endpoint: string, config: RequestConfig = {}): Promise<APIResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      method: 'DELETE',
      idempotent: true,
      ...config
    })
  }

  // Authentication methods
  setTokens(accessToken: string, refreshToken?: string): void {
    // Store access token in memory only (not localStorage)
    this.accessToken = accessToken
    
    // If not using cookies, store refresh token in memory
    if (!this.useCookies && refreshToken) {
      this.refreshToken = refreshToken
    }
    // If using cookies, refresh token is in httpOnly cookie (set by backend)
  }

  logout(): void {
    this.clearTokens()
    // Call backend logout endpoint to clear httpOnly cookie
    if (this.useCookies) {
      fetch(`${this.baseUrl}${ENDPOINTS.AUTH.LOGOUT}`, {
        method: 'POST',
        credentials: 'include'
      }).catch((error) => {
        logger.warn('Failed to call logout endpoint', { error: error instanceof Error ? error : new Error(String(error)) })
      })
    }
  }

  isAuthenticated(): boolean {
    return Boolean(this.accessToken)
  }
}

export const APIClient = new APIClientImpl(ENV)
export type { APIClientImpl }
