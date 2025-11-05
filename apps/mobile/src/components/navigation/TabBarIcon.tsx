/**
 * Enhanced Tab Bar Icon with animations
 * Location: src/components/navigation/TabBarIcon.tsx
 */

import React from 'react'
import { Text } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated'

const AnimatedText = Animated.createAnimatedComponent(Text)

export interface TabBarIconProps {
  focused: boolean
  color: string
  size: number
  icon: string
}

const springConfig = {
  damping: 15,
  stiffness: 250,
  mass: 0.9,
}

export function TabBarIcon({ 
  focused, 
  color, 
  size, 
  icon 
}: TabBarIconProps): React.JSX.Element {
  const scale = useSharedValue(focused ? 1.1 : 1)
  const opacity = useSharedValue(focused ? 1 : 0.6)

  React.useEffect(() => {
    scale.value = withSpring(focused ? 1.1 : 1, springConfig)
    opacity.value = withSpring(focused ? 1 : 0.6, springConfig)
  }, [focused, scale, opacity])

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    }
  })

  return (
    <AnimatedText style={[{ color, fontSize: size }, animatedStyle]}>
      {icon}
    </AnimatedText>
  )
}

