/**
 * Skeleton loading component
 * Location: src/components/SkeletonLoader.tsx
 */

import React from 'react'
import type { ViewStyle } from 'react-native'
import { StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated'
import { motion } from '@petspark/motion'

export interface SkeletonLoaderProps {
  width?: number
  height?: number
  borderRadius?: number
  style?: ViewStyle
  variant?: 'pulse' | 'shimmer'
}

export function SkeletonLoader({
  width,
  height = 20,
  borderRadius = 4,
  style,
  variant = 'shimmer',
}: SkeletonLoaderProps): React.JSX.Element {
  const shimmer = useSharedValue(0)

  React.useEffect(() => {
    if (variant === 'shimmer') {
      shimmer.value = withRepeat(
        withTiming(1, { duration: motion.durations.standard }),
        -1,
        false
      )
    } else {
      shimmer.value = withRepeat(
        withTiming(1, { duration: motion.durations.enterExit }),
        -1,
        true
      )
    }
  }, [shimmer, variant])

  const animatedStyle = useAnimatedStyle(() => {
    if (variant === 'pulse') {
      const opacity = interpolate(shimmer.value, [0, 0.5, 1], [0.3, 0.6, 0.3])
      return {
        opacity,
      }
    }
    // Shimmer effect
    const translateX = interpolate(shimmer.value, [0, 1], [-width ?? 200, width ?? 200])
    return {
      transform: [{ translateX }],
    }
  })

  if (variant === 'shimmer') {
    return (
      <Animated.View
        style={[
          styles.skeleton,
          width !== undefined ? { width } : undefined,
          {
            height,
            borderRadius,
            overflow: 'hidden',
          },
          style,
        ]}
      >
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: width ? width * 2 : 400,
            },
            animatedStyle,
          ]}
        >
          <LinearGradient
            colors={['transparent', 'rgba(255,255,255,0.3)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </Animated.View>
    )
  }

  return (
    <Animated.View
      style={[
        styles.skeleton,
        width !== undefined ? { width } : undefined,
        {
          height,
          borderRadius,
        },
        style,
        animatedStyle,
      ]}
    />
  )
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#E0E0E0',
  },
})
