import React, { useCallback, useEffect } from 'react'
import { View, Text, StyleSheet, type ViewStyle } from 'react-native'
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

const { spacing } = Dimens;
const { scale: typography } = Typography;

const AnimatedView = Animated.View

export interface PremiumEmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onPress: () => void
  }
  variant?: 'default' | 'minimal' | 'illustrated'
  style?: ViewStyle
  testID?: string
}

export function PremiumEmptyState({
  icon,
  title,
  description,
  action,
  variant = 'default',
  style,
  testID = 'premium-empty-state',
}: PremiumEmptyStateProps): React.JSX.Element {
  const scale = useSharedValue(0.9)
  const opacity = useSharedValue(0)
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
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }))

  const handleAction = useCallback((): void => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    action?.onPress()
  }, [action])

  const variants = {
    default: { paddingVertical: spacing['4xl'], paddingHorizontal: spacing.lg },
    minimal: { paddingVertical: spacing['2xl'], paddingHorizontal: spacing.lg },
    illustrated: { paddingVertical: spacing['4xl'] + spacing.xl, paddingHorizontal: spacing.lg },
  }

  return (
    <AnimatedView
      style={[styles.container, variants[variant], animatedStyle, style]}
      testID={testID}
    >
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <Text style={styles.title}>{title}</Text>
      {description && <Text style={styles.description}>{description}</Text>}
      {action && (
        <View style={styles.actionContainer}>
          <PremiumButton onPress={handleAction} variant="primary" size="md">
            {action.label}
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
  description: {
                      fontSize: typography.bodySmall.fontSize,
                      lineHeight: typography.bodySmall.lineHeight,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    maxWidth: 300,
  },
  actionContainer: {
    marginTop: spacing.sm,
  },
})
