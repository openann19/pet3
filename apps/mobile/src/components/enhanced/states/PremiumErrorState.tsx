import React, { useCallback, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, type ViewStyle } from 'react-native'
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { useReducedMotionSV } from '@/effects/core/use-reduced-motion-sv'
import { PremiumButton } from '../PremiumButton'
import { colors } from '@mobile/theme/colors'
import { Typography, Dimens } from '@petspark/shared';
import { motionTokens } from '@petspark/motion';

const motion = {
  durations: motionTokens.durations,
  spring: motionTokens.spring,
};
import FeatherIcon from 'react-native-vector-icons/Feather'
import type { IconProps } from 'react-native-vector-icons/Icon'

const { spacing, radius } = Dimens;
const { scale: typography } = Typography;

const AlertCircle = (props: Omit<IconProps, 'name'>): React.JSX.Element => (
  <FeatherIcon name="alert-circle" {...props} />
)
const ArrowClockwise = (props: Omit<IconProps, 'name'>): React.JSX.Element => (
  <FeatherIcon name="rotate-ccw" {...props} />
)

const AnimatedView = Animated.View

export interface PremiumErrorStateProps {
  title?: string
  message?: string
  error?: Error | string
  onRetry?: () => void
  retryLabel?: string
  variant?: 'default' | 'minimal' | 'detailed'
  showDetails?: boolean
  style?: ViewStyle
  testID?: string
}

export function PremiumErrorState({
  title = 'Something went wrong',
  message,
  error,
  onRetry,
  retryLabel = 'Try Again',
  variant = 'default',
  showDetails = false,
  style,
  testID = 'premium-error-state',
}: PremiumErrorStateProps): React.JSX.Element {
  const scale = useSharedValue(0.9)
  const opacity = useSharedValue(0)
  const shake = useSharedValue(0)
  const reducedMotion = useReducedMotionSV()

  useEffect(() => {
    const springConfig = reducedMotion.value 
      ? { duration: motion.durations.fast } 
      : { 
          stiffness: motion.spring.smooth.stiffness, 
          damping: motion.spring.smooth.damping,
          mass: motion.spring.smooth.mass,
        }
    scale.value = withSpring(1, springConfig)
    opacity.value = withSpring(1, springConfig)
  }, [scale, opacity, reducedMotion])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateX: shake.value }],
    opacity: opacity.value,
  }))

  const handleRetry = useCallback((): void => {
    if (!reducedMotion.value) {
      const shakeConfig = {
        stiffness: motion.spring.snappy.stiffness,
        damping: motion.spring.snappy.damping,
        mass: motion.spring.snappy.mass,
      }
      shake.value = withSpring(10, shakeConfig)
      setTimeout(() => {
        shake.value = withSpring(-10, shakeConfig)
        setTimeout(() => {
          shake.value = withSpring(0, {
            stiffness: motion.spring.smooth.stiffness,
            damping: motion.spring.smooth.damping,
            mass: motion.spring.smooth.mass,
          })
        }, motion.durations.fast)
      }, motion.durations.fast)
    }

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    onRetry?.()
  }, [onRetry, shake, reducedMotion])

  const errorMessage = typeof error === 'string' ? error : error?.message ?? message
  const errorDetails = typeof error === 'object' && error?.stack ? error.stack : undefined

  const variants = {
    default: { paddingVertical: spacing['4xl'], paddingHorizontal: spacing.lg },
    minimal: { paddingVertical: spacing['2xl'], paddingHorizontal: spacing.lg },
    detailed: { paddingVertical: spacing['4xl'], paddingHorizontal: spacing.lg },
  }

  return (
    <AnimatedView
      style={[styles.container, variants[variant], animatedStyle, style]}
      testID={testID}
    >
      <View style={styles.iconContainer}>
        <AlertCircle size={48} color={colors.danger} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {errorMessage && <Text style={styles.message}>{errorMessage}</Text>}
      {showDetails && errorDetails && variant === 'detailed' && (
        <ScrollView style={styles.detailsContainer}>
          <Text style={styles.detailsTitle}>Error Details</Text>
          <Text style={styles.details}>{errorDetails}</Text>
        </ScrollView>
      )}
      {onRetry && (
        <View style={styles.actionContainer}>
          <PremiumButton
            onPress={handleRetry}
            variant="primary"
            size="md"
            icon={<ArrowClockwise size={16} color={colors.card} />}
          >
            {retryLabel}
          </PremiumButton>
        </View>
      )}
    </AnimatedView>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.h3.fontSize,
    fontWeight: typography.h3.fontWeight,
    lineHeight: typography.h3.lineHeight,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  message: {
    fontSize: typography.bodySmall.fontSize,
    lineHeight: typography.bodySmall.lineHeight,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    maxWidth: 300,
  },
  detailsContainer: {
    maxHeight: 200,
    width: '100%',
    maxWidth: 300,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  detailsTitle: {
    fontSize: typography.caption.fontSize,
    fontWeight: typography.h3.fontWeight,
    lineHeight: typography.caption.lineHeight,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  details: {
    fontSize: typography.caption.fontSize,
    lineHeight: typography.caption.lineHeight,
    color: colors.textSecondary,
    fontFamily: 'monospace',
  },
  actionContainer: {
    marginTop: spacing.sm,
  },
})
