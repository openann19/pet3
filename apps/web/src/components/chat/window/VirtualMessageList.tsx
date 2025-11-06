'use client'

import * as React from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import type { ChatMessage } from '@/lib/chat-types'
import { groupMessagesByDate } from '@/lib/chat-utils'
import { MessageItem } from './MessageItem'
import { useEntryAnimation } from '@/effects/reanimated/use-entry-animation'
import { AnimatedView } from '@/effects/reanimated/animated-view'
import TypingIndicatorComponent from '../TypingIndicator'
import { AnimatePresence } from '@/effects/reanimated/animate-presence'

export interface VirtualMessageListProps {
  messages: ChatMessage[]
  currentUserId: string
  typingUsers: Array<{ userName?: string }>
  onReaction: (messageId: string, emoji: string) => void
  onTranslate: (messageId: string) => void
  className?: string
}

export function VirtualMessageList({
  messages,
  currentUserId,
  typingUsers,
  onReaction,
  onTranslate,
  className,
}: VirtualMessageListProps): JSX.Element {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const groups = React.useMemo(() => groupMessagesByDate(messages || []), [messages])

  const flat = React.useMemo(() => {
    const out: Array<
      | { type: 'header'; key: string; date: string }
      | { type: 'msg'; key: string; msg: ChatMessage }
      | { type: 'typing'; key: string }
    > = []
    for (const g of groups) {
      out.push({ type: 'header', key: `h:${g.date}`, date: g.date })
      for (const m of g.messages) {
        out.push({ type: 'msg', key: m.id, msg: m })
      }
    }
    if (typingUsers.length > 0) {
      out.push({ type: 'typing', key: 'typing' })
    }
    return out
  }, [groups, typingUsers])

  const rowVirtualizer = useVirtualizer({
    count: flat.length,
    getScrollElement: () => containerRef.current,
    estimateSize: (i) => {
      const row = flat[i]
      if (row.type === 'header') return 36
      if (row.type === 'typing') return 60
      return 84
    },
    overscan: 12,
  })

  const headerFx = useEntryAnimation({ initialScale: 0.8, delay: 0 })

  return (
    <div ref={containerRef} className={`flex-1 overflow-y-auto p-4 ${className ?? ''}`}>
      <div style={{ height: rowVirtualizer.getTotalSize(), position: 'relative' }}>
        {rowVirtualizer.getVirtualItems().map((vi) => {
          const row = flat[vi.index]
          return (
            <div
              key={row.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${vi.start}px)`,
              }}
            >
              {row.type === 'header' ? (
                <AnimatedView style={headerFx.animatedStyle} className="flex justify-center py-2">
                  <div className="glass-effect px-4 py-1.5 rounded-full text-xs font-medium text-muted-foreground shadow-sm">
                    {row.date}
                  </div>
                </AnimatedView>
              ) : row.type === 'typing' ? (
                <AnimatePresence>
                  <TypingIndicatorComponent key="typing" users={typingUsers} />
                </AnimatePresence>
              ) : (
                <MessageItem
                  message={row.msg}
                  isCurrentUser={row.msg.senderId === currentUserId}
                  currentUserId={currentUserId}
                  delay={0}
                  onReaction={onReaction}
                  onTranslate={onTranslate}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

