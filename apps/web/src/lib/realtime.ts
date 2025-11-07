import type { Message, Match, Notification } from './contracts'
import { createLogger } from './logger'
import { getWebSocketManager, initializeWebSocket, disconnectWebSocket } from './websocket-manager'

const logger = createLogger('realtime')

type EventCallback = (data: unknown) => void

interface QueuedEvent {
  id: string
  name: string
  data: unknown
  timestamp: number
}

export interface WebRTCSignalData {
  type: 'offer' | 'answer' | 'candidate' | 'end'
  from: string
  to: string
  callId: string
  data?: unknown
}

export class RealtimeClient {
  private listeners = new Map<string, Set<EventCallback>>()
  private accessToken: string | null = null
  private offlineQueue: QueuedEvent[] = []
  private wsManager = getWebSocketManager()

  constructor() {
    // Set up WebSocket event handlers
    this.setupWebSocketHandlers()
  }

  setAccessToken(token: string | null) {
    this.accessToken = token
    if (token) {
      // Connect WebSocket with token
      initializeWebSocket(token)
    } else {
      // Disconnect WebSocket
      disconnectWebSocket()
    }
  }

  connect() {
    if (!this.accessToken) {
      logger.warn('Cannot connect without access token')
      return
    }

    // WebSocket connection is handled by setAccessToken
    // This method is kept for backwards compatibility
    initializeWebSocket(this.accessToken)
  }

  disconnect() {
    disconnectWebSocket()
  }

  /**
   * Set up WebSocket event handlers
   */
  private setupWebSocketHandlers(): void {
    // Listen to WebSocket connection events
    this.wsManager.on('connection', (data) => {
      const status = (data as { status?: string }).status
      if (status === 'connected') {
        void this.flushOfflineQueue()
      }
    })

    // Listen to chat namespace events
    this.wsManager.on('chat:message_received', (data) => {
      this.trigger('message_received', data)
    })

    this.wsManager.on('chat:message_delivered', (data) => {
      this.trigger('message_delivered', data)
    })

    this.wsManager.on('chat:message_read', (data) => {
      this.trigger('message_read', data)
    })

    this.wsManager.on('chat:user_typing', (data) => {
      this.trigger('user_typing', data)
    })

    // Listen to presence namespace events
    this.wsManager.on('presence:user_online', (data) => {
      this.trigger('user_online', data)
    })

    this.wsManager.on('presence:user_offline', (data) => {
      this.trigger('user_offline', data)
    })

    // Listen to notifications namespace events
    this.wsManager.on('notifications:match_created', (data) => {
      this.trigger('match_created', data)
    })

    this.wsManager.on('notifications:like_received', (data) => {
      this.trigger('like_received', data)
    })

    this.wsManager.on('notifications:story_viewed', (data) => {
      this.trigger('story_viewed', data)
    })

    this.wsManager.on('notifications:notification', (data) => {
      this.trigger('notification', data)
    })
  }

  on(event: string, callback: EventCallback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(callback)
  }

