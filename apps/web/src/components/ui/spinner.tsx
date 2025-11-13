/**
 * Spinner Component (Web)
 * 
 * Professional Framer Motion spinner with smooth animations,
 * premium variant effects, and performance optimizations.
 * 
 * Location: apps/web/src/components/ui/spinner.tsx
 */

'use client';

import React, { useEffect, useMemo } from 'react';
import type { ComponentProps } from 'react';
import { motion, useMotionValue, animate, type Variants } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { isTruthy } from '@petspark/shared';
import { getAriaLiveRegionAttributes } from '@/lib/accessibility';
// Note: spinnerVariants and motionDurations imported but using custom variants for better control

export interface SpinnerProps extends ComponentProps<'div'> {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'subtle' | 'premium';
}

const sizeClasses = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-2',
  lg: 'h-12 w-12 border-4',
} as const;

function Spinner({
  className,
  size = 'md',
  variant = 'default',
  ...props
}: SpinnerProps): React.JSX.Element {
  const reducedMotion = useReducedMotion();
  const rotation = useMotionValue(0);
  const opacity = useMotionValue(1);

  useEffect(() => {
    if (isTruthy(reducedMotion)) {
      // For reduced motion, use a slower, less noticeable animation
      animate(rotation, 360, {
        duration: 2,
        ease: 'linear',
        repeat: Infinity,
        repeatType: 'loop',
      });
      animate(opacity, 0.7, {
        duration: 1.5,
        ease: 'easeInOut',
        repeat: Infinity,
        repeatType: 'reverse',
      });
    } else {
      // Premium smooth animation for normal users
      animate(rotation, 360, {
        duration: 1,
        ease: 'linear',
        repeat: Infinity,
        repeatType: 'loop',
      });
      opacity.set(1);
    }
  }, [reducedMotion, rotation, opacity]);

  const variants: Variants = useMemo(() => ({
    spinning: {
      rotate: 360,
      opacity: isTruthy(reducedMotion) ? [1, 0.7, 1] : 1,
      boxShadow: variant === 'premium' && !reducedMotion
        ? [
            '0 0 0px rgba(var(--primary-rgb), 0)',
            '0 0 12px rgba(var(--primary-rgb), 0.4)',
            '0 0 0px rgba(var(--primary-rgb), 0)',
          ]
        : undefined,
      transition: {
        rotate: {
          duration: isTruthy(reducedMotion) ? 2 : 1,
          ease: 'linear',
          repeat: Infinity,
          repeatType: 'loop' as const,
        },
        opacity: isTruthy(reducedMotion)
          ? {
              duration: 1.5,
              ease: 'easeInOut',
              repeat: Infinity,
              repeatType: 'reverse' as const,
            }
          : undefined,
        boxShadow: variant === 'premium' && !reducedMotion
          ? {
              duration: 2,
              ease: 'easeInOut',
              repeat: Infinity,
              repeatType: 'reverse' as const,
            }
          : undefined,
      },
    },
  }), [reducedMotion, variant]);

  const variantClasses = {
    default: 'border-primary border-t-transparent',
    subtle: 'border-primary/60 border-t-transparent/40',
    premium: 'border-primary border-t-transparent shadow-lg shadow-primary/20',
  } as const;

  const liveRegionAttrs = getAriaLiveRegionAttributes({
    live: 'polite',
    atomic: true,
  });

  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn('inline-block', className)}
      {...liveRegionAttrs}
      {...props}
    >
      <motion.div
        variants={variants}
        animate="spinning"
        style={{ rotate: rotation, opacity }}
        className={cn(
          'rounded-full',
          sizeClasses[size],
          variantClasses[variant],
          'will-change-transform' // Performance optimization
        )}
        aria-hidden="true"
      />
      <span className="sr-only">Loading...</span>
    </div>
  );
}

export { Spinner };
