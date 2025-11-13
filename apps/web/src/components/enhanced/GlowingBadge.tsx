'use client';

import { motion, useMotionValue, animate, useMotionValueEvent } from 'framer-motion';
import React, { useMemo, useEffect, useState, memo } from 'react';
import { motionDurations } from '@/effects/framer-motion/variants';
import { cn } from '@/lib/utils';
import { usePrefersReducedMotion } from '@/utils/reduced-motion';
import { getSpacing, getColor } from '@/lib/design-tokens';
import { getSpacingClassesFromConfig, getTypographyClasses } from '@/lib/design-token-utils';
import { useTheme } from '@/hooks/useTheme';
import { colorWithOpacity } from '@/hooks/useDesignTokens';

export type GlowingBadgeVariant = 'primary' | 'secondary' | 'accent' | 'success' | 'warning';

export interface GlowingBadgeProps {
  children: React.ReactNode;
  variant?: GlowingBadgeVariant;
  glow?: boolean;
  pulse?: boolean;
  className?: string;
  'aria-label'?: string;
}

// Variant styles will be computed dynamically with design tokens
const getVariantStyles = (variant: GlowingBadgeVariant): string => {
  const baseClasses = 'backdrop-blur-sm';
  switch (variant) {
    case 'primary':
      return `${baseClasses} bg-primary/10 text-primary border-primary/20`;
    case 'secondary':
      return `${baseClasses} bg-secondary/10 text-secondary border-secondary/20`;
    case 'accent':
      return `${baseClasses} bg-accent/10 text-accent border-accent/20`;
    case 'success':
      return `${baseClasses} bg-success/10 text-success border-success/20`;
    case 'warning':
      return `${baseClasses} bg-warning/10 text-warning border-warning/20`;
    default:
      return `${baseClasses} bg-primary/10 text-primary border-primary/20`;
  }
};

export function GlowingBadge({
  children,
  variant = 'primary',
  glow = true,
  pulse = false,
  className,
  'aria-label': ariaLabel,
}: GlowingBadgeProps): JSX.Element {
  const prefersReducedMotion = usePrefersReducedMotion();
  const { theme } = useTheme();
  const themeMode: 'light' | 'dark' = theme;
  const glowProgress = useMotionValue(0);
  // Use design token for initial glow radius (10px = spacing '2' which is 8px, so we use '2' * 1.25)
  const initialGlowRadius = parseInt(getSpacing('2'), 10) * 1.25;
  const maxGlowRadius = initialGlowRadius * 2;
  const [glowRadius, setGlowRadius] = useState(initialGlowRadius);

  // Get variant colors using design tokens
  const variantGlowColor = useMemo(() => {
    const colorKey: 'primary' | 'secondary' | 'accent' | 'success' | 'warning' = 
      variant === 'success' ? 'success' : 
      variant === 'warning' ? 'warning' : 
      variant;
    const color = getColor(colorKey, themeMode);
    return colorWithOpacity(color, 0.6);
  }, [variant, themeMode]);

  // Glow pulse animation
  useEffect(() => {
    if (!glow || prefersReducedMotion) {
      glowProgress.set(0);
      setGlowRadius(0);
      return;
    }

    const animation = animate(glowProgress, [0, 0.5, 1], {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    });

    return () => {
      animation.stop();
    };
  }, [glow, glowProgress, prefersReducedMotion]);

  // Update glow radius reactively
  useMotionValueEvent(glowProgress, 'change', (latest) => {
    if (glow && !prefersReducedMotion) {
      const radius = latest < 0.5 
        ? initialGlowRadius + (latest * 2) * initialGlowRadius  // 0 -> 0.5: initial -> max
        : maxGlowRadius - ((latest - 0.5) * 2) * initialGlowRadius; // 0.5 -> 1: max -> initial
      setGlowRadius(radius);
    }
  });

  const variantStyles = useMemo<string>(() => getVariantStyles(variant), [variant]);

  const badgeVariants = {
    hidden: {
      scale: 0.8,
      opacity: 0,
    },
    visible: {
      scale: 1,
      opacity: 1,
      transition: prefersReducedMotion
        ? { duration: 0.1 }
        : {
            duration: motionDurations.smooth,
            ease: [0.2, 0, 0, 1],
          },
    },
  };

  const pulseVariants = {
    pulse: {
      opacity: [0.5, 1, 0.5],
      scale: [1, 1.1, 1],
      transition: prefersReducedMotion
        ? { duration: 0 }
        : {
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          },
    },
    static: {
      opacity: 1,
      scale: 1,
    },
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={badgeVariants}
      className={cn(
        'inline-flex items-center rounded-full border backdrop-blur-sm',
        getSpacingClassesFromConfig({ gap: 'xs', paddingX: 'lg', paddingY: 'xs' }),
        getTypographyClasses('caption'),
        'font-semibold',
        variantStyles,
        className
      )}
      role="status"
      aria-label={ariaLabel}
      style={
        glow && !prefersReducedMotion && glowRadius > 0
          ? {
              boxShadow: `0 0 ${glowRadius}px ${variantGlowColor}`,
              filter: `drop-shadow(0 0 ${glowRadius * 0.5}px ${variantGlowColor})`,
            }
          : undefined
      }
    >
      {pulse && (
        <motion.div
          variants={pulseVariants}
          animate={pulse ? 'pulse' : 'static'}
          className="rounded-full bg-current"
          style={{
            width: getSpacing('2'),
            height: getSpacing('2'),
          }}
          role="presentation"
          aria-hidden="true"
        >
          <span className="sr-only">Pulsing indicator</span>
        </motion.div>
      )}
      {children}
    </motion.div>
  );
}

// Memoize to prevent unnecessary re-renders
export const MemoizedGlowingBadge = memo(GlowingBadge);
