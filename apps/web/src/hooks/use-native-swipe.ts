'use client';

import { springConfigs } from '@/effects/reanimated/transitions';
import { platformHaptics, type PlatformHaptics } from '@/lib/platform-haptics';
import { useCallback, useRef, useEffect } from 'react';
import {
  useMotionValue,
  useTransform,
  animate,
  type MotionValue,
} from 'framer-motion';

export interface UseNativeSwipeOptions {
  cardWidth: number;
  commitThreshold?: number;
  velocityThreshold?: number;
  hapticFeedback?: boolean;
  haptics?: PlatformHaptics;
  onCommit?: (direction: 'left' | 'right', velocity: number) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  reduceMotion?: boolean;
}

export interface GestureHandlers {
  onDragStart?: (event: { x: number; y: number }) => void;
  onDrag?: (event: { translationX: number; translationY: number; velocityX: number }) => void;
  onDragEnd?: (event: { translationX: number; translationY: number; velocityX: number }) => void;
}

export interface UseNativeSwipeReturn {
  translationX: MotionValue<number>;
  translationY: MotionValue<number>;
  rotation: MotionValue<number>;
  opacity: MotionValue<number>;
  likeOpacity: MotionValue<number>;
  passOpacity: MotionValue<number>;
  scale: MotionValue<number>;
  animatedStyle: {
    x: MotionValue<number>;
    y: MotionValue<number>;
    rotate: MotionValue<number>;
    scale: MotionValue<number>;
    opacity: MotionValue<number>;
  };
  badgeStyle: {
    opacity: MotionValue<number>;
    scale: MotionValue<number>;
  };
  gestureHandlers: GestureHandlers;
  reset: () => void;
  commit: (direction: 'left' | 'right') => void;
}

const DEFAULT_COMMIT_THRESHOLD = 0.3;
const DEFAULT_VELOCITY_THRESHOLD = 800;
const DEFAULT_HAPTIC_FEEDBACK = true;
const MAX_ROTATION = 12;
const MAX_VERTICAL_DRAG = 30;

