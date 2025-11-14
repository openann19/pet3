import { forwardRef } from 'react'
import type { ComponentRef, ForwardRefExoticComponent, RefAttributes } from 'react'
import Animated, { type AnimatedStyle } from 'react-native-reanimated'
import type { TextProps, TextStyle } from 'react-native'

interface MotionTextProps extends TextProps {
  animatedStyle?: AnimatedStyle<TextStyle>
}

/**
 * Unified animated Text component.
 * Accepts animated style fragments and provides web performance optimizations.
 */
export const MotionText: ForwardRefExoticComponent<
  MotionTextProps & RefAttributes<ComponentRef<typeof Animated.Text>>
> = forwardRef<ComponentRef<typeof Animated.Text>, MotionTextProps>(
  ({ style, animatedStyle, ...rest }, ref) => {
    const styleFinal = animatedStyle ? [style, animatedStyle] : (style ?? ({} as TextStyle))

    // Use a typed alias to satisfy ref typing in ambient web stubs
    const AnimatedText = (Animated.Text as unknown) as React.ComponentType<any>

    return <AnimatedText ref={ref} {...rest} style={styleFinal as any} />
  }
)
MotionText.displayName = 'MotionText'
