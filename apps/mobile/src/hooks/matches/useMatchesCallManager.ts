/**
 * Hook for Matches Screen Call Management
 * 
 * Handles call-related logic for matches screen including incoming calls,
 * call state management, and call actions.
 * 
 * Location: apps/mobile/src/hooks/matches/useMatchesCallManager.ts
 */

import { useCallback, useEffect, useMemo } from 'react'
import { useCallManager } from '@mobile/hooks/call/useCallManager'
import { useUserStore } from '@mobile/store/user-store'
import { realtime } from '@mobile/lib/realtime'
import { createLogger } from '@mobile/utils/logger'
import { generateCallId } from '@mobile/utils/id-generator'
import type { CallInfo } from '@mobile/hooks/call/useCallManager'
import * as Haptics from 'expo-haptics'

const logger = createLogger('useMatchesCallManager')

export interface UseMatchesCallManagerOptions {
  matchId?: string | undefined
  selectedMatchUserName?: string | undefined
  selectedMatchUserPhoto?: string | undefined
}

export interface UseMatchesCallManagerReturn {
  callManager: ReturnType<typeof useCallManager>
  handleEndCall: () => Promise<void>
  handleAcceptCall: () => Promise<void>
  handleDeclineCall: () => Promise<void>
}

/**
 * Hook for managing call functionality in matches screen
 */
export function useMatchesCallManager(
  options: UseMatchesCallManagerOptions
): UseMatchesCallManagerReturn {
  const { matchId, selectedMatchUserName, selectedMatchUserPhoto } = options

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
            callId: signal.callId ?? generateCallId(),
            remoteUserId: signal.from,
            remoteName: selectedMatchUserName ?? 'Match User',
            isCaller: false,
          }
          if (selectedMatchUserPhoto !== null && selectedMatchUserPhoto !== undefined && selectedMatchUserPhoto !== '') {
            callInfo.remotePhoto = selectedMatchUserPhoto
          }
          callManager.setIncomingCall(callInfo)
        }
      }
    )

    return () => {
      mounted = false
      unsubscribe()
    }
  }, [localUserId, selectedMatchUserName, selectedMatchUserPhoto, callManager])

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
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
      await callManager.acceptCall()
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to accept call')
      logger.error('Failed to accept call', err)
    }
  }, [callManager])

  // Handle decline call
  const handleDeclineCall = useCallback(async () => {
    try {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      await callManager.declineCall()
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to decline call')
      logger.error('Failed to decline call', err)
    }
  }, [callManager])

  return {
    callManager,
    handleEndCall,
    handleAcceptCall,
    handleDeclineCall,
  }
}

