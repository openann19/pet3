'use client';

import type { ChatRoom } from '@/lib/chat-types';
import { useAdvancedChatWindowProps } from './hooks/useAdvancedChatWindowProps';
import { useChatKeyboardShortcutsIntegration } from './hooks/useChatKeyboardShortcutsIntegration';
import { AdvancedChatWindowContent } from './AdvancedChatWindowContent';

export interface AdvancedChatWindowProps {
  room: ChatRoom;
  currentUserId: string;
  currentUserName: string;
  currentUserAvatar?: string;
  onBack?: () => void;
}

export default function AdvancedChatWindow({
  room,
  currentUserId,
  currentUserName,
  currentUserAvatar,
  onBack,
}: AdvancedChatWindowProps): JSX.Element {
  const props = useAdvancedChatWindowProps({
    room,
    currentUserId,
    currentUserName,
    currentUserAvatar,
    onBack,
  });

  useChatKeyboardShortcutsIntegration({
    inputValue: props.inputValue,
    inputRef: props.inputRef,
    messages: props.messages,
    setInputValue: (v: string) => {
      props.onInputChange(v);
    },
    setMessages: () => {
      // Handled by hooks
    },
    scrollRef: props.scrollRef,
    onSend: props.onSendMessage,
    onReaction: props.onReaction,
    onBack: props.onBack,
  });

  return <AdvancedChatWindowContent {...props} />;
}
