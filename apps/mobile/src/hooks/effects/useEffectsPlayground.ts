/**
 * Hook for Effects Playground
 * 
 * Manages effect state and handlers for the effects playground screen.
 * 
 * Location: apps/mobile/src/hooks/effects/useEffectsPlayground.ts
 */

import { useCallback, useState } from 'react'
import { useSendWarp } from '@mobile/effects/chat/bubbles/use-send-warp'
import { useSwipeReplyElastic } from '@mobile/effects/chat/gestures/use-swipe-reply-elastic'
import { useGlassMorphZoom } from '@mobile/effects/chat/media/use-glass-morph-zoom'
import { withTiming } from 'react-native-reanimated'

const CANVAS_WIDTH = 300
const CANVAS_HEIGHT = 200

export interface UseEffectsPlaygroundReturn {
  reducedMotion: boolean
  setReducedMotion: (value: boolean) => void
  sendWarp: ReturnType<typeof useSendWarp>
  mediaZoom: ReturnType<typeof useGlassMorphZoom>
  swipeReply: ReturnType<typeof useSwipeReplyElastic>
  handleSendWarp: () => void
  handleMediaZoom: () => void
  handleMediaClose: () => void
  handleReset: () => void
  handleAnimateRibbon: () => void
  canvasWidth: number
  canvasHeight: number
}

/**
 * Hook for managing effects playground state and handlers
 */
export function useEffectsPlayground(): UseEffectsPlaygroundReturn {
  const [reducedMotion, setReducedMotion] = useState(false)

  // Send Warp
  const sendWarp = useSendWarp({
    enabled: true,
    onComplete: () => {
      // Reset for replay
    },
  })

  // Media Zoom
  const mediaZoom = useGlassMorphZoom({
    enabled: true,
    blurRadius: 12,
  })

  // Swipe Reply
  const swipeReply = useSwipeReplyElastic({
    enabled: true,
    onThresholdCross: () => {
      // Demo threshold cross
    },
    onReply: () => {
      // Demo reply
    },
  })

  const handleSendWarp = useCallback(() => {
    sendWarp.bloomCenterX.value = CANVAS_WIDTH / 2
    sendWarp.bloomCenterY.value = CANVAS_HEIGHT / 2
    sendWarp.trigger()
  }, [sendWarp])

  const handleMediaZoom = useCallback(() => {
    mediaZoom.aberrationCenter.value = { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 }
    mediaZoom.open()
  }, [mediaZoom])

  const handleMediaClose = useCallback(() => {
    mediaZoom.close()
  }, [mediaZoom])

  const handleReset = useCallback(() => {
    sendWarp.translateX.value = 0
    sendWarp.opacity.value = 1
    sendWarp.glowOpacity.value = 0
    sendWarp.bloomIntensity.value = 0

    mediaZoom.scale.value = 1
    mediaZoom.opacity.value = 0
    mediaZoom.aberrationRadius.value = 0
    mediaZoom.aberrationIntensity.value = 0

    swipeReply.translateX.value = 0
    swipeReply.ribbonProgress.value = 0
    swipeReply.ribbonAlpha.value = 0
  }, [sendWarp, mediaZoom, swipeReply])

  const handleAnimateRibbon = useCallback(() => {
    swipeReply.ribbonP0.value = { x: 50, y: 100 }
    swipeReply.ribbonP1.value = { x: 250, y: 100 }
    swipeReply.ribbonProgress.value = withTiming(1, { duration: 180 })
    swipeReply.ribbonAlpha.value = withTiming(1, { duration: 180 })
  }, [swipeReply])

  return {
    reducedMotion,
    setReducedMotion,
    sendWarp,
    mediaZoom,
    swipeReply,
    handleSendWarp,
    handleMediaZoom,
    handleMediaClose,
    handleReset,
    handleAnimateRibbon,
    canvasWidth: CANVAS_WIDTH,
    canvasHeight: CANVAS_HEIGHT,
  }
}

