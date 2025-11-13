import React from 'react';
import { cn } from '@/lib/utils';
import type { ComponentProps } from 'react';
import { motion } from 'framer-motion';
import { getAriaLiveRegionAttributes } from '@/lib/accessibility';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface SkeletonProps extends ComponentProps<'div'> {
  variant?: 'default' | 'shimmer';
  enableAnimations?: boolean;
}

const shimmerVariants = {
  shimmer: {
    x: ['-100%', '100%'],
    transition: {
      x: {
        repeat: Infinity,
        duration: 1.5,
        ease: 'linear',
      },
    },
  },
};

function Skeleton({ className, variant = 'default', enableAnimations = true, ...props }: SkeletonProps) {
  const liveRegionAttrs = getAriaLiveRegionAttributes({
    live: 'polite',
    atomic: true,
  });
  const prefersReducedMotion = useReducedMotion();
  const shouldAnimate = enableAnimations && !prefersReducedMotion && variant === 'shimmer';

  if (shouldAnimate) {
    return (
      <motion.div
        role="status"
        aria-label="Loading content"
        data-slot="skeleton"
        className={cn(
          'bg-muted rounded-md relative overflow-hidden',
          className
        )}
        {...liveRegionAttrs}
        {...(props as Omit<typeof props, 'onAnimationStart' | 'onAnimationEnd' | 'onAnimationIteration' | 'onDrag' | 'onDragStart' | 'onDragEnd'>)}
      >
        <motion.div
          className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent"
          variants={shimmerVariants}
          animate="shimmer"
          style={{
            width: '200%',
          }}
        />
        <span className="sr-only">Loading...</span>
      </motion.div>
    );
  }

  return (
    <div
      role="status"
      aria-label="Loading content"
      data-slot="skeleton"
      className={cn(
        'bg-muted rounded-md',
        variant === 'default' && 'animate-pulse',
        variant === 'shimmer' &&
          'relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-shimmer before:bg-linear-to-r before:from-transparent before:via-white/10 before:to-transparent',
        className
      )}
      {...liveRegionAttrs}
      {...props}
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}

export { Skeleton };
