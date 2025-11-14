'use client';

import {
  useMotionValue,
  animate,
  useTransform,
  type MotionValue,
} from 'framer-motion';
import { useEffect, useCallback } from 'react';
import type { MessageStatus } from '@/lib/chat-types';
import { springConfigs, timingConfigs } from '@/effects/reanimated/transitions';
import { useMotionStyle } from './use-motion-style';
import type { CSSProperties } from 'react';

export interface UseReceiptTransitionOptions {
  status: MessageStatus;
  previousStatus?: MessageStatus;
  pulseDuration?: number;
}

export interface UseReceiptTransitionReturn {
  opacity: MotionValue<number>;
  scale: MotionValue<number>;
  colorIntensity: MotionValue<number>;
  iconRotation: MotionValue<number>;
  animatedStyle: CSSProperties;
  animateStatusChange: (newStatus: MessageStatus) => void;
}

const DEFAULT_PULSE_DURATION = 600;

const STATUS_COLORS = {
  sending: 'rgba(156, 163, 175, 1)',
  sent: 'rgba(156, 163, 175, 1)',
  delivered: 'rgba(96, 165, 250, 1)',
  read: 'rgba(59, 130, 246, 1)',
  failed: 'rgba(239, 68, 68, 1)',
};

export function useReceiptTransition(
  options: UseReceiptTransitionOptions
): UseReceiptTransitionReturn {
  const { status, previousStatus, pulseDuration = DEFAULT_PULSE_DURATION } = options;

  const opacity = useMotionValue(1);
  const scale = useMotionValue(1);
  const colorIntensity = useMotionValue(status === 'read' || status === 'delivered' ? 1 : 0);
  const iconRotation = useMotionValue(0);

  // Use useTransform for color interpolation
  const baseColor = STATUS_COLORS.sent;
  const targetColor = STATUS_COLORS[status] ?? STATUS_COLORS.sending;
  
  const baseR = parseInt(/rgba?\((\d+)/.exec(baseColor)?.[1] ?? '156', 10);
  const targetR = parseInt(/rgba?\((\d+)/.exec(targetColor)?.[1] ?? '156', 10);
  const baseG = parseInt(/rgba?\(\d+, (\d+)/.exec(baseColor)?.[1] ?? '163', 10);
  const targetG = parseInt(/rgba?\(\d+, (\d+)/.exec(targetColor)?.[1] ?? '163', 10);
  const baseB = parseInt(/rgba?\(\d+, \d+, (\d+)/.exec(baseColor)?.[1] ?? '175', 10);
  const targetB = parseInt(/rgba?\(\d+, \d+, (\d+)/.exec(targetColor)?.[1] ?? '175', 10);

  const r = useTransform(colorIntensity, [0, 1], [baseR, targetR]);
  const g = useTransform(colorIntensity, [0, 1], [baseG, targetG]);
  const b = useTransform(colorIntensity, [0, 1], [baseB, targetB]);

  const animateStatusChange = useCallback(
    (newStatus: MessageStatus) => {
      // Animate opacity
      void animate(opacity, [0.6, 1], {
        duration: (pulseDuration / 3) / 1000,
        times: [0, 1],
      });

      // Animate scale
      void animate(scale, [1.3, 1], {
        type: 'spring',
        damping: 10,
        stiffness: 400,
      }).then(() => {
        void animate(scale, 1, {
          ...springConfigs.bouncy,
        });
      });

      // Animate icon rotation
      void animate(iconRotation, [-10, 0], {
        duration: (pulseDuration / 4) / 1000,
        times: [0, 1],
      }).then(() => {
        void animate(iconRotation, 0, {
          ...springConfigs.bouncy,
        });
      });

      if (newStatus === 'read' && previousStatus === 'delivered') {
        void animate(colorIntensity, [0, 1], {
          duration: (pulseDuration / 2) / 1000,
          delay: 0.15,
          times: [0, 1],
        });
      } else if (newStatus === 'delivered') {
        void animate(colorIntensity, 1, {
          duration: timingConfigs.smooth.duration,
          ease: timingConfigs.smooth.ease as string,
        });
      } else if (newStatus === 'read') {
        void animate(colorIntensity, 1, {
          duration: timingConfigs.smooth.duration,
          ease: timingConfigs.smooth.ease as string,
        });
      } else if (newStatus === 'sent' || newStatus === 'sending') {
        void animate(colorIntensity, 0, {
          duration: timingConfigs.fast.duration,
          ease: timingConfigs.fast.ease as string,
        });
      }
    },
    [opacity, scale, colorIntensity, iconRotation, previousStatus, pulseDuration]
  );

  useEffect(() => {
    if (previousStatus && previousStatus !== status) {
      animateStatusChange(status);
    } else {
      if (status === 'read' || status === 'delivered') {
        void animate(colorIntensity, 1, {
          duration: timingConfigs.smooth.duration,
          ease: timingConfigs.smooth.ease as string,
        });
      } else {
        void animate(colorIntensity, 0, {
          duration: timingConfigs.fast.duration,
          ease: timingConfigs.fast.ease as string,
        });
      }
    }
  }, [status, previousStatus, colorIntensity, animateStatusChange]);

  const animatedStyle = useMotionStyle(() => {
    return {
      opacity: opacity.get(),
      transform: [
        { scale: scale.get() },
        { rotate: `${iconRotation.get()}deg` },
      ],
      color: `rgb(${Math.round(r.get())}, ${Math.round(g.get())}, ${Math.round(b.get())})`,
    };
  });

  return {
    opacity,
    scale,
    colorIntensity,
    iconRotation,
    animatedStyle,
    animateStatusChange,
  };
}
