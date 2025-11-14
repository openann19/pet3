'use client';

import { motion } from 'framer-motion';
import React from 'react';
import { cn } from '@/lib/utils';
import { getSpacingClassesFromConfig } from '@/lib/typography';
import { springConfigs, motionDurations } from '@/effects/framer-motion/variants';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface PremiumCardProps {
  variant?: 'default' | 'glass' | 'elevated' | 'gradient';
  hover?: boolean;
  glow?: boolean;
  className?: string;
  children?: React.ReactNode;
  style?: React.CSSProperties;
  [key: string]: unknown;
}

export function PremiumCard({
  variant = 'default',
  hover = true,
  glow = false,
  className,
  children,
  style: _style,
  ...props
}: PremiumCardProps) {
  const reducedMotion = useReducedMotion();

  const cardVariants = {
    hidden: {
      opacity: 0,
      y: 20,
      scale: 1,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: reducedMotion
        ? { duration: 0.1 }
        : {
            duration: motionDurations.smooth,
            ease: [0.2, 0, 0, 1],
          },
    },
    hover: hover && !reducedMotion
      ? {
          scale: 1.02,
          y: -8,
          transition: springConfigs.smooth,
        }
      : {
          scale: 1,
          y: 0,
        },
  };

  const styleVariants = {
    default: 'bg-card border border-border',
    glass: 'glass-card',
    elevated: 'bg-card border border-border premium-shadow-lg',
    gradient: 'premium-gradient text-primary-foreground border-none',
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      whileHover={hover ? 'hover' : undefined}
      variants={cardVariants}
      className={cn(
        'rounded-xl',
        getSpacingClassesFromConfig({ padding: 'xl' }),
        styleVariants[variant],
        hover && 'cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}
