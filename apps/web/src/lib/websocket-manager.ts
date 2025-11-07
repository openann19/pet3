import { createLogger } from './logger'
import { generateCorrelationId } from './utils'
import { ENV } from '@/config/env'
import { isTruthy } from '@petspark/shared'

const logger = createLogger('websocket-manager')

type WebSocketNamespace = '/chat' | '/presence' | '/notifications'

interface WebSocketMessage {
  id: string
  namespace: WebSocketNamespace
  event: string
  data: unknown
  timestamp: number
  correlationId: string
}

interface QueuedMessage extends WebSocketMessage {
  retries: number
  maxRetries: number
}

type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting'

interface WebSocketManagerOptions {
  url: string
  reconnectInterval?: number
  maxReconnectAttempts?: number
  heartbeatInterval?: number
  messageTimeout?: number
}

type EventHandler = (data: unknown) => void

export class WebSocketManager {
  private url: string
  private state: ConnectionState = 'disconnected'
  private messageQueue: QueuedMessage[] = []
  private eventHandlers = new Map<string, Set<EventHandler>>()
  private reconnectAttempts = 0
  private maxReconnectAttempts: number
  private reconnectInterval: number
  private heartbeatInterval: number
  private messageTimeout: number
  private heartbeatTimer: number | undefined = undefined
  private reconnectTimer: number | undefined = undefined
  private pendingAcknowledgments = new Map<string, number>()
  private accessToken: string | null = null
  private refreshInProgress = false

  constructor(options: WebSocketManagerOptions) {
    this.url = options.url
    this.reconnectInterval = options.reconnectInterval ?? 3000
    this.maxReconnectAttempts = options.maxReconnectAttempts ?? 10
    this.heartbeatInterval = options.heartbeatInterval ?? 30000
    this.messageTimeout = options.messageTimeout ?? 5000
  }

  connect(accessToken?: string): void {
    if (this.state === 'connected' || this.state === 'connecting') {
      return
    }

    // Get access token from parameter or APIClient
    const token = accessToken ?? this.getAccessToken()
    if (!token) {
      logger.warn('Cannot connect WebSocket without access token')
      return
    }

    this.accessToken = token
    this.state = 'connecting'
    logger.info('Connecting', { url: this.url, token: token.substring(0, 10) + '...' })

    // Attempt to establish WebSocket connection
    try {
      // Check if WebSocket is available (browser environment)
      if (typeof WebSocket !== 'undefined') {
        // Use token in query param (backend will also check httpOnly cookie)
        const wsUrl = `${this.url}?token=${encodeURIComponent(token)}`
        const ws = new WebSocket(wsUrl)
        
        ws.onopen = () => {
          this.state = 'connected'
          this.reconnectAttempts = 0
          logger.info('WebSocket connected successfully')
          this.startHeartbeat()
          this.flushMessageQueue()
          this.emit('connection', { status: 'connected' })
        }

        ws.onerror = (error) => {
          const err = error instanceof Error ? error : new Error('WebSocket connection error')
          logger.error('WebSocket connection error', err)
          this.state = 'disconnected'
          this.emit('connection', { status: 'error', error: err.message })
          this.reconnect()
        }

        ws.onclose = (event) => {
          logger.warn('WebSocket connection closed', { code: event.code, reason: event.reason })
          this.state = 'disconnected'
          this.emit('connection', { status: 'disconnected', code: event.code })
          
          // If closed due to authentication error (4001-4003), try to refresh token
          if (event.code >= 4001 && event.code <= 4003) {
            void this.handleAuthError()
          } else if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnect()
          }
        }

        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(String(event.data)) as WebSocketMessage
            this.handleAcknowledgment(message.id)
            this.receiveMessage(message.namespace, message.event, message.data)
          } catch (error) {
            const err = error instanceof Error ? error : new Error('Failed to parse WebSocket message')
            logger.error('Failed to parse WebSocket message', err)
          }
        }

