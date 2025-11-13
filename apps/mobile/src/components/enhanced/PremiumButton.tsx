import React, { useCallback } from 'react'
import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  type ViewStyle,
  type TextStyle,
} from 'react-native'
import Animated from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { usePressBounce } from '@petspark/motion'
import { colors } from '@mobile/theme/colors'
import { Typography, Dimens } from '@petspark/shared';
import { elevation } from '@mobile/theme/tokens';

const { spacing, radius, component } = Dimens;
const { scale: typography } = Typography;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export interface PremiumButtonProps {
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost' | 'gradient'
  size?: 'sm' | 'md' | 'lg'
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
  loading?: boolean
  children: React.ReactNode
  onPress?: () => void
  disabled?: boolean
  style?: ViewStyle
  testID?: string
}

export function PremiumButton({
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  loading = false,
  children,
  onPress,
  disabled = false,
  style,
  testID = 'premium-button',
}: PremiumButtonProps): React.JSX.Element {
  const pressBounce = usePressBounce(0.95)

  const handlePress = useCallback((): void => {
    if (!disabled && !loading) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      onPress?.()
    }
  }, [disabled, loading, onPress])

  const variantStyles: Record<string, ViewStyle> = {
    primary: { backgroundColor: colors.primary },
    secondary: { backgroundColor: colors.textSecondary },
    accent: { backgroundColor: colors.accent },
    ghost: { backgroundColor: 'transparent' },
    gradient: { backgroundColor: colors.accent }, // Simplified for mobile - use LinearGradient for true gradient
  }

  const sizeStyles: Record<
    string,
    { paddingHorizontal: number; paddingVertical: number; minHeight: number }
  > = {
    sm: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, minHeight: component.touchTargetMin },
    md: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, minHeight: component.touchTargetMin },
    lg: { paddingHorizontal: spacing.xl, paddingVertical: spacing.md, minHeight: component.touchTargetMin + 8 },
  }

  const textSizeStyles: Record<string, TextStyle> = {
    sm: { fontSize: typography.bodySmall.fontSize, lineHeight: typography.bodySmall.lineHeight },
    md: { fontSize: typography.body.fontSize, lineHeight: typography.body.lineHeight },
    lg: { fontSize: typography.h3.fontSize, lineHeight: typography.h3.lineHeight },
  }

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={pressBounce.onPressIn}
      onPressOut={pressBounce.onPressOut}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
      accessibilityLabel={typeof children === 'string' ? children : 'Button'}
      style={[
        styles.button,
        variantStyles[variant],
        sizeStyles[size],
        pressBounce.animatedStyle,
        style,
        (disabled || loading) && styles.disabled,
      ]}
      testID={testID}
    >
      {loading ? (
        <ActivityIndicator color={colors.card} size="small" />
      ) : (
        <View style={styles.content}>
          {icon && iconPosition === 'left' && <View style={styles.icon}>{icon}</View>}
          <Text
            style={[styles.text, textSizeStyles[size], variant === 'ghost' && styles.ghostText]}
          >
            {children}
          </Text>
          {icon && iconPosition === 'right' && <View style={styles.icon}>{icon}</View>}
        </View>
      )}
    </AnimatedPressable>
  )
}

const styles = StyleSheet.create({
  button: {
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...elevation.raised,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  text: {
    color: colors.card,
    fontWeight: typography.h3.fontWeight,
  },
  ghostText: {
    color: colors.textSecondary,
  },
  icon: {
    // Icon container
  },
  disabled: {
    opacity: 0.5,
  },
})
