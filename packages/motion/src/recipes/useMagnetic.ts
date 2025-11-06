import { useSharedValue, withSpring, useAnimatedStyle } from 'react-native-reanimated';
import { useRef } from 'react';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import type { LayoutChangeEvent } from 'react-native';
import { motion } from '../tokens';
import { useReducedMotionSV } from '../reduced-motion';

export interface UseMagneticOptions {
  radius?: number;
  strength?: number;
}

export interface UseMagneticReturn {
  onLayout: (e: LayoutChangeEvent) => void;
  animatedStyle: ReturnType<typeof useAnimatedStyle>;
  gesture?: ReturnType<typeof Gesture.Pan>;
}

/**
 * Hook for magnetic attraction effect (follows pointer/finger).
 * Respects reduced motion preferences (no magnetic effect when enabled).
 */
export function useMagnetic(radius = 80, strength = 0.15): UseMagneticReturn {
  const reducedMotion = useReducedMotionSV();
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const ref = useRef<{ layout?: { x: number; y: number; w: number; h: number } }>({});

  function onLayout(e: LayoutChangeEvent): void {
    const { x, y, width: w, height: h } = e.nativeEvent.layout;
    ref.current.layout = { x, y, w, h };
  }

  // For React Native, use Pan gesture handler
  // For web, this would need pointer events (handled separately)
  const gesture = Gesture.Pan()
    .onUpdate((e) => {
      if (reducedMotion.value) return; // No magnetic effect when reduced motion is enabled
      
      const L = ref.current.layout;
      if (!L) return;
      const cx = L.x + L.w / 2;
      const cy = L.y + L.h / 2;
      const dx = e.absoluteX - cx;
      const dy = e.absoluteY - cy;
      const d = Math.min(1, Math.hypot(dx, dy) / radius);
      tx.value = withSpring((1 - d) * dx * strength, motion.spring.soft);
      ty.value = withSpring((1 - d) * dy * strength, motion.spring.soft);
    })
    .onEnd(() => {
      tx.value = withSpring(0, motion.spring.smooth);
      ty.value = withSpring(0, motion.spring.smooth);
    });

  const animatedStyle = useAnimatedStyle(() => {
    if (reducedMotion.value) {
      return {}; // No transform when reduced motion is enabled
    }
    return {
      transform: [{ translateX: tx.value }, { translateY: ty.value }],
    };
  });

  return { onLayout, animatedStyle, gesture };
}