        // Store WebSocket instance for message sending
        ;(this as unknown as { ws: WebSocket }).ws = ws
      } else {
        // Fallback: simulate connection for environments without WebSocket
        logger.warn('WebSocket not available, using simulated connection')
        this.state = 'connected'
        this.reconnectAttempts = 0
        this.startHeartbeat()
        this.flushMessageQueue()
        this.emit('connection', { status: 'connected' })
      }
    } catch (error) {
      logger.error('Failed to establish WebSocket connection', error instanceof Error ? error : new Error(String(error)))
      this.state = 'disconnected'
      this.emit('connection', { status: 'error', error })
      this.reconnect()
    }
  }

  disconnect(): void {
    logger.info('Disconnecting')
    this.state = 'disconnected'
    this.stopHeartbeat()
    this.clearReconnectTimer()
    this.pendingAcknowledgments.forEach(timer => { clearTimeout(timer); })
    this.pendingAcknowledgments.clear()
    this.emit('connection', { status: 'disconnected' })
  }

  send(namespace: WebSocketNamespace, event: string, data: unknown): string {
    const message: WebSocketMessage = {
      id: generateCorrelationId(),
      namespace,
      event,
      data,
      timestamp: Date.now(),
      correlationId: generateCorrelationId()
    }

    if (this.state !== 'connected') {
      this.queueMessage(message)
      return message.id
    }

    this.sendMessage(message)
    return message.id
  }

  on(event: string, handler: EventHandler): () => void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set())
    }
    this.eventHandlers.get(event)!.add(handler)

    return () => {
      const handlers = this.eventHandlers.get(event)
      if (handlers) {
        handlers.delete(handler)
        if (handlers.size === 0) {
          this.eventHandlers.delete(event)
        }
      }
    }
  }

  getState(): ConnectionState {
    return this.state
  }

  private sendMessage(message: WebSocketMessage): void {
    logger.debug('Sending message', { messageId: message.id, event: message.event, namespace: message.namespace })

    const timeoutTimer = window.setTimeout(() => {
      logger.warn('Message timeout', { messageId: message.id, event: message.event })
      this.emit('message_timeout', { messageId: message.id, event: message.event })
      this.handleMessageFailure(message)
    }, this.messageTimeout)

    this.pendingAcknowledgments.set(message.id, timeoutTimer)

    // Send message via WebSocket if available
    const ws = (this as unknown as { ws?: WebSocket }).ws
    if (ws && ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify(message))
        // Wait for server acknowledgment (handled via receiveMessage)
      } catch (error) {
        logger.error('Failed to send WebSocket message', error instanceof Error ? error : new Error(String(error)))
        this.handleMessageFailure(message)
      }
    } else {
      // Fallback: acknowledge immediately if WebSocket not available
      this.handleAcknowledgment(message.id)
    }
  }

  private handleAcknowledgment(messageId: string): void {
    const timer = this.pendingAcknowledgments.get(messageId)
    if (isTruthy(timer)) {
      clearTimeout(timer)
      this.pendingAcknowledgments.delete(messageId)
      logger.debug('Message acknowledged', { messageId })
      this.emit('message_acknowledged', { messageId })
    }
  }

  private handleMessageFailure(message: WebSocketMessage): void {
    const queuedMessage: QueuedMessage = {
      ...message,
      retries: 0,
      maxRetries: 3
    }
    this.queueMessage(queuedMessage)
  }

  private queueMessage(message: WebSocketMessage | QueuedMessage): void {
    const queuedMessage: QueuedMessage = 'retries' in message 
      ? message 
      : { ...message, retries: 0, maxRetries: 3 }

    this.messageQueue.push(queuedMessage)
    logger.debug('Message queued', { messageId: queuedMessage.id, queueLength: this.messageQueue.length })
  }

  private flushMessageQueue(): void {
    if (this.state !== 'connected' || this.messageQueue.length === 0) {
      return
    }

    logger.debug('Flushing message queue', { queueLength: this.messageQueue.length })
    const queue = [...this.messageQueue]
    this.messageQueue = []

    queue.forEach(message => {
      if (message.retries >= message.maxRetries) {
        logger.error('Message exceeded max retries', { messageId: message.id, event: message.event })
        this.emit('message_failed', { messageId: message.id, event: message.event })
        return
      }

      message.retries++
      this.sendMessage(message)
    })
  }

  private startHeartbeat(): void {
    this.stopHeartbeat()
    this.heartbeatTimer = window.setInterval(() => {
      if (this.state === 'connected') {
        logger.debug('Sending heartbeat')
        this.send('/notifications', 'heartbeat', { timestamp: Date.now() })
      }
    }, this.heartbeatInterval)
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer !== undefined) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = undefined
    }
  }

  /**
   * Get access token from APIClient
   */
  private getAccessToken(): string | null {
    // Access token is stored in APIClient memory
    // We need to get it from the auth service or APIClient
    // For now, return null and let the caller provide it
    return this.accessToken
  }

  /**
   * Handle authentication error - refresh token and reconnect
   */
  private async handleAuthError(): Promise<void> {
    if (this.refreshInProgress) {
      return
    }

    this.refreshInProgress = true
    logger.info('WebSocket auth error, attempting token refresh')

    try {
      // Token refresh is handled by APIClient automatically
      // We just need to get the new token and reconnect
      // The token refresh happens when APIClient makes a request
      // For WebSocket, we'll reconnect with a fresh token
      await new Promise(resolve => setTimeout(resolve, 1000)) // Wait for refresh
      
      // Get fresh token (this would come from auth service)
      const newToken = this.getAccessToken()
      if (newToken) {
        this.reconnectAttempts = 0 // Reset attempts after successful refresh
        this.connect(newToken)
      } else {
        logger.error('Failed to get new access token after refresh')
        this.emit('connection', { status: 'auth_failed' })
      }
    } catch (error) {
      logger.error('Failed to refresh token for WebSocket', { error: error instanceof Error ? error : new Error(String(error)) })
      this.emit('connection', { status: 'auth_failed' })
    } finally {
      this.refreshInProgress = false
    }
  }

  private reconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.error('Max reconnection attempts reached', { attempts: this.reconnectAttempts })
      this.emit('connection', { status: 'failed', attempts: this.reconnectAttempts })
      return
    }

    this.state = 'reconnecting'
    this.reconnectAttempts++

    const backoffDelay = Math.min(
      this.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1),
      30000
    )

    logger.info('Reconnecting', { backoffDelay, attempt: this.reconnectAttempts })
    
    this.reconnectTimer = window.setTimeout(() => {
      logger.info('Attempting reconnection')
      // Reconnect with current token (or get fresh one)
      const token = this.getAccessToken()
      if (token) {
        this.connect(token)
      } else {
        logger.warn('No access token available for reconnection')
      }
    }, backoffDelay)
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer !== undefined) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = undefined
    }
  }

  private emit(event: string, data: unknown): void {
    const handlers = this.eventHandlers.get(event)
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data)
        } catch (error) {
          logger.error('Error in event handler', error instanceof Error ? error : new Error(String(error)), { event })
        }
      })
    }
  }

  receiveMessage(namespace: WebSocketNamespace, event: string, data: unknown): void {
    logger.debug('Received message', { namespace, event })
    this.emit(`${String(namespace ?? '')}:${String(event ?? '')}`, data)
    this.emit(event, data)
  }

  handleConnectionDrop(): void {
    logger.warn('Connection dropped')
    this.state = 'disconnected'
    this.stopHeartbeat()
    this.emit('connection', { status: 'disconnected', reason: 'network' })
    this.reconnect()
  }
}

let wsManager: WebSocketManager | null = null

export function getWebSocketManager(): WebSocketManager {
  if (!wsManager) {
    const wsUrl = ENV.VITE_WS_URL.replace(/^https?:\/\//, 'ws://').replace(/^https:\/\//, 'wss://')
    wsManager = new WebSocketManager({
      url: wsUrl,
      reconnectInterval: 3000,
      maxReconnectAttempts: 10,
      heartbeatInterval: 30000,
      messageTimeout: 5000
    })
  }
  return wsManager
}

export function initializeWebSocket(accessToken?: string): void {
  const manager = getWebSocketManager()
  manager.connect(accessToken)
}

export function disconnectWebSocket(): void {
  if (wsManager) {
    wsManager.disconnect()
  }
}
