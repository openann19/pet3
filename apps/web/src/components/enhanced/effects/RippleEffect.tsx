'use client';
import { motion } from 'framer-motion';

import { useCallback } from 'react';
import { useRippleEffect } from '@/effects/reanimated/use-ripple-effect';
import { useAnimatedStyleValue } from '@/hooks/use-animated-style-value';
import type { AnimatedStyle } from '@/hooks/use-animated-style-value';
import { cn } from '@/lib/utils';
import type { ReactNode, HTMLAttributes } from 'react';
import { useUIConfig } from "@/hooks/use-ui-config";

export interface RippleEffectProps extends HTMLAttributes<HTMLDivElement> {
  color?: string;
  opacity?: number;
  duration?: number;
  disabled?: boolean;
  children?: ReactNode;
}

export function RippleEffect({
  color = 'rgba(255, 255, 255, 0.5)',
  opacity = 0.5,
  duration = 600,
  disabled = false,
  children,
  className,
  onClick,
  ...props
}: RippleEffectProps) {
    const _uiConfig = useUIConfig();
    const ripple = useRippleEffect({ color, opacity, duration });

  const rippleStyleValue = useAnimatedStyleValue(ripple.animatedStyle as AnimatedStyle);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!disabled) {
        ripple.addRipple(e);
        onClick?.(e);
      }
    },
    [disabled, ripple, onClick]
  );

  return (
    <div onClick={handleClick} className={cn('relative overflow-hidden', className)} {...props}>
      {children}
      {ripple.ripples.map((rippleState) => (
        <motion.div
          key={rippleState.id}
          style={{
            ...rippleStyleValue,
            position: 'absolute',
            left: rippleState.x,
            top: rippleState.y,
            width: 20,
            height: 20,
            backgroundColor: ripple.color,
            transform: 'translate(-50%, -50%)',
            borderRadius: '50%',
          }}
        />
      ))}
    </div>
  );
}
