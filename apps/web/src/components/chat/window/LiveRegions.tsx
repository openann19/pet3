'use client'

import type { ReactNode } from 'react'

export interface AnnounceNewMessageProps {
  lastText: string | null
}

export function AnnounceNewMessage({ lastText }: AnnounceNewMessageProps): JSX.Element {
  return (
    <div aria-live="polite" aria-atomic="true" className="sr-only">
      {lastText ? `New message: ${lastText}` : ''}
    </div>
  )
}

export interface AnnounceTypingProps {
  userName: string | null
}

export function AnnounceTyping({ userName }: AnnounceTypingProps): JSX.Element {
  return (
    <div aria-live="polite" aria-atomic="true" className="sr-only">
      {userName ? `${userName} is typing...` : ''}
    </div>
  )
}

