/**
 * Call Modals Component
 * Handles call interface and incoming call notifications
 * Location: apps/mobile/src/components/chat/CallModals.tsx
 */

import React, { memo } from 'react'
import { Modal } from 'react-native'
import {
  CallInterface,
  IncomingCallNotification,
} from '@mobile/components/call'
import type { useCallManager } from '@mobile/hooks/call/useCallManager'

interface CallModalsProps {
  callManager: ReturnType<typeof useCallManager>
  onEndCall: () => Promise<void>
  onAcceptCall: () => Promise<void>
  onDeclineCall: () => Promise<void>
}

export const CallModals = memo(
  ({ callManager, onEndCall, onAcceptCall, onDeclineCall }: CallModalsProps): React.ReactElement => {
    return (
      <>
        {/* Call Interface Modal */}
        {callManager.currentCall !== null &&
          callManager.currentCall !== undefined &&
          callManager.callState !== null &&
          callManager.callState !== undefined &&
          (callManager.callStatus === 'active' || callManager.callStatus === 'outgoing') && (
            <Modal
              visible={true}
              transparent
              animationType="fade"
              statusBarTranslucent
              accessible={true}
              accessibilityViewIsModal={true}
              accessibilityLabel="Video call interface"
            >
              <CallInterface
                callId={callManager.currentCall.callId}
                remoteUserId={callManager.currentCall.remoteUserId}
                remoteName={callManager.currentCall.remoteName}
                {...(callManager.currentCall.remotePhoto !== null &&
                  callManager.currentCall.remotePhoto !== undefined &&
                  callManager.currentCall.remotePhoto !== '' && {
                    remotePhoto: callManager.currentCall.remotePhoto,
                  })}
                onEndCall={() => {
                  void onEndCall()
                }}
                isCaller={callManager.currentCall.isCaller}
              />
            </Modal>
          )}

        {/* Incoming Call Notification */}
        {callManager.hasIncomingCall === true &&
          callManager.incomingCall !== null &&
          callManager.incomingCall !== undefined && (
            <IncomingCallNotification
              visible={callManager.callStatus === 'incoming'}
              caller={{
                id: callManager.incomingCall.remoteUserId,
                name: callManager.incomingCall.remoteName,
                ...(callManager.incomingCall.remotePhoto !== null &&
                  callManager.incomingCall.remotePhoto !== undefined &&
                  callManager.incomingCall.remotePhoto !== '' && {
                    photo: callManager.incomingCall.remotePhoto,
                  }),
              }}
              onAccept={() => {
                void onAcceptCall()
              }}
              onDecline={() => {
                void onDeclineCall()
              }}
            />
          )}
      </>
    )
  }
)

CallModals.displayName = 'CallModals'