export function useNativeSwipe(options: UseNativeSwipeOptions): UseNativeSwipeReturn {
  const {
    cardWidth,
    commitThreshold = DEFAULT_COMMIT_THRESHOLD,
    velocityThreshold = DEFAULT_VELOCITY_THRESHOLD,
    hapticFeedback = DEFAULT_HAPTIC_FEEDBACK,
    haptics: customHaptics,
    onCommit,
    onDragStart,
    onDragEnd,
    reduceMotion = false,
  } = options;

  const haptics = customHaptics ?? platformHaptics;
  const threshold = cardWidth * commitThreshold;

  const translationX = useMotionValue(0);
  const translationY = useMotionValue(0);
  const rotation = useMotionValue(0);
  const opacity = useMotionValue(1);
  const likeOpacity = useMotionValue(0);
  const passOpacity = useMotionValue(0);
  const scale = useMotionValue(1);

  const isCommittedRef = useRef(false);
  const hasCrossedThresholdRef = useRef(false);

  const triggerHaptic = useCallback(
    (type: 'selection' | 'light' | 'medium' | 'success') => {
      if (!hapticFeedback) return;

      switch (type) {
        case 'selection':
          haptics.selection();
          break;
        case 'light':
          haptics.impact('light');
          break;
        case 'medium':
          haptics.impact('medium');
          break;
        case 'success':
          haptics.success();
          break;
      }
    },
    [hapticFeedback, haptics]
  );

  const updateAnimation = useCallback(
    (translationXValue: number, translationYValue: number) => {
      const clampedX = Math.max(-cardWidth * 1.5, Math.min(cardWidth * 1.5, translationXValue));
      const clampedY = Math.max(
        -MAX_VERTICAL_DRAG,
        Math.min(MAX_VERTICAL_DRAG, translationYValue * 0.3)
      );

      translationX.set(clampedX);
      translationY.set(clampedY);

      const absX = Math.abs(clampedX);
      if (absX > threshold && !hasCrossedThresholdRef.current) {
        hasCrossedThresholdRef.current = true;
        triggerHaptic('medium');
      }
    },
    [cardWidth, threshold, translationX, translationY, triggerHaptic]
  );

  const handleCommit = useCallback(
    (direction: 'left' | 'right', velocity: number) => {
      if (isCommittedRef.current) return;
      isCommittedRef.current = true;

      triggerHaptic(direction === 'right' ? 'success' : 'light');

      const exitX = direction === 'right' ? cardWidth * 1.2 : -cardWidth * 1.2;
      const exitRotation = reduceMotion
        ? 0
        : direction === 'right'
          ? MAX_ROTATION + 5
          : -(MAX_ROTATION + 5);

      void animate(translationX, exitX, {
        type: 'spring',
        damping: 20,
        stiffness: 300,
        mass: 0.9,
      });

      void animate(rotation, exitRotation, {
        type: 'spring',
        damping: 20,
        stiffness: 300,
        mass: 0.9,
      });

      void animate(opacity, 0, {
        type: 'spring',
        damping: 20,
        stiffness: 300,
        mass: 0.9,
      });

      onCommit?.(direction, velocity);
    },
    [cardWidth, translationX, rotation, opacity, reduceMotion, triggerHaptic, onCommit]
  );

  const handleDragStart = useCallback(() => {
    if (isCommittedRef.current) return;
    triggerHaptic('selection');
    onDragStart?.();
    hasCrossedThresholdRef.current = false;
  }, [triggerHaptic, onDragStart]);

  const handleDrag = useCallback(
    (translationXValue: number, translationYValue: number) => {
      if (isCommittedRef.current) return;
      updateAnimation(translationXValue, translationYValue);
    },
    [updateAnimation]
  );

  const handleDragEnd = useCallback(
    (translationXValue: number, velocityX: number) => {
      if (isCommittedRef.current) return;

      const absX = Math.abs(translationXValue);
      const absVelocityX = Math.abs(velocityX);

      const shouldCommit = absX > threshold || absVelocityX > velocityThreshold;

      onDragEnd?.();

      if (shouldCommit) {
        const direction: 'left' | 'right' = translationXValue > 0 ? 'right' : 'left';
        handleCommit(direction, absVelocityX);
      } else {
        void animate(translationX, 0, springConfigs.smooth);
        void animate(translationY, 0, springConfigs.smooth);
        void animate(rotation, 0, springConfigs.smooth);
        void animate(likeOpacity, 0, springConfigs.smooth);
        void animate(passOpacity, 0, springConfigs.smooth);
        void animate(scale, 1, springConfigs.smooth);
        hasCrossedThresholdRef.current = false;
      }
    },
    [
      threshold,
      velocityThreshold,
      onDragEnd,
      handleCommit,
      translationX,
      translationY,
      rotation,
      likeOpacity,
      passOpacity,
      scale,
    ]
  );

  const gestureHandlers: GestureHandlers = {
    onDragStart: () => {
      handleDragStart();
    },
    onDrag: (event) => {
      handleDrag(event.translationX, event.translationY);
    },
    onDragEnd: (event) => {
      handleDragEnd(event.translationX, event.velocityX);
    },
  };

  const reset = useCallback(() => {
    isCommittedRef.current = false;
    hasCrossedThresholdRef.current = false;
    translationX.set(0);
    translationY.set(0);
    rotation.set(0);
    opacity.set(1);
    likeOpacity.set(0);
    passOpacity.set(0);
    scale.set(1);
  }, [translationX, translationY, rotation, opacity, likeOpacity, passOpacity, scale]);

  const commit = useCallback(
    (direction: 'left' | 'right') => {
      handleCommit(direction, 0);
    },
    [handleCommit]
  );

  // Use useTransform for reactive calculations
  const rotationValue = useTransform(
    translationX,
    [-cardWidth, 0, cardWidth],
    reduceMotion ? [0, 0, 0] : [-MAX_ROTATION, 0, MAX_ROTATION],
    { clamp: true }
  );

  const likeOpacityValue = useTransform(
    translationX,
    [0, threshold],
    [0, 1],
    { clamp: true }
  );

  const passOpacityValue = useTransform(
    translationX,
    [-threshold, 0],
    [1, 0],
    { clamp: true }
  );

  const scaleValue = useTransform(
    translationX,
    (val) => {
      const progress = Math.abs(val) / threshold;
      return Math.max(0.96, Math.min(1, 1 - progress * 0.04));
    }
  );

  // Sync transformed values to motion values
  useEffect(() => {
    const unsubscribeLike = likeOpacityValue.on('change', (val) => {
      likeOpacity.set(val);
    });
    const unsubscribePass = passOpacityValue.on('change', (val) => {
      passOpacity.set(val);
    });
    const unsubscribeScale = scaleValue.on('change', (val) => {
      scale.set(val);
    });

    return () => {
      unsubscribeLike();
      unsubscribePass();
      unsubscribeScale();
    };
  }, [likeOpacityValue, passOpacityValue, scaleValue, likeOpacity, passOpacity, scale]);

  const animatedStyle = {
    x: translationX,
    y: translationY,
    rotate: rotationValue,
    scale: scaleValue,
    opacity,
  };

  const badgeOpacity = useTransform(
    [likeOpacity, passOpacity],
    ([like, pass]) => Math.max(like, pass)
  );

  const badgeScale = useTransform(
    badgeOpacity,
    [0, 1],
    [0.8, 1],
    { clamp: true }
  );

  const badgeStyle = {
    opacity: badgeOpacity,
    scale: badgeScale,
  };

  return {
    translationX,
    translationY,
    rotation,
    opacity,
    likeOpacity,
    passOpacity,
    scale,
    animatedStyle,
    badgeStyle,
    gestureHandlers,
    reset,
    commit,
  };
}
