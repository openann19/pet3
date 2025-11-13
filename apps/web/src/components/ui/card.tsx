/**
 * Card Component (Web)
 * 
 * Professional Framer Motion card with subtle animations for hover,
 * focus, layout changes, and entrance effects.
 * 
 * Location: apps/web/src/components/ui/card.tsx
 */

import React from 'react';
import type { ComponentProps, JSX, KeyboardEvent } from 'react';
import { motion } from 'framer-motion';

import { cn } from '@/lib/utils';
import { getTypographyClasses, getSpacingClassesFromConfig } from '@/lib/typography';
import { cardVariants, depthCardVariants } from '@/effects/framer-motion/variants';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useMotionTokens } from '@/hooks/useMotionTokens';

export interface CardProps extends ComponentProps<'div'> {
  clickable?: boolean
  onClick?: () => void
  "aria-label"?: string
  "aria-describedby"?: string
  enableDepth?: boolean
  enableAnimations?: boolean
}

function Card({ 
  className, 
  clickable, 
  onClick, 
  "aria-label": ariaLabel, 
  "aria-describedby": ariaDescribedBy, 
  enableDepth = false,
  enableAnimations = true,
  role, 
  tabIndex, 
  ...props 
}: CardProps): JSX.Element {
  const isClickable = clickable ?? Boolean(onClick);
  const cardRole = role ?? (isClickable ? 'button' : undefined);
  const cardTabIndex = tabIndex ?? (isClickable ? 0 : undefined);
  const prefersReducedMotion = useReducedMotion();
  const tokens = useMotionTokens();
  const shouldAnimate = enableAnimations && !prefersReducedMotion;
  const variants = enableDepth && shouldAnimate ? depthCardVariants : (shouldAnimate ? cardVariants : undefined);
  
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>): void => {
    if (isClickable && onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick();
    }
  };

  const { onDrag: _onDrag, onDragStart: _onDragStart, onDragEnd: _onDragEnd, onAnimationStart: _onAnimationStart, onAnimationEnd: _onAnimationEnd, onAnimationIteration: _onAnimationIteration, ...restProps } = props;
  return (
    <motion.div
      data-slot="card"
      role={cardRole}
      tabIndex={cardTabIndex}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      className={cn(
        'bg-white text-card-foreground flex flex-col rounded-3xl border border-border/60',
        isClickable && 'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-ring focus-visible:ring-offset-background',
        shouldAnimate && 'will-change-transform', // Performance optimization
        enableDepth && shouldAnimate && 'preserve-3d', // 3D transform support
        getSpacingClassesFromConfig({ gap: 'xl' }),
        className
      )}
      variants={variants}
      initial={shouldAnimate ? "hidden" : false}
      animate={shouldAnimate ? "visible" : false}
      whileHover={shouldAnimate && isClickable ? 'hover' : undefined}
      whileFocus={shouldAnimate && isClickable ? 'hover' : undefined}
      whileTap={shouldAnimate && isClickable ? 'tap' : undefined}
      layout
      transition={shouldAnimate ? {
        ...tokens.spring.smooth,
        duration: tokens.durations.smooth,
      } : undefined}
      {...restProps}
    />
  );
}

function CardHeader({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        '@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6',
        getSpacingClassesFromConfig({ gap: 'sm', paddingX: '2xl' }),
        className
      )}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-title"
      className={cn(
        getTypographyClasses('h3'),
        className
      )}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-description"
      className={cn(
        'text-muted-foreground',
        getTypographyClasses('caption'),
        className
      )}
      {...props}
    />
  );
}

function CardAction({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-action"
      className={cn('col-start-2 row-span-2 row-start-1 self-start justify-self-end', className)}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-content"
      className={cn(
        getSpacingClassesFromConfig({ paddingX: 'xl' }),
        className
      )}
      {...props}
    />
  );
}

function CardFooter({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        'flex items-center [.border-t]:pt-6',
        getSpacingClassesFromConfig({ paddingX: 'xl' }),
        className
      )}
      {...props}
    />
  );
}

export { Card, CardHeader, CardFooter, CardTitle, CardAction, CardDescription, CardContent };
