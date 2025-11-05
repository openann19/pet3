/**
 * Video Engine Service
 * 
 * Provides high-performance video frame callbacks using requestVideoFrameCallback
 * when available (Chrome/Edge), with timeupdate fallback for other browsers.
 * 
 * Location: apps/web/src/core/services/media/video-engine.ts
 */

export interface VideoFrameCallback {
  (): void
}

export interface VideoFrameCleanup {
  (): void
}

/**
 * Subscribe to video frame updates
 * Uses requestVideoFrameCallback when available for 60/120Hz sync
 * Falls back to timeupdate event for compatibility
 * 
 * @param videoElement - HTML video element to monitor
 * @param callback - Function called on each frame update
 * @returns Cleanup function to cancel subscription
 */
export function onVideoFrames(
  videoElement: HTMLVideoElement,
  callback: VideoFrameCallback
): VideoFrameCleanup {
  // Check for requestVideoFrameCallback support (Chrome/Edge)
  const rVFC = (videoElement as unknown as { requestVideoFrameCallback?: (callback: () => void) => number }).requestVideoFrameCallback

  if (typeof rVFC === 'function') {
    let frameId: number | null = null
    let isActive = true

    const tick = (): void => {
      if (!isActive) return
      callback()
      frameId = rVFC.call(videoElement, tick)
    }

    // Start the frame loop
    frameId = rVFC.call(videoElement, tick)

    // Return cleanup function
    return () => {
      isActive = false
      if (frameId !== null && typeof videoElement.cancelVideoFrameCallback === 'function') {
        videoElement.cancelVideoFrameCallback(frameId)
      }
      frameId = null
    }
  }

  // Fallback to timeupdate event
  const handleTimeUpdate = (): void => {
    callback()
  }

  videoElement.addEventListener('timeupdate', handleTimeUpdate)

  // Return cleanup function
  return () => {
    videoElement.removeEventListener('timeupdate', handleTimeUpdate)
  }
}

/**
 * Get video metadata synchronously if available
 */
export function getVideoMetadata(videoElement: HTMLVideoElement): {
  width: number
  height: number
  duration: number
  currentTime: number
} | null {
  if (videoElement.readyState >= 2) {
    return {
      width: videoElement.videoWidth,
      height: videoElement.videoHeight,
      duration: videoElement.duration,
      currentTime: videoElement.currentTime,
    }
  }
  return null
}

/**
 * Check if requestVideoFrameCallback is supported
 */
export function supportsVideoFrameCallback(videoElement: HTMLVideoElement): boolean {
  return typeof (videoElement as unknown as { requestVideoFrameCallback?: unknown }).requestVideoFrameCallback === 'function'
}
