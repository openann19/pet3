'use client';
import { motion } from 'framer-motion';

import { useCallback } from 'react';
import { springConfigs, motionDurations } from '@/effects/framer-motion/variants';
import { haptics } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import { getSpacingClassesFromConfig, accessibilityClasses } from '@/lib/typography';
import {
  Dialog,
  DialogContent,
  DialogOverlay,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { X } from 'lucide-react';
import { useUIConfig } from "@/hooks/use-ui-config";
import { usePrefersReducedMotion } from '@/utils/reduced-motion';

export interface PremiumModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title?: string;
  description?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  variant?: 'default' | 'glass' | 'centered';
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  className?: string;
}

const SIZE_CLASSES = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-full',
};

export function PremiumModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  variant = 'default',
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  className,
}: PremiumModalProps): React.JSX.Element {
  const _uiConfig = useUIConfig();
  const prefersReducedMotion = usePrefersReducedMotion();

  const modalVariants = {
    hidden: {
      opacity: 0,
      scale: 0.95,
      y: 20,
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: prefersReducedMotion
        ? { duration: 0 }
        : {
            ...springConfigs.smooth,
            duration: motionDurations.smooth,
          },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: 20,
      transition: prefersReducedMotion
        ? { duration: 0 }
        : {
            duration: motionDurations.normal,
            ease: [0.4, 0, 1, 1],
          },
    },
  };

  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (!newOpen && closeOnOverlayClick) {
        haptics.impact('light');
      }
      onOpenChange?.(newOpen);
    },
    [onOpenChange, closeOnOverlayClick]
  );

  const variants = {
    default: 'bg-background',
    glass: 'glass-card backdrop-blur-xl bg-background/80',
    centered: 'bg-background',
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogOverlay className="backdrop-blur-sm" />
      <DialogContent
        className={cn('p-0 overflow-hidden', variants[variant], SIZE_CLASSES[size], className)}
      >
        <motion.div
          variants={modalVariants}
          initial="hidden"
          animate={open ? 'visible' : 'hidden'}
          exit="exit"
          className="contents"
        >
          {((title ?? false) || (description ?? false)) && (
            <DialogHeader className={cn(
              getSpacingClassesFromConfig({ paddingX: 'xl' }),
              'pt-6 pb-4'
            )}>
              {title && <DialogTitle>{title}</DialogTitle>}
              {description && <DialogDescription>{description}</DialogDescription>}
            </DialogHeader>
          )}

          <div className={cn(
            getSpacingClassesFromConfig({ paddingX: 'xl', paddingY: 'lg' })
          )}>
            {children}
          </div>

          {footer && (
            <DialogFooter className={cn(
              'border-t',
              getSpacingClassesFromConfig({ paddingX: 'xl' }),
              'pb-6 pt-4'
            )}>
              {footer}
            </DialogFooter>
          )}

          {showCloseButton && (
            <button
              onClick={() => { handleOpenChange(false); }}
              className={cn(
                'absolute top-4 right-4 rounded-md opacity-70 hover:opacity-100 transition-opacity',
                getSpacingClassesFromConfig({ padding: 'xs' }),
                accessibilityClasses.focusVisible,
                accessibilityClasses.minTouch
              )}
              aria-label="Close dialog"
              type="button"
            >
              <X size={16} aria-hidden="true" />
            </button>
          )}
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
