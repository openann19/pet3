/**
 * Spinner Component (Mobile)
 * Premium loading spinner with smooth animations and reduced motion support
 * Location: apps/mobile/src/components/ui/Spinner.tsx
 */

import React, { useEffect } from 'react'
import type { ViewStyle, StyleProp } from 'react-native'
import { StyleSheet, View, AccessibilityInfo } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated'
import { isTruthy } from '@petspark/shared'
import { colors } from '@mobile/theme/colors'
import { motionTokens } from '@petspark/motion'
import { Dimens } from '@petspark/shared';

const { radius } = Dimens;
const motion = {
  slow: motionTokens.durations.slow,
  smooth: motionTokens.durations.enterExit,
};

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'subtle' | 'premium'
  style?: StyleProp<ViewStyle>
  testID?: string
}

const sizeValues = {
  sm: 16,
  md: 32,
  lg: 48,
} as const

const borderWidthValues = {
  sm: 2,
  md: 2,
  lg: 4,
} as const

export function Spinner({
  size = 'md',
  variant = 'default',
  style,
  testID = 'spinner',
}: SpinnerProps): React.JSX.Element {
  const [reducedMotion, setReducedMotion] = React.useState(false)

  React.useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(enabled => {
      setReducedMotion(enabled)
    })
  }, [])

  const rotation = useSharedValue(0)
  const opacity = useSharedValue(1)

  useEffect(() => {
    if (isTruthy(reducedMotion)) {
      // For reduced motion, use a slower, less noticeable animation
      rotation.value = withRepeat(
        withTiming(360, {
          duration: motion.slow * 2,
          easing: Easing.linear,
        }),
        -1,
        false
      )
      opacity.value = withRepeat(
        withTiming(0.7, {
          duration: motion.smooth,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        true
      )
    } else {
      // Premium smooth animation for normal users
      rotation.value = withRepeat(
        withTiming(360, {
          duration: motion.smooth,
          easing: Easing.linear,
        }),
        -1,
        false
      )
      opacity.value = 1
    }
  }, [reducedMotion, rotation, opacity])

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${String(rotation.value ?? '')}deg` }],
      opacity: opacity.value,
    }
  })

  const sizeValue = sizeValues[size]
  const borderWidth = borderWidthValues[size]

  const variantStyles = {
    default: {
      borderColor: colors.accent,
      borderTopColor: 'transparent',
    },
    subtle: {
      borderColor: `${colors.accent}99`, // 60% opacity
      borderTopColor: `${colors.accent}66`, // 40% opacity
    },
    premium: {
      borderColor: colors.accent,
      borderTopColor: 'transparent',
      shadowColor: colors.accent,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 2,
    },
  } as const

  const containerStyle = [
    styles.container,
    {
      width: sizeValue,
      height: sizeValue,
      borderWidth,
      ...variantStyles[variant],
    },
    style,
  ]

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel="Loading"
      accessibilityLiveRegion="polite"
      testID={testID}
      style={styles.wrapper}
    >
      <Animated.View style={[containerStyle, animatedStyle]} />
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    borderRadius: radius.full,
    borderStyle: 'solid',
  },
})
