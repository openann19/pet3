import React from 'react'
import Animated from 'react-native-reanimated'
import type { ViewProps } from 'react-native'

/**
 * Animated View wrapper for Reanimated
 * Provides consistent animated View component across the app
 */
export const AnimatedView = Animated.createAnimatedComponent(
  React.forwardRef<any, ViewProps>((props, ref) => (
    <Animated.View ref={ref} {...props} />
  ))
)
