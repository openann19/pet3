/**
 * Chat data hook for ChatScreen
 * Location: apps/mobile/src/hooks/chat/useChatData.ts
 */

import { useMemo } from 'react'
import type { Message } from '@mobile/components/chat'
import { useChatMessages } from '@mobile/hooks/api/use-chat'

export interface UseChatDataOptions {
  chatId?: string | undefined
  matchId?: string | undefined
}

export interface UseChatDataReturn {
  messages: Message[]
  isLoading: boolean
  remoteUserId: string
  remoteUserName: string
  remoteUserPhoto: string | undefined
}

/**
 * Hook to fetch and manage chat data for ChatScreen
 */
export function useChatData(options: UseChatDataOptions): UseChatDataReturn {
  const { chatId, matchId } = options

  // Determine chat room ID from chatId or matchId
  const chatRoomId = useMemo(() => {
    return chatId ?? matchId ?? undefined
  }, [chatId, matchId])

  // Fetch messages using the API hook
  const { data: messagesData, isLoading } = useChatMessages(chatRoomId)

  // Flatten messages from infinite query pages
  const messages = useMemo(() => {
    if (!messagesData?.pages) return []
    return messagesData.pages.flat()
  }, [messagesData])

  // Use route params if available, otherwise fallback to demo values
  // In production, this would fetch user info from API using chatId/matchId
  const remoteUserId = useMemo(() => {
    return chatId ?? matchId ?? 'remote-user-id'
  }, [chatId, matchId])

  const remoteUserName = 'Remote User'
  const remoteUserPhoto = undefined

  return {
    messages,
    isLoading,
    remoteUserId,
    remoteUserName,
    remoteUserPhoto,
  }
}

