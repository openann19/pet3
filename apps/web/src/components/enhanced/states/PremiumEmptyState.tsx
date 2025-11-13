'use client';

import { motion } from 'framer-motion';
import React, { useCallback } from 'react';
import { springConfigs, motionDurations } from '@/effects/framer-motion/variants';
import { haptics } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import { PremiumButton } from '../PremiumButton';
import { usePrefersReducedMotion } from '@/utils/reduced-motion';
import { getTypographyClasses } from '@/lib/typography';

export interface PremiumEmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  variant?: 'default' | 'minimal' | 'illustrated';
  className?: string;
}

export function PremiumEmptyState({
  icon,
  title,
  description,
  action,
  variant = 'default',
  className,
}: PremiumEmptyStateProps): React.JSX.Element {
  const prefersReducedMotion = usePrefersReducedMotion();

  const animationVariants = {
    hidden: {
      scale: 0.9,
      opacity: 0,
    },
    visible: {
      scale: 1,
      opacity: 1,
      transition: prefersReducedMotion
        ? { duration: 0.1 }
        : {
            ...springConfigs.smooth,
            duration: motionDurations.smooth,
          },
    },
  };

  const handleAction = useCallback(() => {
    haptics.impact('light');
    action?.onClick();
  }, [action]);

  const styleVariants = {
    default: 'text-center py-12 px-4',
    minimal: 'text-center py-8 px-4',
    illustrated: 'text-center py-16 px-4',
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={animationVariants}
      className={cn('flex flex-col items-center', styleVariants[variant], className)}
    >
      {icon && (
        <div className="mb-4 text-(--text-muted)" aria-hidden="true">
          {icon}
        </div>
      )}
      <h3 className={cn(getTypographyClasses('h3'), 'mb-2 text-(--text-primary)')}>
        {title}
      </h3>
      {description && (
        <p className={cn(getTypographyClasses('body'), 'mb-6 max-w-[60ch] text-(--text-muted)')}>
          {description}
        </p>
      )}
      {action && (
        <PremiumButton onClick={handleAction} variant="primary" size="md">
          {action.label}
        </PremiumButton>
      )}
    </motion.div>
  );
}
