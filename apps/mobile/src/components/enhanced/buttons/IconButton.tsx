import React, { useCallback, useRef, useEffect } from 'react'
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { usePressBounce } from '@petspark/motion'
import { useReducedMotionSV } from '@/effects/core/use-reduced-motion-sv'
import { colors } from '@mobile/theme/colors'
import { Dimens } from '@petspark/shared';
import { isTruthy } from '@petspark/shared';
import { elevation } from '@mobile/theme/tokens';

const { component, radius } = Dimens;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export interface IconButtonProps {
  icon: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
  variant?: 'primary' | 'ghost' | 'outline' | 'glass'
  enableRipple?: boolean
  enableGlow?: boolean
  onPress?: () => void
  disabled?: boolean
  style?: ViewStyle
  testID?: string
  accessibilityLabel: string
}

const SIZE_CONFIG = {
  sm: { size: 32, iconSize: 16, padding: 8 },
  md: { size: component.touchTargetMin, iconSize: 20, padding: 12 },
  lg: { size: component.touchTargetMin + 8, iconSize: 24, padding: 16 },
} as const

export function IconButton({
  icon,
  size = 'md',
  variant = 'primary',
  enableRipple = true,
  enableGlow = false,
  onPress,
  disabled = false,
  style,
  testID = 'icon-button',
  accessibilityLabel,
}: IconButtonProps): React.JSX.Element {
  const glowOpacity = useSharedValue(0)
  const isActive = useSharedValue(0)
  const reducedMotion = useReducedMotionSV()
  const pressBounce = usePressBounce(0.9)
  const activeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (activeTimeoutRef.current !== null) {
        clearTimeout(activeTimeoutRef.current)
      }
    }
  }, [])

  const handlePress = useCallback(() => {
    if (isTruthy(disabled)) return

    if (enableRipple) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    }

    if (isTruthy(reducedMotion.value)) {
      isActive.value = withTiming(1, { duration: 100 })
      if (activeTimeoutRef.current !== null) {
        clearTimeout(activeTimeoutRef.current)
      }
      activeTimeoutRef.current = setTimeout(() => {
        isActive.value = withTiming(0, { duration: 100 })
        activeTimeoutRef.current = null
      }, 100)
    } else {
      isActive.value = withSequence(
        withTiming(1, { duration: 100 }),
        withTiming(0, { duration: 200 })
      )
    }

    onPress?.()
  }, [disabled, enableRipple, onPress, isActive, reducedMotion])

  const glowStyle = useAnimatedStyle(() => {
    if (!enableGlow) return {}
    return {
      opacity: glowOpacity.value,
    }
  })

  const activeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - isActive.value * 0.1 }],
  }))

  const config = SIZE_CONFIG[size]

  const variantStyles: Record<string, ViewStyle> = {
    primary: { backgroundColor: colors.accent },
    ghost: { backgroundColor: 'transparent' },
    outline: {
      backgroundColor: 'transparent',
      borderWidth: 2,
      borderColor: colors.accent,
    },
    glass: {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.2)',
    },
  }

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={pressBounce.onPressIn}
      onPressOut={pressBounce.onPressOut}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      style={[
        styles.button,
        {
          width: config.size,
          height: config.size,
          borderRadius: radius.full,
        },
        variantStyles[variant],
        pressBounce.animatedStyle,
        activeStyle,
        style,
        disabled && styles.disabled,
      ]}
      testID={testID}
    >
      {enableGlow && (
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              borderRadius: radius.full,
              backgroundColor: 'rgba(59, 130, 246, 0.3)',
            },
            glowStyle,
          ]}
          pointerEvents="none"
        />
      )}
      <View
        style={[
          styles.iconContainer,
          {
            width: config.iconSize,
            height: config.iconSize,
          },
        ]}
      >
        {icon}
      </View>
    </AnimatedPressable>
  )
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    ...elevation.raised,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
})
