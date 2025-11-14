'use client';
import { motion, AnimatePresence } from 'framer-motion';

import React, { useCallback, useState } from 'react';
import { motionDurations } from '@/effects/framer-motion/variants';
import { haptics } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { useUIConfig } from "@/hooks/use-ui-config";
import { useReducedMotion } from '@/hooks/useReducedMotion';

export interface PremiumChipProps {
  label: string;
  variant?: 'default' | 'outlined' | 'filled' | 'gradient';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  onClose?: () => void;
  selected?: boolean;
  disabled?: boolean;
  className?: string;
  'aria-label': string;
}

export function PremiumChip({
  label,
  variant = 'default',
  size = 'md',
  icon,
  onClose,
  selected = false,
  disabled = false,
  className,
  'aria-label': ariaLabel,
}: PremiumChipProps): React.JSX.Element {
  const _uiConfig = useUIConfig();
  const reducedMotion = useReducedMotion();
  const [isRemoving, setIsRemoving] = useState(false);

  const handleClose = useCallback(() => {
    if (disabled || !onClose || isRemoving) return;

    setIsRemoving(true);
    haptics.impact('light');

    setTimeout(() => {
      onClose();
    }, reducedMotion ? 0 : 200);
  }, [disabled, onClose, isRemoving, reducedMotion]);

  const chipVariants = {
    initial: { scale: 1, opacity: 1 },
    exit: {
      scale: 0.8,
      opacity: 0,
      transition: reducedMotion
        ? { duration: 0 }
        : {
            duration: motionDurations.normal,
            ease: [0.4, 0, 1, 1],
          },
    },
  };

  const handleClick = useCallback(() => {
    if (disabled) return;
    haptics.selection();
  }, [disabled]);

  const variants = {
    default: selected
      ? 'bg-primary text-primary-foreground border-primary'
      : 'bg-muted text-muted-foreground border-muted',
    outlined: selected
      ? 'bg-transparent text-primary border-2 border-primary'
      : 'bg-transparent text-foreground border-2 border-border',
    filled: selected
      ? 'bg-primary text-primary-foreground border-transparent'
      : 'bg-muted text-muted-foreground border-transparent',
    gradient: selected
      ? 'bg-linear-to-r from-primary via-primary/80 to-primary text-primary-foreground border-transparent'
      : 'bg-muted text-muted-foreground border-muted',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs h-6',
    md: 'px-3 py-1 text-sm h-8',
    lg: 'px-4 py-1.5 text-base h-10',
  };

  return (
    <AnimatePresence mode="wait">
      {!isRemoving && (
        <motion.div
          variants={chipVariants}
          initial="initial"
          exit="exit"
          layout
        >
          <motion.div
            onClick={handleClick}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border font-medium',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
              'disabled:cursor-not-allowed disabled:opacity-50',
              variants[variant],
              sizes[size],
              selected && 'shadow-md',
              className
            )}
            role={onClose ? 'button' : undefined}
            aria-label={ariaLabel}
            aria-selected={selected}
            aria-disabled={disabled}
            tabIndex={disabled ? -1 : 0}
            whileHover={!disabled && !reducedMotion ? { scale: 1.05 } : undefined}
            whileTap={!disabled ? { scale: 0.95 } : undefined}
            transition={{
              duration: reducedMotion ? 0 : 0.2,
              ease: 'easeInOut',
            }}
          >
        {icon && <span className="shrink-0">{icon}</span>}
        <span>{label}</span>
        {onClose && (
          <motion.button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleClose();
            }}
            disabled={disabled}
            className="ml-1 shrink-0"
            aria-label="Remove chip"
            initial={{ opacity: 0.7 }}
            whileHover={{ opacity: 1 }}
            whileTap={{ scale: 0.9 }}
            transition={{
              duration: reducedMotion ? 0 : 0.15,
              ease: 'easeInOut',
            }}
          >
            <X size={size === 'sm' ? 12 : size === 'md' ? 14 : 16} />
          </motion.button>
          )}
        </motion.div>
      </motion.div>
      )}
    </AnimatePresence>
  );
}
