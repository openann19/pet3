import { forwardRef } from 'react';
import Animated, { type AnimatedStyle } from 'react-native-reanimated';
import type { TextProps, TextStyle } from 'react-native';

const isWeb = typeof window !== 'undefined' && typeof document !== 'undefined';

/**
 * Unified animated Text component.
 * Accepts animated style fragments and provides web performance optimizations.
 */
export const MotionText = forwardRef<
  typeof Animated.Text,
  TextProps & {
    animatedStyle?: AnimatedStyle<TextStyle>;
  }
>(({ style, animatedStyle, ...rest }, ref) => {
  const styleFinal = animatedStyle ? [style, animatedStyle] : style;
  
  // Web performance hints
  const webStyle = isWeb && animatedStyle
    ? {
        willChange: 'transform, opacity' as const,
      }
    : undefined;
  
  const finalStyle = webStyle ? [styleFinal, webStyle] : styleFinal;
  
  return (
    <Animated.Text
      ref={ref as React.Ref<typeof Animated.Text>}
      {...rest}
      style={finalStyle}
    />
  );
});
MotionText.displayName = 'MotionText';

