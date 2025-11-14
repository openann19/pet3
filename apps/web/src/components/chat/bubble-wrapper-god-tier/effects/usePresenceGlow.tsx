import { isTruthy } from '@/core/guards';
'use client';
import { motion, useMotionValue, animate, useTransform } from 'framer-motion';

import { useEffect } from 'react';
import { timingConfigs } from '@/effects/reanimated/transitions';
import type { ReactNode } from 'react';
import { useUIConfig } from "@/hooks/use-ui-config";

export interface PresenceGlowProps {
  isActive: boolean;
  children: ReactNode;
  className?: string;
  intensity?: number;
  pulseDuration?: number;
}

const DEFAULT_INTENSITY = 0.6;
const DEFAULT_PULSE_DURATION = 2000;

export function PresenceGlow({
  isActive,
  children,
  className,
  intensity = DEFAULT_INTENSITY,
  pulseDuration = DEFAULT_PULSE_DURATION,
}: PresenceGlowProps): React.JSX.Element {
    const _uiConfig = useUIConfig();
    const glowOpacity = useMotionValue(0);

  useEffect(() => {
    if (isTruthy(isActive)) {
      animate(glowOpacity, [intensity, intensity * 0.5], {
        repeat: Infinity,
        duration: pulseDuration / 1000,
        ease: 'easeInOut',
        times: [0, 1],
      });
    } else {
      animate(glowOpacity, 0, {
        duration: (timingConfigs.fast.duration ?? 0.15) / 1000,
        ease: 'easeOut',
      });
    }
  }, [isActive, intensity, pulseDuration, glowOpacity]);

  const blurRadius = useTransform(glowOpacity, (opacity) => 10 + opacity * 10);
  const shadowOpacity = useTransform(glowOpacity, (opacity) => opacity * 0.8);
  const boxShadow = useTransform(
    [blurRadius, shadowOpacity],
    ([blur, shadow]) => `0 0 ${blur}px rgba(59, 130, 246, ${shadow})`
  );

  return (
    <div className={className} style={{ position: 'relative' }}>
      {children}
      {isActive && (
        <motion.div
          style={{
            opacity: glowOpacity,
            boxShadow,
          }}
          className="absolute inset-0 rounded-full pointer-events-none -z-10"
        >
          <div className="absolute inset-0 rounded-full bg-blue-500/30 blur-md" />
        </motion.div>
      )}
    </div>
  );
}
