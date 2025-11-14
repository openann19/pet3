/**
 * Optimized image component with progressive loading and caching
 * Location: src/components/OptimizedImage.tsx
 * 
 * Features:
 * - Progressive loading with blurhash placeholder
 * - Memory and disk caching
 * - Accessibility support
 * - Error handling with fallback
 */

import { Image as ExpoImage, type ImageContentFit } from 'expo-image'
import React, { useState } from 'react'
import { ActivityIndicator, StyleSheet, View, type ImageStyle } from 'react-native'
import { colors } from '@mobile/theme/colors'

export interface OptimizedImageProps {
  uri: string
  width?: number
  height?: number
  style?: ImageStyle
  resizeMode?: ImageContentFit
  placeholder?: string
  priority?: 'low' | 'normal' | 'high'
  accessibilityLabel?: string
  onLoad?: () => void
  onError?: () => void
}

export function OptimizedImage({
  uri,
  width,
  height,
  style,
  resizeMode = 'cover',
  placeholder,
  priority = 'normal',
  accessibilityLabel,
  onLoad,
  onError,
}: OptimizedImageProps): React.JSX.Element {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const imageStyle: ImageStyle[] = [width && { width }, height && { height }, style].filter(
    Boolean
  ) as ImageStyle[]

  const handleLoad = (): void => {
    setIsLoading(false)
    onLoad?.()
  }

  const handleError = (): void => {
    setIsLoading(false)
    setHasError(true)
    onError?.()
  }

  if (hasError) {
    return (
      <View
        style={[
          imageStyle,
          styles.errorContainer,
          { backgroundColor: colors.surface },
        ]}
        accessible={true}
        accessibilityRole="image"
        accessibilityLabel={accessibilityLabel ?? 'Image failed to load'}
      >
        <ActivityIndicator size="small" color={colors.textSecondary} />
      </View>
    )
  }

  return (
    <View style={imageStyle}>
      {isLoading && (
        <View style={styles.loadingContainer} pointerEvents="none">
          <ActivityIndicator size="small" color={colors.accent} />
        </View>
      )}
      <ExpoImage
        source={{ uri }}
        style={imageStyle}
        contentFit={resizeMode}
        {...(placeholder !== undefined ? { placeholder } : {})}
        transition={200}
        cachePolicy="memory-disk"
        priority={priority}
        recyclingKey={uri}
        onLoad={handleLoad}
        onError={handleError}
        accessible={true}
        accessibilityRole="image"
        {...(accessibilityLabel !== undefined ? { accessibilityLabel } : {})}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
})
