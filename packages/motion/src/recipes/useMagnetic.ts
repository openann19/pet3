import { useSharedValue, withSpring, useAnimatedStyle } from 'react-native-reanimated';
import { useRef } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import { motion } from '../tokens';

export interface UseMagneticReturn {
  onLayout: (e: LayoutChangeEvent) => void;
  animatedStyle: ReturnType<typeof useAnimatedStyle>;
  gesture?: unknown;
}

export function useMagnetic(radius = 80): UseMagneticReturn {
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const ref = useRef<{ layout?: { x: number; y: number; w: number; h: number } }>({});

  function onLayout(e: LayoutChangeEvent) {
    const { x, y, width: w, height: h } = e.nativeEvent.layout;
    ref.current.layout = { x, y, w, h };
  }

  // For React Native, we'll use PanResponder or a simpler approach
  // The gesture handler will be set up by the consuming component if needed
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }],
  }));

  return { onLayout, animatedStyle };
}

