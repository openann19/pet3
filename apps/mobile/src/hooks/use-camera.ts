/**
 * Camera integration for pet photos
 * Location: src/hooks/use-camera.ts
 */

import { Camera } from 'expo-camera'
import * as Haptics from 'expo-haptics'
import * as ImageManipulator from 'expo-image-manipulator'
import type { RefObject } from 'react'
import { useRef, useState } from 'react'
import { createLogger } from '../utils/logger'

const logger = createLogger('useCamera')

export interface CameraResult {
  uri: string
  width: number
  height: number
}

export interface UseCameraReturn {
  permission: Awaited<ReturnType<typeof Camera.useCameraPermissions>>[0] | null
  requestPermission: () => Promise<boolean>
  cameraRef: RefObject<Camera>
  takePicture: () => Promise<CameraResult | null>
  isProcessing: boolean
}

export function useCamera(): UseCameraReturn {
  const [permission, requestPermission] = Camera.useCameraPermissions()
  const [isProcessing, setIsProcessing] = useState(false)
  const cameraRef = useRef<Camera>(null)

  const takePicture = async (): Promise<CameraResult | null> => {
    if (!cameraRef.current || !permission?.granted) {
      return null
    }

    try {
      setIsProcessing(true)
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
      })

      // Compress and resize for optimal performance
      const manipulated = await ImageManipulator.manipulateAsync(
        photo.uri,
        [{ resize: { width: 1080 } }],
        {
          compress: 0.8,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      )

      return {
        uri: manipulated.uri,
        width: manipulated.width,
        height: manipulated.height,
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to take picture', err)
      return null
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRequestPermission = async (): Promise<boolean> => {
    const result = await requestPermission()
    return result.granted
  }

  return {
    permission,
    requestPermission: handleRequestPermission,
    cameraRef,
    takePicture,
    isProcessing,
  }
}

