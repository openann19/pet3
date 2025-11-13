'use client';

import { motion, useMotionValue, animate } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { springConfigs, motionDurations } from '@/effects/framer-motion/variants';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { isTruthy } from '@petspark/shared';

interface AnimatedCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
  variant?: 'default' | 'glass' | 'gradient' | 'glow';
  delay?: number;
  tabIndex?: number;
  role?: string;
  ariaLabel?: string;
}

export function AnimatedCard({
  children,
  className,
  onClick,
  hover = true,
  variant = 'default',
  delay = 0,
  tabIndex = 0,
  role = 'group',
  ariaLabel,
}: AnimatedCardProps) {
  const reducedMotion = useReducedMotion();
  const isClickable = typeof onClick === 'function';

  const scale = useMotionValue(1);
  const translateY = useMotionValue(20);
  const opacity = useMotionValue(0);

  useEffect(() => {
    if (reducedMotion) {
      opacity.set(1);
      translateY.set(0);
      return;
    }

    if (delay > 0) {
      const timer = setTimeout(() => {
        void animate(opacity, 1, {
          duration: motionDurations.smooth,
          ease: [0.2, 0, 0, 1],
        });
        void animate(translateY, 0, {
          duration: motionDurations.smooth,
          ease: [0.2, 0, 0, 1],
        });
      }, delay);
      return () => clearTimeout(timer);
    }
    
    void animate(opacity, 1, {
      duration: motionDurations.smooth,
      ease: [0.2, 0, 0, 1],
    });
    void animate(translateY, 0, {
      duration: motionDurations.smooth,
      ease: [0.2, 0, 0, 1],
    });
  }, [delay, opacity, translateY, reducedMotion]);

  const handleEnter = useCallback(() => {
    if (!hover || !isClickable || reducedMotion) return;
    void animate(scale, 1.02, {
      type: 'spring',
      damping: springConfigs.smooth.damping,
      stiffness: springConfigs.smooth.stiffness,
    });
    void animate(translateY, -8, {
      type: 'spring',
      damping: springConfigs.smooth.damping,
      stiffness: springConfigs.smooth.stiffness,
    });
  }, [hover, isClickable, reducedMotion, scale, translateY]);

  const handleLeave = useCallback(() => {
    if (!hover || !isClickable || reducedMotion) return;
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
  }, [hover, isClickable, reducedMotion, scale, translateY]);

  const handleClick = useCallback(() => {
    if (isTruthy(isClickable)) {
      if (!reducedMotion) {
        void animate(scale, 0.98, {
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
    }
  }, [isClickable, onClick, scale, reducedMotion]);

  const variantClasses = {
    default: 'bg-card border border-border',
    glass: 'glass-card backdrop-blur-md bg-white/5 border border-white/10 shadow-sm',
    gradient: 'gradient-card border border-transparent',
    glow: 'bg-card border border-border animate-glow-ring shadow-lg shadow-primary/10',
  };

  return (
    <motion.div
      className={cn(
        'transition-transform duration-300',
        isClickable &&
          'cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-xl',
        className
      )}
      style={{
        scale,
        y: translateY,
        opacity,
      }}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onClick={handleClick}
      tabIndex={isClickable ? tabIndex : undefined}
      role={isClickable ? role : undefined}
      aria-label={ariaLabel}
      whileHover={reducedMotion || !hover || !isClickable ? undefined : { scale: 1.02, y: -8 }}
      whileTap={reducedMotion || !isClickable ? undefined : { scale: 0.98 }}
    >
      <Card
        className={cn(
          'overflow-hidden rounded-xl transition-all duration-300',
          variantClasses[variant]
        )}
      >
        {children}
      </Card>
    </motion.div>
  );
}
