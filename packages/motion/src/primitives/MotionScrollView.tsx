import Animated, { type AnimatedStyle } from 'react-native-reanimated';
import type { ScrollViewProps, ViewStyle } from 'react-native';

const isWeb = typeof window !== 'undefined' && typeof document !== 'undefined';

/**
 * Unified animated ScrollView component.
 * Accepts animated style fragments and provides web performance optimizations.
 */
export function MotionScrollView(
  props: React.ComponentProps<typeof Animated.ScrollView> & {
    animatedStyle?: AnimatedStyle<ViewStyle>;
  }
): JSX.Element {
  const { style, animatedStyle, ...rest } = props;
  
  const styleFinal = animatedStyle ? [style, animatedStyle] : style;
  
  // Web performance hints
  const webStyle = isWeb && animatedStyle
    ? {
        willChange: 'transform, opacity' as const,
      }
    : undefined;
  
  const finalStyle = webStyle ? [styleFinal, webStyle] : styleFinal;
  
  return <Animated.ScrollView {...rest} style={finalStyle} />;
}

