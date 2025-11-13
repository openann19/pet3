/**
 * ChatScreen Component
 *
 * Premium chat screen integrating ultra-premium chat effects:
 * - ChatList with Layout Animations
 * - Message bubbles with send/receive effects
 * - Status ticks, reactions, typing indicators
 * - Scroll FAB with magnetic effect
 * - Video calling integration
 *
 * Location: apps/mobile/src/screens/ChatScreen.tsx
 */
import { ChatList } from '@mobile/components/chat'
import { ChatHeader } from '@mobile/components/chat/ChatHeader'
import { CallModals } from '@mobile/components/chat/CallModals'
import { useChatData } from '@mobile/hooks/chat/useChatData'
import { useChatCallManager } from '@mobile/hooks/chat/useChatCallManager'
import { useValidatedRouteParam } from '@mobile/hooks/use-validated-route-params'
import { useUserStore } from '@mobile/store/user-store'
import HoloBackgroundNative from '@mobile/components/chrome/HoloBackground'
import { colors } from '@mobile/theme/colors'
import { spacing } from '@mobile/theme/tokens'
import React, { useMemo } from 'react'
import { StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export function ChatScreen(): React.ReactElement {
  // Validate and extract route params safely
  const chatIdParam = useValidatedRouteParam('Chat', 'chatId')
  const matchIdParam = useValidatedRouteParam('Chat', 'matchId')

  // Type-safe extraction: validate that params are strings
  const chatId = typeof chatIdParam === 'string' ? chatIdParam : undefined
  const matchId = typeof matchIdParam === 'string' ? matchIdParam : undefined

  const user = useUserStore((state) => state.user)
  const localUserId = useMemo(() => user?.id ?? 'current-user', [user?.id])

  // Fetch chat data
  const { messages, remoteUserId, remoteUserName, remoteUserPhoto } = useChatData({
    chatId,
    matchId,
  })

  // Manage call functionality
  const { callManager, handleStartCall, handleEndCall, handleAcceptCall, handleDeclineCall } =
    useChatCallManager({
      chatId,
      matchId,
      remoteUserId,
      remoteUserName,
      remoteUserPhoto,
    })

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <HoloBackgroundNative intensity={0.5} />
      <View
        style={styles.chatContainer}
        accessible={true}
        accessibilityRole="main"
        accessibilityLabel="Chat screen with messages and video call support"
      >
        <ChatHeader isInCall={callManager.isInCall} onStartCall={handleStartCall} />
        <ChatList messages={messages} currentUserId={localUserId} />
      </View>

      <CallModals
        callManager={callManager}
        onEndCall={handleEndCall}
        onAcceptCall={handleAcceptCall}
        onDeclineCall={handleDeclineCall}
      />
    </SafeAreaView>
  )
}

ChatScreen.displayName = 'ChatScreen'

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  chatContainer: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
})

