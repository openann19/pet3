'use client'

import React, { useCallback, useEffect, useState } from 'react'
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  AccessibilityInfo,
  type ViewStyle,
  type TextStyle,
} from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated'
import { BlurView } from 'expo-blur'
import * as Haptics from 'expo-haptics'
import { useReducedMotionSV } from '@mobile/effects/core/use-reduced-motion-sv'
import { colors } from '@mobile/theme/colors'
import { Typography, Dimens } from '@petspark/shared';
import { isTruthy } from '@petspark/shared';
import { motionTokens } from '@petspark/motion';

const { radius, spacing: spacingTokens, component } = Dimens;
const TOUCH_TARGET_MIN = component.touchTargetMin;
const motion = {
  durations: motionTokens.durations,
  spring: motionTokens.spring,
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)
const AnimatedView = Animated.View

export interface DialogProps {
  visible: boolean
  onClose: () => void
  children: React.ReactNode
  showCloseButton?: boolean
  hapticFeedback?: boolean
  accessibilityLabel?: string
  accessibilityHint?: string
}

export interface DialogContentProps {
  children: React.ReactNode
  style?: ViewStyle
}

export interface DialogHeaderProps {
  children: React.ReactNode
  style?: ViewStyle
}

export interface DialogFooterProps {
  children: React.ReactNode
  style?: ViewStyle
}

export interface DialogTitleProps {
  children: React.ReactNode
  style?: TextStyle
}

export interface DialogDescriptionProps {
  children: React.ReactNode
  style?: TextStyle
}

// Use motion tokens for spring config
const SPRING_CONFIG = {
  damping: motion.spring.smooth.damping,
  stiffness: motion.spring.smooth.stiffness,
  mass: motion.spring.smooth.mass,
} as const

function DialogOverlay({
  visible,
  onPress,
  reducedMotion,
}: {
  visible: boolean
  onPress: () => void
  reducedMotion: boolean
}): React.JSX.Element {
  const opacity = useSharedValue(0)

  useEffect(() => {
    opacity.value = withTiming(visible ? 1 : 0, {
      duration: reducedMotion ? motion.durations.fast : motion.durations.enterExit,
    })
  }, [visible, opacity, reducedMotion])

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    }
  })

  return (
    <AnimatedPressable
      style={[styles.overlay, animatedStyle]}
      onPress={onPress}
      accessible={false}
      importantForAccessibility="no"
    >
      <BlurView intensity={20} style={StyleSheet.absoluteFill} />
    </AnimatedPressable>
  )
}

function DialogContent({
  visible,
  children,
  showCloseButton = true,
  hapticFeedback = true,
  onClose,
  reducedMotion,
  accessibilityLabel,
  accessibilityHint,
}: DialogProps & { reducedMotion: boolean }): React.JSX.Element {
  const opacity = useSharedValue(0)
  const scale = useSharedValue(0.95)
  const y = useSharedValue(20)

  useEffect(() => {
    if (isTruthy(visible)) {
      opacity.value = withTiming(1, {
        duration: reducedMotion ? motion.durations.fast : motion.durations.enterExit,
      })
      scale.value = withSpring(1, SPRING_CONFIG)
      y.value = withSpring(0, SPRING_CONFIG)
    } else {
      opacity.value = withTiming(0, {
        duration: reducedMotion ? motion.durations.fast : motion.durations.fast,
      })
      scale.value = withTiming(0.95, {
        duration: reducedMotion ? motion.durations.fast : motion.durations.fast,
      })
      y.value = withTiming(20, {
        duration: reducedMotion ? motion.durations.fast : motion.durations.fast,
      })
    }
  }, [visible, opacity, scale, y, reducedMotion])

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ scale: scale.value }, { translateY: y.value }],
    }
  })

  const handleClose = useCallback((): void => {
    if (isTruthy(hapticFeedback)) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    }
    onClose()
  }, [hapticFeedback, onClose])

  useEffect(() => {
    if (visible) {
      AccessibilityInfo.announceForAccessibility(accessibilityLabel ?? 'Dialog opened')
    }
  }, [visible, accessibilityLabel])

  if (!visible) {
    return <></>
  }

  return (
    <AnimatedView
      style={[styles.content, animatedStyle]}
      accessible
      accessibilityRole="alert"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
    >
      <BlurView intensity={80} style={StyleSheet.absoluteFill} tint="light" />
      <View style={styles.contentInner}>
        {children}
        {showCloseButton && (
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClose}
            accessible
            accessibilityRole="button"
            accessibilityLabel="Close dialog"
            accessibilityHint="Closes the dialog"
          >
            <Text style={styles.closeButtonText}>×</Text>
          </TouchableOpacity>
        )}
      </View>
    </AnimatedView>
  )
}