  off(event: string, callback: EventCallback) {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      callbacks.delete(callback)
    }
  }

  emit(event: string, data: unknown): Promise<{ success: boolean; error?: string }> {
    return new Promise((resolve) => {
      const state = this.wsManager.getState()
      if (state !== 'connected') {
        this.enqueueOfflineEvent(event, data)
        resolve({ success: false, error: 'Offline' })
        return
      }

      // Send via WebSocket manager
      try {
        // Determine namespace from event
        let namespace: '/chat' | '/presence' | '/notifications' = '/notifications'
        if (event.startsWith('message_') || event.startsWith('chat:')) {
          namespace = '/chat'
        } else if (event.startsWith('user_') || event.startsWith('presence:')) {
          namespace = '/presence'
        }

        // Extract event name (remove namespace prefix if present)
        const eventName = event.includes(':') ? event.split(':')[1] : event

        if (eventName) {
          this.wsManager.send(namespace, eventName, data)
        }
        resolve({ success: true })
        this.processEvent(event, data)
      } catch (error) {
        resolve({ success: false, error: (error instanceof Error ? error : new Error(String(error))).message })
      }
    })
  }

  private processEvent(event: string, data: unknown) {
    // Real event processing without artificial delays
    if (event === 'message_send') {
      // Trigger immediate delivery confirmation
      this.trigger('message_delivered', { messageId: (data as { messageId?: string }).messageId })
    } else if (event === 'webrtc_signal') {
      // Route WebRTC signaling data to the target user
      const signalData = data as WebRTCSignalData
      this.trigger(`webrtc_signal:${String(signalData.to ?? '')}:${String(signalData.callId ?? '')}`, signalData)
      // Also trigger a generic event for the receiver to listen to
      this.trigger('webrtc_signal_received', signalData)
    }
  }

  trigger(event: string, data: unknown) {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          logger.error(`Error in event listener for ${event}`, error instanceof Error ? error : new Error(String(error)))
        }
      })
    }
  }

  private enqueueOfflineEvent(event: string, data: unknown) {
    this.offlineQueue.push({
      id: `${String(Date.now() ?? '')}-${String(Math.random() ?? '')}`,
      name: event,
      data,
      timestamp: Date.now()
    })
  }

  private async flushOfflineQueue() {
    const queue = [...this.offlineQueue]
    this.offlineQueue = []

    for (const event of queue) {
      await this.emit(event.name, event.data)
    }
  }

  // Reconnect logic will be implemented when WebSocket is fully integrated
  // For now, connection is handled via connect() method

  emitMatchCreated(match: Match) {
    this.trigger('match_created', match)
  }

  emitNewMessage(message: Message) {
    this.trigger('message_received', message)
  }

  emitNotification(notification: Notification) {
    this.trigger('notification', notification)
  }

  emitUserOnline(userId: string) {
    this.trigger('user_online', userId)
  }

  emitUserOffline(userId: string) {
    this.trigger('user_offline', userId)
  }

  emitTyping(userId: string, roomId: string, isTyping: boolean) {
    this.trigger('user_typing', { userId, roomId, isTyping })
  }

  /**
   * Send WebRTC signaling data to another peer
   * Used for establishing peer-to-peer video calls
   */
  async emitWebRTCSignal(signalData: WebRTCSignalData): Promise<{ success: boolean; error?: string }> {
    return this.emit('webrtc_signal', signalData)
  }

  /**
   * Listen for incoming WebRTC signaling data
   * @param callId The call ID to listen for
   * @param currentUserId The current user's ID to filter signals
   * @param callback Callback function when signal is received
   * @returns Cleanup function to remove listener
   */
  onWebRTCSignal(
    callId: string,
    currentUserId: string,
    callback: (signal: WebRTCSignalData) => void
  ): () => void {
    const eventKey = `webrtc_signal:${String(currentUserId ?? '')}:${String(callId ?? '')}`
    
    const signalHandler = (data: unknown) => {
      const signal = data as WebRTCSignalData
      if (signal.callId === callId && signal.to === currentUserId) {
        callback(signal)
      }
    }
    
    // Listen to both specific event and generic event
    this.on(eventKey, signalHandler)
    this.on('webrtc_signal_received', signalHandler)
    
    // Return cleanup function
    return () => {
      this.off(eventKey, signalHandler)
      this.off('webrtc_signal_received', signalHandler)
    }
  }

    /**
   * Broadcast an event to all listeners in a room
   * Used for live streaming events like reactions and chat messages
   */
  broadcastToRoom(roomId: string, event: string, data: unknown): void {
    const roomEvent = `room:${String(roomId ?? '')}:${String(event ?? '')}`
    this.trigger(roomEvent, data)
    // Also trigger generic event for backwards compatibility
    if (typeof data === 'object' && data !== null) {
      this.trigger(event, { roomId, ...(data as Record<string, unknown>) })
    } else {
      this.trigger(event, { roomId })
    }
  }

  /**
   * Broadcast a reaction to all viewers in a stream room
   */
  broadcastReaction(roomId: string, reaction: {
    id: string
    userId: string
    userName: string
    userAvatar?: string
    emoji: string
    createdAt: string
  }): void {
    this.broadcastToRoom(roomId, 'reaction', reaction)
  }

  /**
   * Broadcast a chat message to all viewers in a stream room
   */
  broadcastChatMessage(roomId: string, message: {
    id: string
    userId: string
    userName: string
    userAvatar?: string
    text: string
    createdAt: string
  }): void {
    this.broadcastToRoom(roomId, 'chat', message)
  }
}

export const realtime = new RealtimeClient()
