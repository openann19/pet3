'use client';

import { motion, useMotionValue, animate, useTransform } from 'framer-motion';
import { motionDurations } from '@/effects/framer-motion/variants';
import { usePrefersReducedMotion } from '@/utils/reduced-motion';
import React from 'react';
import type { ReactNode } from 'react';
import { createLogger } from '@/lib/logger';

const logger = createLogger('EnhancedVisuals');

interface EnhancedCardProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export function EnhancedCard({ children, className = '', delay = 0 }: EnhancedCardProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const opacity = useMotionValue(0);
  const y = useMotionValue(20);
  const hoverY = useMotionValue(0);
  const translateY = useTransform([y, hoverY], ([yVal, hoverVal]: number[]) => (yVal ?? 0) + (hoverVal ?? 0));

  React.useEffect(() => {
    if (prefersReducedMotion) {
      opacity.set(1);
      y.set(0);
      return;
    }
    const timeoutId = setTimeout(() => {
      void animate(opacity, 1, { duration: motionDurations.smooth });
      void animate(y, 0, { duration: motionDurations.smooth });
    }, delay);
    return () => {
      clearTimeout(timeoutId);
    };
  }, [delay, opacity, y, prefersReducedMotion]);

  const handleMouseEnter = React.useCallback(() => {
    if (!prefersReducedMotion) {
      void animate(hoverY, -4, { duration: motionDurations.fast });
    }
  }, [hoverY, prefersReducedMotion]);

  const handleMouseLeave = React.useCallback(() => {
    if (!prefersReducedMotion) {
      void animate(hoverY, 0, { duration: motionDurations.fast });
    }
  }, [hoverY, prefersReducedMotion]);

  return (
    <motion.div
      style={{
        opacity,
        y: translateY,
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface FloatingActionButtonProps {
  onClick: () => void;
  icon: ReactNode;
  label?: string;
  className?: string;
}

export function FloatingActionButton({
  onClick,
  icon,
  label,
  className = '',
}: FloatingActionButtonProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const opacity = useMotionValue(0);
  const scale = useMotionValue(0);
  const hoverScale = useMotionValue(1);

  React.useEffect(() => {
    if (prefersReducedMotion) {
      opacity.set(1);
      scale.set(1);
      return;
    }
    void animate(opacity, 1, { duration: motionDurations.fast });
    const timeoutId = setTimeout(() => {
      void animate(scale, 1, { duration: motionDurations.smooth });
    }, 200);
    return () => {
      clearTimeout(timeoutId);
    };
  }, [opacity, scale, prefersReducedMotion]);

  const handleMouseEnter = React.useCallback(() => {
    if (!prefersReducedMotion) {
      void animate(hoverScale, 1.05, { duration: motionDurations.fast });
    }
  }, [hoverScale, prefersReducedMotion]);

  const handleMouseLeave = React.useCallback(() => {
    if (!prefersReducedMotion) {
      void animate(hoverScale, 1, { duration: motionDurations.fast });
    }
  }, [hoverScale, prefersReducedMotion]);

  const handleClick = React.useCallback(() => {
    try {
      onClick();
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('FloatingActionButton onClick error', err);
    }
  }, [onClick]);

  return (
    <motion.div
      style={{
        opacity,
        transform: `scale(${scale.get() * hoverScale.get()})`,
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      className={`fixed bottom-24 right-6 z-50 h-14 flex items-center gap-3 bg-linear-to-r from-primary to-accent text-white px-6 rounded-full shadow-2xl hover:shadow-primary/50 transition-all duration-300 ${className}`}
    >
      <span className="text-xl">{icon}</span>
      {label && <span className="font-semibold text-sm">{label}</span>}
    </motion.div>
  );
}

interface PulseIndicatorProps {
  color?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function PulseIndicator({ color = 'bg-primary', size = 'md' }: PulseIndicatorProps) {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  const scale1 = useMotionValue(1);
  const opacity1 = useMotionValue(1);
  const scale2 = useMotionValue(1);
  const opacity2 = useMotionValue(0.5);

  React.useEffect(() => {
    // Pulse animation for first circle
    const animatePulse1 = () => {
      animate(scale1, 1.2, { duration: 1, repeat: Infinity, repeatType: 'reverse' });
      animate(opacity1, 0.8, { duration: 1, repeat: Infinity, repeatType: 'reverse' });
    };
    const animatePulse2 = () => {
      animate(scale2, 1.8, { duration: 2, repeat: Infinity, repeatType: 'reverse' });
      animate(opacity2, 0, { duration: 2, repeat: Infinity, repeatType: 'reverse' });
    };
    animatePulse1();
    animatePulse2();
  }, [scale1, opacity1, scale2, opacity2]);

  return (
    <div className="relative inline-flex">
      <motion.div
        style={{
          transform: `scale(${scale1.get()})`,
          opacity: opacity1,
        }}
        className={`${String(sizeClasses[size] ?? '')} ${String(color ?? '')} rounded-full`}
      />
      <motion.div
        style={{
          position: 'absolute',
          inset: 0,
          transform: `scale(${scale2.get()})`,
          opacity: opacity2,
        }}
        className={`absolute inset-0 ${String(color ?? '')} rounded-full opacity-30`}
      />
    </div>
  );
}

interface GradientTextProps {
  children: ReactNode;
  className?: string;
  from?: string;
  via?: string;
  to?: string;
}

export function GradientText({
  children,
  className = '',
  from = 'from-primary',
  via = 'via-accent',
  to = 'to-secondary',
}: GradientTextProps) {
  return (
    <span
      className={`bg-linear-to-r ${from} ${via} ${to} bg-clip-text text-transparent font-bold ${className}`}
    >
      {children}
    </span>
  );
}

interface ShimmerProps {
  children: ReactNode;
  className?: string;
}

export function Shimmer({ children, className = '' }: ShimmerProps) {
  const translateX = useMotionValue(-100);

  React.useEffect(() => {
    const loop = () => {
      animate(translateX, 200, {
        duration: 2,
        onComplete: () => {
          translateX.set(-100);
          loop();
        },
      });
    };
    loop();
    return () => {
      translateX.stop();
    };
  }, [translateX]);

  return (
    <div className={`relative overflow-hidden ${String(className ?? '')}`}>
      {children}
      <motion.div
        style={{
          transform: `translateX(${translateX.get()}px)`,
          pointerEvents: 'none',
        }}
        className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent"
      />
    </div>
  );
}

interface CounterBadgeProps {
  count: number;
  max?: number;
  variant?: 'primary' | 'secondary' | 'accent';
}

export function CounterBadge({ count, max = 99, variant = 'primary' }: CounterBadgeProps) {
  const displayCount = count > max ? `${max}+` : count;

  const variantClasses = {
    primary: 'bg-primary text-primary-foreground',
    secondary: 'bg-secondary text-secondary-foreground',
    accent: 'bg-accent text-accent-foreground',
  };

  const scale = useMotionValue(count === 0 ? 1 : 0);

  React.useEffect(() => {
    animate(scale, count > 0 ? 1 : 0, { duration: 0.2 });
  }, [count, scale]);

  if (count === 0) return null;

  return (
    <motion.div
      style={{
        transform: `scale(${scale.get()})`,
      }}
      className={`absolute -top-1 -right-1 h-5 min-w-5 px-1.5 rounded-full flex items-center justify-center text-xs font-bold shadow-lg ${variantClasses[variant]}`}
    >
      {displayCount}
    </motion.div>
  );
}

interface LoadingDotsProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

function useDotAnimation(delay: number) {
  const translateY = useMotionValue(0);
  const opacity = useMotionValue(0.5);

  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      const loop = () => {
        animate(translateY, -8, {
          duration: 0.3,
          onComplete: () => {
            animate(translateY, 0, {
              duration: 0.3,
              onComplete: loop,
            });
          },
        });
        animate(opacity, 1, {
          duration: 0.3,
          onComplete: () => {
            animate(opacity, 0.5, {
              duration: 0.3,
              onComplete: loop,
            });
          },
        });
      };
      loop();
    }, delay);
    return () => {
      clearTimeout(timeoutId);
      translateY.stop();
      opacity.stop();
    };
  }, [delay, translateY, opacity]);

  return {
    transform: `translateY(${translateY.get()}px)`,
    opacity,
  };
}

export function LoadingDots({ size = 'md', color = 'bg-primary' }: LoadingDotsProps) {
  const sizeClasses = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-3 h-3',
  };

  const dot1Style = useDotAnimation(0);
  const dot2Style = useDotAnimation(150);
  const dot3Style = useDotAnimation(300);

  return (
    <div className="flex items-center justify-center gap-1.5">
      <motion.div
        style={dot1Style}
        className={`${String(sizeClasses[size] ?? '')} ${String(color ?? '')} rounded-full`}
      />
      <motion.div
        style={dot2Style}
        className={`${String(sizeClasses[size] ?? '')} ${String(color ?? '')} rounded-full`}
      />
      <motion.div
        style={dot3Style}
        className={`${String(sizeClasses[size] ?? '')} ${String(color ?? '')} rounded-full`}
      />
    </div>
  );
}

interface GlowingBorderProps {
  children: ReactNode;
  className?: string;
  glowColor?: string;
}

export function GlowingBorder({
  children,
  className = '',
  glowColor = 'primary',
}: GlowingBorderProps) {
  const opacity = useMotionValue(0);

  const handleMouseEnter = React.useCallback(() => {
    animate(opacity, 0.5, { duration: 0.3 });
  }, [opacity]);

  const handleMouseLeave = React.useCallback(() => {
    animate(opacity, 0, { duration: 0.3 });
  }, [opacity]);

  return (
    <div className={`relative ${String(className ?? '')}`}>
      <motion.div
        style={{
          opacity,
          filter: 'blur(4px)',
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`absolute -inset-[1px] bg-linear-to-r from-${String(glowColor ?? '')} via-accent to-${String(glowColor ?? '')} rounded-inherit`}
      />
      <div className="relative bg-card rounded-inherit">{children}</div>
    </div>
  );
}