export function Dialog({
  visible,
  onClose,
  children,
  showCloseButton = true,
  hapticFeedback = true,
  accessibilityLabel,
  accessibilityHint,
}: DialogProps): React.JSX.Element {
  const reducedMotionSV = useReducedMotionSV()
  const [reducedMotion, setReducedMotion] = useState(() => reducedMotionSV.value)

  useEffect(() => {
    const checkReducedMotion = (): void => {
      setReducedMotion(reducedMotionSV.value)
    }

    // Initial check
    checkReducedMotion()

    // Check periodically (SharedValue changes don't trigger React re-renders)
    const intervalId = setInterval(checkReducedMotion, 100)

    return () => {
      clearInterval(intervalId)
    }
  }, [reducedMotionSV])

  const handleClose = useCallback((): void => {
    if (isTruthy(hapticFeedback)) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    }
    onClose()
  }, [hapticFeedback, onClose])

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
      accessible={false}
    >
      <View style={styles.container}>
        <DialogOverlay visible={visible} onPress={handleClose} reducedMotion={reducedMotion} />
        <DialogContent
          visible={visible}
          onClose={handleClose}
          showCloseButton={showCloseButton}
          hapticFeedback={hapticFeedback}
          reducedMotion={reducedMotion}
          {...(accessibilityLabel && { accessibilityLabel })}
          {...(accessibilityHint && { accessibilityHint })}
        >
          {children}
        </DialogContent>
      </View>
    </Modal>
  )
}

export function DialogHeader({ children, style }: DialogHeaderProps): React.JSX.Element {
  return (
    <View style={[styles.header, style]} accessible={false}>
      {children}
    </View>
  )
}

export function DialogFooter({ children, style }: DialogFooterProps): React.JSX.Element {
  return (
    <View style={[styles.footer, style]} accessible={false}>
      {children}
    </View>
  )
}

export function DialogTitle({ children, style }: DialogTitleProps): React.JSX.Element {
  return (
    <Text style={[styles.title, style]} accessible accessibilityRole="header">
      {children}
    </Text>
  )
}

export function DialogDescription({ children, style }: DialogDescriptionProps): React.JSX.Element {
  return (
    <Text style={[styles.description, style]} accessible accessibilityRole="text">
      {children}
    </Text>
  )
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  content: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: 'transparent',
    borderRadius: radius['3xl'],
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: Dimens.elevation.component.dialog,
  },
  contentInner: {
    padding: spacingTokens.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  header: {
    marginBottom: spacingTokens.md,
  },
  footer: {
    marginTop: spacingTokens.md,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacingTokens.md,
  },
  title: {
    fontSize: Typography.scale.h3.fontSize,
    fontWeight: Typography.scale.h3.fontWeight,
    lineHeight: Typography.scale.h3.lineHeight,
    color: colors.textPrimary,
    marginBottom: spacingTokens.sm,
  },
  description: {
    fontSize: Typography.scale.bodySmall.fontSize,
    lineHeight: Typography.scale.bodySmall.lineHeight,
    color: colors.textSecondary,
  },
  closeButton: {
    position: 'absolute',
    top: spacingTokens.xl,
    right: spacingTokens.xl,
    width: TOUCH_TARGET_MIN,
    height: TOUCH_TARGET_MIN,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: radius.sm,
    opacity: 0.7,
  },
  closeButtonText: {
    fontSize: Typography.scale.h2.fontSize,
    lineHeight: Typography.scale.h2.lineHeight,
    color: colors.textPrimary,
    fontWeight: '300',
  },
})
