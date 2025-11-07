'use client'

import { AnimatedView } from '@/effects/reanimated/animated-view'
import React, { useEffect, useRef } from 'react'
import { StyleSheet, Text } from 'react-native'
import type { CSSProperties } from 'react'

const isWeb = typeof window !== 'undefined'

export interface DropZoneWebProps {
  onDrop: (file: File) => void
}

export function DropZoneWeb({ onDrop }: DropZoneWebProps): React.ReactElement | null {
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!isWeb) {
      return
    }

    const element = ref.current
    if (!element) {
      return
    }

    const preventDefault = (event: DragEvent): void => {
      event.preventDefault()
      event.stopPropagation()
    }

    const handleDrop = (event: DragEvent): void => {
      event.preventDefault()
      event.stopPropagation()

      const file = event.dataTransfer?.files?.[0]
      if (file && (file.type.startsWith('image/') || file.type.startsWith('video/'))) {
        onDrop(file)
      }
    }

    element.addEventListener('dragover', preventDefault)
    element.addEventListener('dragenter', preventDefault)
    element.addEventListener('drop', handleDrop)

    return () => {
      element.removeEventListener('dragover', preventDefault)
      element.removeEventListener('dragenter', preventDefault)
      element.removeEventListener('drop', handleDrop)
    }
  }, [onDrop])

  if (!isWeb) {
    return null
  }

  const dropZoneStyle: CSSProperties = {
    borderWidth: 1,
    borderColor: '#666',
    borderStyle: 'dashed',
    backgroundColor: '#222',
    borderRadius: 12,
    padding: 24,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    minHeight: 120,
    flexDirection: 'column',
  }

  return (
    <AnimatedView
      ref={ref}
      style={dropZoneStyle}
      role="button"
      aria-label="Drop photo or video here"
    >
      <Text style={styles.text}>Drag & drop photo or video</Text>
    </AnimatedView>
  )
}

const styles = StyleSheet.create({
  text: {
    color: '#999',
    fontSize: 14,
    fontWeight: '500',
  },
})

