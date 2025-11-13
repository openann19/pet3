/**
 * Hook for Chat Screen Call Management
 * 
 * Handles call-related logic for chat screen including incoming calls,
 * call state management, and call actions.
 * 
 * Location: apps/mobile/src/hooks/chat/useChatCallManager.ts
 */

import { useState, useCallback, useEffect, useMemo } from 'react'
import { useCallManager } from '@mobile/hooks/call/useCallManager'
import { useUserStore } from '@mobile/store/user-store'
import { realtime } from '@mobile/lib/realtime'
import { createLogger } from '@mobile/utils/logger'
import type { CallInfo } from '@mobile/hooks/call/useCallManager'

const logger = createLogger('useChatCallManager')

export interface UseChatCallManagerOptions {
  chatId?: string | undefined
  matchId?: string | undefined
  remoteUserId?: string | undefined
  remoteUserName?: string | undefined
  remoteUserPhoto?: string | undefined
}

export interface UseChatCallManagerReturn {
  callManager: ReturnType<typeof useCallManager>
  handleStartCall: () => Promise<void>
  handleEndCall: () => Promise<void>
  handleAcceptCall: () => Promise<void>
  handleDeclineCall: () => Promise<void>
}

/**
 * Hook for managing call functionality in chat screen
 */
export function useChatCallManager(options: UseChatCallManagerOptions): UseChatCallManagerReturn {
  const { chatId, matchId, remoteUserId, remoteUserName, remoteUserPhoto } = options

  const user = useUserStore((state) => state.user)
  const localUserId = useMemo(() => user?.id ?? 'current-user', [user?.id])

  // Initialize call manager
  const callManager = useCallManager({
    localUserId,
    onCallStateChange: (status) => {
      logger.info('Call status changed', { status })
    },
    onError: (error) => {
      logger.error('Call error', error)
    },
  })

  // Listen for incoming calls
  useEffect(() => {
    if (localUserId === null || localUserId === undefined || localUserId === '') return

    let mounted = true

    // Listen for incoming call signals from RealtimeClient
    const unsubscribe = realtime.onWebRTCSignal(
      'incoming-call',
      localUserId,
      (signal) => {
        if (!mounted) return

        if (signal.type === 'offer' && signal.from !== null && signal.from !== undefined && signal.from !== '') {
          // Handle incoming call
          logger.info('Incoming call received', {
            from: signal.from,
            callId: signal.callId,
          })

          // Set incoming call in call manager
          // In production, this would fetch user info from API
          const callInfo: CallInfo = {
            callId: signal.callId ?? `call-${Date.now()}`,
            remoteUserId: signal.from,
            remoteName: remoteUserName ?? 'Remote User',
            isCaller: false,
          }
          if (remoteUserPhoto !== null && remoteUserPhoto !== undefined && remoteUserPhoto !== '') {
            callInfo.remotePhoto = remoteUserPhoto
          }
          callManager.setIncomingCall(callInfo)
        }
      }
    )

    return () => {
      mounted = false
      unsubscribe()
    }
  }, [localUserId, remoteUserName, remoteUserPhoto, callManager])

  // Handle start call
  const handleStartCall = useCallback(async () => {
    if (remoteUserId === null || remoteUserId === undefined || remoteUserId === '') return
    try {
      await callManager.startCall(
        remoteUserId,
        remoteUserName ?? 'Remote User',
        remoteUserPhoto
      )
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to start call')
      logger.error('Failed to start call', err)
    }
  }, [callManager, remoteUserId, remoteUserName, remoteUserPhoto])

  // Handle end call
  const handleEndCall = useCallback(async () => {
    try {
      await callManager.endCall()
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to end call')
      logger.error('Failed to end call', err)
    }
  }, [callManager])

  // Handle accept call
  const handleAcceptCall = useCallback(async () => {
    try {
      await callManager.acceptCall()
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to accept call')
      logger.error('Failed to accept call', err)
    }
  }, [callManager])

  // Handle decline call
  const handleDeclineCall = useCallback(async () => {
    try {
      await callManager.declineCall()
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to decline call')
      logger.error('Failed to decline call', err)
    }
  }, [callManager])

  return {
    callManager,
    handleStartCall,
    handleEndCall,
    handleAcceptCall,
    handleDeclineCall,
  }
}

