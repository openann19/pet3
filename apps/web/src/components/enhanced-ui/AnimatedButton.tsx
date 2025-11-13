'use client';

import { motion, useMotionValue, animate, useTransform } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { haptics } from '@/lib/haptics';
import { createLogger } from '@/lib/logger';
import { useEffect, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import { ensureFocusAppearance } from '@/core/a11y/focus-appearance';
import { useTargetSize } from '@/hooks/use-target-size';
import { springConfigs } from '@/effects/framer-motion/variants';
import { useReducedMotion } from '@/hooks/useReducedMotion';

const logger = createLogger('AnimatedButton');

interface AnimatedButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'default' | 'secondary' | 'ghost' | 'outline' | 'destructive' | 'link';
  size?: 'sm' | 'default' | 'lg' | 'icon';
  className?: string;
  disabled?: boolean;
  shimmer?: boolean;
  glow?: boolean;
  pulse?: boolean;
  type?: 'button' | 'submit' | 'reset';
  ariaLabel?: string;
}

export function AnimatedButton({
  children,
  onClick,
  variant = 'default',
  size = 'default',
  className,
  disabled = false,
  shimmer = false,
  glow = false,
  pulse = false,
  type = 'button',
  ariaLabel,
}: AnimatedButtonProps) {
  const reducedMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement | null>(null);
  // Target size validation - ensures 44x44px minimum touch target
  const { ensure: ensureTargetSize } = useTargetSize({ enabled: !disabled, autoFix: true });
  
  const scale = useMotionValue(1);
  const translateY = useMotionValue(0);
  const shimmerX = useMotionValue(-200);
  const glowProgress = useMotionValue(0);
  const pulseScale = useMotionValue(1);
  const pulseOpacity = useMotionValue(1);

  // Combined scale for pulse and press
  const combinedScale = useTransform(
    [scale, pulseScale],
    ([s, p]: number[]) => (s ?? 1) * (p ?? 1)
  );


  const handlePress = useCallback(() => {
    if (disabled) return;

    try {
      haptics.impact('light');

      if (!reducedMotion) {
        void animate(scale, 0.95, {
          type: 'spring',
          damping: 15,
          stiffness: 400,
        }).then(() => {
          void animate(scale, 1, {
            type: 'spring',
            damping: 15,
            stiffness: 400,
          });
        });
      }

      onClick?.();
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('AnimatedButton onClick error', err);
    }
  }, [disabled, onClick, scale, reducedMotion]);

  const handleEnter = useCallback(() => {
    if (disabled || reducedMotion) return;
    void animate(scale, 1.05, {
      type: 'spring',
      damping: springConfigs.smooth.damping,
      stiffness: springConfigs.smooth.stiffness,
    });
    void animate(translateY, -2, {
      type: 'spring',
      damping: springConfigs.smooth.damping,
      stiffness: springConfigs.smooth.stiffness,
    });
  }, [disabled, reducedMotion, scale, translateY]);

  const handleLeave = useCallback(() => {
    if (disabled || reducedMotion) return;
    void animate(scale, 1, {
      type: 'spring',
      damping: springConfigs.smooth.damping,
      stiffness: springConfigs.smooth.stiffness,
    });
    void animate(translateY, 0, {
      type: 'spring',
      damping: springConfigs.smooth.damping,
      stiffness: springConfigs.smooth.stiffness,
    });
  }, [disabled, reducedMotion, scale, translateY]);

  useEffect(() => {
    if (shimmer && !disabled && !reducedMotion) {
      void animate(shimmerX, 200, {
        duration: 2,
        ease: 'linear',
        repeat: Infinity,
        repeatType: 'loop',
      });
    } else {
      shimmerX.set(-200);
    }
  }, [shimmer, disabled, reducedMotion, shimmerX]);

  useEffect(() => {
    if (glow && !disabled && !reducedMotion) {
      void animate(glowProgress, 1, {
        duration: 2,
        ease: [0.4, 0, 0.6, 1],
        repeat: Infinity,
        repeatType: 'reverse',
      });
    } else {
      glowProgress.set(0);
    }
  }, [glow, disabled, reducedMotion, glowProgress]);

  useEffect(() => {
    if (pulse && !disabled && !reducedMotion) {
      void animate(pulseScale, 1.05, {
        duration: 1.5,
        ease: [0.4, 0, 0.6, 1],
        repeat: Infinity,
        repeatType: 'reverse',
      });
      void animate(pulseOpacity, 0.7, {
        duration: 1.5,
        ease: [0.4, 0, 0.6, 1],
        repeat: Infinity,
        repeatType: 'reverse',
      });
    } else {
      pulseScale.set(1);
      pulseOpacity.set(1);
    }
  }, [pulse, disabled, reducedMotion, pulseScale, pulseOpacity]);

  // Ensure focus appearance and target size meet WCAG 2.2 AAA requirements
  useEffect(() => {
    if (containerRef.current && !disabled) {
      const buttonElement = containerRef.current.querySelector('button');
      if (buttonElement) {
        ensureFocusAppearance(buttonElement);
        ensureTargetSize(buttonElement);
      }
    }
  }, [disabled, ensureTargetSize]);

  return (
    <motion.div
      ref={containerRef}
      className="inline-block"
      role="presentation"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      style={{
        scale: combinedScale,
        y: translateY,
        opacity: pulseOpacity,
      }}
    >
      <Button
        variant={variant}
        size={size}
        onClick={handlePress}
        disabled={disabled}
        type={type}
        aria-label={ariaLabel}
        className={cn(
          'relative overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-ring',
          glow && 'shadow-lg shadow-primary/30',
          className
        )}
      >
        {glow && (
          <motion.div
            className="pointer-events-none absolute inset-0 rounded-md"
            style={{
              opacity: useTransform(glowProgress, [0, 1], [0.3, 0.6]),
              boxShadow: '0 0 20px rgba(var(--primary), 0.5)',
            }}
          />
        )}
        {shimmer && !disabled && (
          <motion.div
            className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            style={{
              x: shimmerX,
              opacity: 0.3,
            }}
            animate={
              shimmer && !disabled && !reducedMotion
                ? {
                    x: ['-200%', '200%'],
                    transition: {
                      duration: 2,
                      ease: 'linear',
                      repeat: Infinity,
                      repeatType: 'loop',
                    },
                  }
                : {}
            }
          />
        )}
        <span className="relative z-10">{children}</span>
      </Button>
    </motion.div>
  );
}
