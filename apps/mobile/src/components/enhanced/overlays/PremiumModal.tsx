import React, { useEffect, useCallback } from 'react'
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  type ViewStyle,
} from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import { BlurView } from 'expo-blur'
import * as Haptics from 'expo-haptics'
import { useReducedMotionSV } from '@/effects/core/use-reduced-motion-sv'
import FeatherIcon from 'react-native-vector-icons/Feather'
import { isTruthy } from '@petspark/shared'
import { colors } from '@mobile/theme/colors'
import { Dimens } from '@petspark/shared'
import { elevation } from '@mobile/theme/tokens'

import type { IconProps } from 'react-native-vector-icons/Icon'

const X = (props: Omit<IconProps, 'name'>): React.JSX.Element => <FeatherIcon name="x" {...props} />

const AnimatedView = Animated.View

export interface PremiumModalProps {
  visible?: boolean
  onClose?: () => void
  title?: string
  description?: string
  children?: React.ReactNode
  footer?: React.ReactNode
  variant?: 'default' | 'glass' | 'centered'
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  showCloseButton?: boolean
  closeOnBackdropPress?: boolean
  style?: ViewStyle
  testID?: string
}

export function PremiumModal({
  visible = false,
  onClose,
  title,
  description,
  children,
  footer,
  variant = 'default',
  size = 'md',
  showCloseButton = true,
  closeOnBackdropPress = true,
  style,
  testID = 'premium-modal',
}: PremiumModalProps): React.JSX.Element {
  const scale = useSharedValue(0.95)
  const opacity = useSharedValue(0)
  const backdropOpacity = useSharedValue(0)
  const reducedMotion = useReducedMotionSV()

  useEffect(() => {
    const springConfig = reducedMotion.value ? { duration: 200 } : { stiffness: 400, damping: 30 }
    const timingConfig = { duration: 200 }

    if (isTruthy(visible)) {
      scale.value = withSpring(1, springConfig)
      opacity.value = withTiming(1, timingConfig)
      backdropOpacity.value = withTiming(1, timingConfig)
    } else {
      scale.value = withSpring(0.95, springConfig)
      opacity.value = withTiming(0, timingConfig)
      backdropOpacity.value = withTiming(0, timingConfig)
    }
  }, [visible, scale, opacity, backdropOpacity, reducedMotion])

  const contentStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }))

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }))

  const handleClose = useCallback((): void => {
    if (closeOnBackdropPress) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      onClose?.()
    }
  }, [closeOnBackdropPress, onClose])

  const sizeStyles: Record<string, ViewStyle> = {
    sm: { maxWidth: 400 },
    md: { maxWidth: 500 },
    lg: { maxWidth: 600 },
    xl: { maxWidth: 800 },
    full: { maxWidth: '100%' },
  }

  const useGlassEffect = variant === 'glass'

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      testID={testID}
    >
      <AnimatedView style={[styles.backdrop, backdropStyle]}>
        <TouchableOpacity 
          style={StyleSheet.absoluteFill} 
          activeOpacity={1} 
          onPress={handleClose}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Close modal"
        />
        <View style={styles.container}>
          <AnimatedView
            style={[styles.content, sizeStyles[size], contentStyle, style]}
          >
            {useGlassEffect ? (
              <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill}>
                <View style={[styles.glassContent, { backgroundColor: 'rgba(255, 255, 255, 0.7)' }]}>
                  {(title ?? description) && (
                    <View style={styles.header}>
                      {title && <Text style={styles.title}>{title}</Text>}
                      {description && <Text style={styles.description}>{description}</Text>}
                    </View>
                  )}

                  <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
                    {children}
                  </ScrollView>

                  {footer && <View style={styles.footer}>{footer}</View>}

                  {showCloseButton && (
                    <TouchableOpacity
                      onPress={handleClose}
                      style={styles.closeButton}
                      accessibilityLabel="Close dialog"
                      accessibilityRole="button"
                    >
                      <X size={16} color={colors.textSecondary} />
                    </TouchableOpacity>
                  )}
                </View>
              </BlurView>
            ) : (
              <>
                {(title ?? description) && (
                  <View style={styles.header}>
                    {title && <Text style={styles.title}>{title}</Text>}
                    {description && <Text style={styles.description}>{description}</Text>}
                  </View>
                )}

                <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
                  {children}
                </ScrollView>

                {footer && <View style={styles.footer}>{footer}</View>}

                {showCloseButton && (
                  <TouchableOpacity
                    onPress={handleClose}
                    style={styles.closeButton}
                    accessibilityLabel="Close dialog"
                    accessibilityRole="button"
                  >
                    <X size={16} color={colors.textSecondary} />
                  </TouchableOpacity>
                )}
              </>
            )}
          </AnimatedView>
        </View>
      </AnimatedView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Dimens.spacing.lg,
  },
  container: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    width: '100%',
    borderRadius: Dimens.radius.xl,
    backgroundColor: colors.card,
    ...elevation.modal,
    overflow: 'hidden',
  },
  glassContent: {
    flex: 1,
    borderRadius: Dimens.radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  header: {
    padding: Dimens.spacing.xl,
    paddingBottom: Dimens.spacing.lg,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: Dimens.spacing.sm,
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  body: {
    paddingHorizontal: Dimens.spacing.xl,
    paddingVertical: Dimens.spacing.lg,
  },
  footer: {
    padding: Dimens.spacing.xl,
    paddingTop: Dimens.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  closeButton: {
    position: 'absolute',
    top: Dimens.spacing.lg,
    right: Dimens.spacing.lg,
    padding: Dimens.spacing.sm,
    borderRadius: Dimens.radius.md,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
