
import { useEffect, useCallback } from 'react';
import { useMotionValue, animate, MotionValue } from 'framer-motion';
import type { MessageStatus } from '@/lib/chat-types';
import { springConfigs, timingConfigs } from '@/effects/reanimated/transitions';

export interface UseReceiptTransitionOptions {
  status: MessageStatus;
  previousStatus?: MessageStatus;
  pulseDuration?: number;
}

export interface UseReceiptTransitionReturn {
  readonly opacity: MotionValue<number>;
  readonly scale: MotionValue<number>;
  readonly colorIntensity: MotionValue<number>;
  readonly iconRotation: MotionValue<number>;
  readonly animatedStyle: {
    opacity: MotionValue<number>;
    transform: Array<{ scale: MotionValue<number> } | { rotate: string }>;
    color: string;
  };
  readonly animateStatusChange: (newStatus: MessageStatus) => void;
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

  // Helper for color interpolation
  function interpolateColor(intensity: number, base: string, target: string): string {
    const baseMatch = base.match(/rgba?\((\d+), (\d+), (\d+)/);
    const targetMatch = target.match(/rgba?\((\d+), (\d+), (\d+)/);
  const baseR = baseMatch ? parseInt(baseMatch[1] ?? '0', 10) : 156;
  const baseG = baseMatch ? parseInt(baseMatch[2] ?? '0', 10) : 163;
  const baseB = baseMatch ? parseInt(baseMatch[3] ?? '0', 10) : 175;
  const targetR = targetMatch ? parseInt(targetMatch[1] ?? '0', 10) : 156;
  const targetG = targetMatch ? parseInt(targetMatch[2] ?? '0', 10) : 163;
  const targetB = targetMatch ? parseInt(targetMatch[3] ?? '0', 10) : 175;
    const r = Math.round(baseR + (targetR - baseR) * intensity);
    const g = Math.round(baseG + (targetG - baseG) * intensity);
    const b = Math.round(baseB + (targetB - baseB) * intensity);
    return `rgb(${r}, ${g}, ${b})`;
  }

  const animateStatusChange = useCallback(
    async (newStatus: MessageStatus) => {
      await animate(opacity, 0.6, { duration: pulseDuration / 3 / 1000 });
      await animate(opacity, 1, { duration: pulseDuration / 3 / 1000 });

      await animate(scale, 1.3, { type: 'spring', damping: 10, stiffness: 400 });
      await animate(scale, 1, { type: 'spring', ...springConfigs.bouncy });

      await animate(iconRotation, -10, { duration: pulseDuration / 4 / 1000 });
      await animate(iconRotation, 0, { type: 'spring', ...springConfigs.bouncy });

      if (newStatus === 'read' && previousStatus === 'delivered') {
        await animate(colorIntensity, 0, { duration: 0.1 });
        setTimeout(() => {
          animate(colorIntensity, 1, { duration: (pulseDuration / 2) / 1000 });
        }, 50);
      } else if (newStatus === 'delivered') {
        animate(colorIntensity, 1, { duration: (timingConfigs.smooth.duration ?? 300) / 1000 });
      } else if (newStatus === 'read') {
        animate(colorIntensity, 1, { duration: (timingConfigs.smooth.duration ?? 300) / 1000 });
      } else if (newStatus === 'sent' || newStatus === 'sending') {
        animate(colorIntensity, 0, { duration: (timingConfigs.fast.duration ?? 150) / 1000 });
      }
    },
    [opacity, scale, colorIntensity, iconRotation, previousStatus, pulseDuration]
  );

  useEffect(() => {
    if (previousStatus && previousStatus !== status) {
      animateStatusChange(status);
    } else {
      if (status === 'read' || status === 'delivered') {
        animate(colorIntensity, 1, { duration: (timingConfigs.smooth.duration ?? 300) / 1000 });
      } else {
        animate(colorIntensity, 0, { duration: (timingConfigs.fast.duration ?? 150) / 1000 });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, previousStatus]);

  const baseColor = STATUS_COLORS.sent;
  const targetColor = STATUS_COLORS[status] ?? STATUS_COLORS.sending;
  let color = interpolateColor(colorIntensity.get(), baseColor, targetColor);

  const animatedStyle = {
    opacity,
    transform: [
      { scale },
      { rotate: `${iconRotation.get()}deg` },
    ],
    color,
  };

  return {
    opacity,
    scale,
    colorIntensity,
    iconRotation,
    animatedStyle,
    animateStatusChange,
  };
}
