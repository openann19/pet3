/**
 * Progress Component (Web)
 * 
 * Professional Framer Motion progress bar with smooth animations
 * and optional shimmer effect.
 * 
 * Location: apps/web/src/components/ui/progress.tsx
 */

import React, { useEffect } from 'react';
import type { ComponentProps } from 'react';
import * as ProgressPrimitive from '@radix-ui/react-progress';
import { motion, useMotionValue, animate, useTransform } from 'framer-motion';

import { cn } from '@/lib/utils';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { progressVariants, motionDurations } from '@/effects/framer-motion/variants';

export interface ProgressProps extends ComponentProps<typeof ProgressPrimitive.Root> {
  showShimmer?: boolean;
}

function Progress({ className, value = 0, showShimmer = false, ...props }: ProgressProps): React.JSX.Element {
  const progressValue = Math.max(0, Math.min(100, value || 0));
  const ariaValueNow = Math.round(progressValue);
  const prefersReducedMotion = useReducedMotion();
  
  const progressMotion = useMotionValue(0);
  const shimmerX = useMotionValue(-100);

  // Animate progress value
  useEffect(() => {
    animate(progressMotion, progressValue, {
      duration: prefersReducedMotion ? 0 : motionDurations.smooth,
      ease: 'easeOut',
    });
  }, [progressValue, progressMotion, prefersReducedMotion]);

  // Animate shimmer if enabled
  useEffect(() => {
    if (showShimmer && !prefersReducedMotion && progressValue > 0 && progressValue < 100) {
      const shimmerAnimation = animate(shimmerX, 200, {
        duration: 2,
        repeat: Infinity,
        ease: 'linear',
      });
      return () => shimmerAnimation.stop();
    }
    return undefined;
  }, [showShimmer, prefersReducedMotion, progressValue, shimmerX]);

  const width = useTransform(progressMotion, (v: number) => `${v}%`);

  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={ariaValueNow}
      aria-label={props['aria-label'] || `Progress: ${ariaValueNow}%`}
      className={cn(
        'bg-primary/20 relative h-2 w-full overflow-hidden rounded-full shadow-inner',
        className
      )}
      {...props}
    >
      <motion.div
        data-slot="progress-indicator"
        className={cn(
          'bg-primary h-full rounded-full shadow-sm relative overflow-hidden',
          !prefersReducedMotion && 'will-change-[width]' // Performance optimization
        )}
        style={{ width }}
        variants={progressVariants}
        initial="hidden"
        animate="visible"
        transition={{
          duration: prefersReducedMotion ? 0 : motionDurations.smooth,
          ease: 'easeOut',
        }}
        aria-hidden="true"
      >
        {showShimmer && !prefersReducedMotion && (
          <motion.div
            className="absolute inset-0 bg-linear-to-r from-transparent via-white/30 to-transparent"
            style={{
              x: useTransform(shimmerX, (v: number) => `${v}%`),
              width: '50%',
            }}
            aria-hidden="true"
          />
        )}
      </motion.div>
    </ProgressPrimitive.Root>
  );
}

export { Progress };
