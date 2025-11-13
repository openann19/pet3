'use client';
import { motion } from 'framer-motion';

import { useCallback } from 'react';
import { springConfigs, motionDurations } from '@/effects/framer-motion/variants';
import { haptics } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import { getSpacingClassesFromConfig, accessibilityClasses } from '@/lib/typography';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { X } from 'lucide-react';
import { useUIConfig } from "@/hooks/use-ui-config";
import { usePrefersReducedMotion } from '@/utils/reduced-motion';

export interface PremiumDrawerProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title?: string;
  description?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  className?: string;
}

const SIZE_CLASSES = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
};

export function PremiumDrawer({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  side = 'right',
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  className,
}: PremiumDrawerProps): React.JSX.Element {
  const _uiConfig = useUIConfig();
  const prefersReducedMotion = usePrefersReducedMotion();

  const getDrawerVariants = () => {
    const isHorizontal = side === 'right' || side === 'left';
    const translateValue = side === 'right' ? 100 : side === 'left' ? -100 : side === 'top' ? -100 : 100;

    return {
      hidden: {
        opacity: 0,
        x: isHorizontal ? translateValue : 0,
        y: isHorizontal ? 0 : translateValue,
      },
      visible: {
        opacity: 1,
        x: 0,
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
        x: isHorizontal ? translateValue : 0,
        y: isHorizontal ? 0 : translateValue,
        transition: prefersReducedMotion
          ? { duration: 0 }
          : {
              duration: motionDurations.normal,
              ease: [0.4, 0, 1, 1],
            },
      },
    };
  };

  const drawerVariants = getDrawerVariants();

  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (!newOpen && closeOnOverlayClick) {
        haptics.impact('light');
      }
      onOpenChange?.(newOpen);
    },
    [onOpenChange, closeOnOverlayClick]
  );

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side={side} className={cn(SIZE_CLASSES[size], className)}>
        <motion.div
          variants={drawerVariants}
          initial="hidden"
          animate={open ? 'visible' : 'hidden'}
          exit="exit"
          className="contents"
        >
          {(title ?? description) && (
            <SheetHeader>
              {title && <SheetTitle>{title}</SheetTitle>}
              {description && <SheetDescription>{description}</SheetDescription>}
            </SheetHeader>
          )}

          <div className={cn('flex-1 overflow-y-auto', getSpacingClassesFromConfig({ paddingY: 'lg' }))}>
            {children}
          </div>

          {footer && <SheetFooter>{footer}</SheetFooter>}

          {showCloseButton && (
            <button
              onClick={() => { handleOpenChange(false); }}
              className={cn(
                'absolute rounded-md opacity-70 hover:opacity-100 transition-opacity',
                'top-4 right-4 p-2',
                accessibilityClasses.focusVisible,
                accessibilityClasses.minTouch
              )}
              aria-label="Close drawer"
              type="button"
            >
              <X size={16} aria-hidden="true" />
            </button>
          )}
        </motion.div>
      </SheetContent>
    </Sheet>
  );
}
