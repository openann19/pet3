/**
 * Badge Component (Web)
 * 
 * Professional Framer Motion badge with entrance and pulse animations.
 * 
 * Location: apps/web/src/components/ui/badge.tsx
 */

import React from 'react';
import type { ComponentProps, JSX } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { motion } from 'framer-motion';

import { cn } from '@/lib/utils';
import { getTypographyClasses, getSpacingClassesFromConfig } from '@/lib/typography';
import { badgeVariants as badgeAnimationVariants } from '@/effects/framer-motion/variants';
import { useReducedMotion } from '@/hooks/useReducedMotion';

const badgeVariants = cva(
  cn(
    'inline-flex items-center justify-center rounded-[var(--radius-sm)] border w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 [&>svg]:pointer-events-none focus-visible:border-(--coral-primary) focus-visible:ring-[var(--coral-primary)]/50 focus-visible:ring-[3px] aria-invalid:ring-[var(--error)]/20 dark:aria-invalid:ring-[var(--error)]/40 aria-invalid:border-(--error) transition-[color,box-shadow] overflow-hidden',
    getTypographyClasses('caption'),
    getSpacingClassesFromConfig({ paddingX: 'sm', paddingY: 'xs', gap: 'xs' })
  ),
  {
    variants: {
      variant: {
        default: 'border-transparent bg-(--coral-primary) text-white [a&]:hover:bg-(--coral-hover)',
        secondary:
          'border-transparent bg-(--secondary-accent-orange) text-(--text-primary) [a&]:hover:bg-(--secondary-accent-yellow)',
        destructive:
          'border-transparent bg-(--error) text-white [a&]:hover:bg-(--coral-hover) focus-visible:ring-[var(--error)]/20 dark:focus-visible:ring-[var(--error)]/40',
        outline: 'text-(--text-primary) border-(--border-light) [a&]:hover:bg-(--secondary-accent-orange) [a&]:hover:text-(--text-primary)',
        success: 'border-transparent bg-(--success) text-white [a&]:hover:bg-(--success)/90',
        warning: 'border-transparent bg-(--warning) text-(--text-primary) [a&]:hover:bg-(--warning)/90',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps extends ComponentProps<'span'>, VariantProps<typeof badgeVariants> {
  asChild?: boolean;
  pulse?: boolean;
}

function Badge({
  className,
  variant,
  asChild = false,
  pulse = false,
  ...props
}: BadgeProps): JSX.Element {
  const Comp = asChild ? Slot : motion.span;
  const prefersReducedMotion = useReducedMotion();

  const { onAnimationStart: _onAnimationStart, onAnimationEnd: _onAnimationEnd, onAnimationIteration: _onAnimationIteration, onDrag: _onDrag, onDragStart: _onDragStart, onDragEnd: _onDragEnd, ...restProps } = props;
  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      variants={prefersReducedMotion ? undefined : badgeAnimationVariants}
      initial="hidden"
      animate={pulse ? 'pulse' : 'visible'}
      whileHover={prefersReducedMotion ? undefined : { scale: 1.05 }}
      transition={{
        duration: prefersReducedMotion ? 0 : 0.2,
        ease: 'easeOut',
      }}
      {...restProps}
    />
  );
}

export { Badge, badgeVariants };
