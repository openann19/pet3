/**
 * Dialog Component (Web)
 * 
 * Professional Framer Motion dialog with AnimatePresence, focus trap,
 * and full accessibility support.
 * 
 * Location: apps/web/src/components/ui/dialog.tsx
 */

'use client';

import React, { type ComponentProps } from 'react';
import { useCallback, useRef } from 'react';
import type { JSX } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { motion } from 'framer-motion';

import { cn } from '@/lib/utils';
import { usePrefersReducedMotion } from '@/utils/reduced-motion';
import { haptics } from '@/lib/haptics';
import { getTypographyClasses, getSpacingClassesFromConfig } from '@/lib/typography';
import { getAriaButtonAttributes } from '@/lib/accessibility';
import { dialogVariants, dialogOverlayVariants, springConfigs, motionDurations } from '@/effects/framer-motion/variants';
import { useFocusTrap } from '@/hooks/useFocusTrap';

export interface DialogProps extends ComponentProps<typeof DialogPrimitive.Root> {
  hapticFeedback?: boolean;
}

export interface DialogContentProps extends ComponentProps<typeof DialogPrimitive.Content> {
  showCloseButton?: boolean;
  hapticFeedback?: boolean;
}

function Dialog({ hapticFeedback = true, ...props }: DialogProps): JSX.Element {
  const handleOpenChange = useCallback(
    (open: boolean): void => {
      if (hapticFeedback && open) {
        haptics.trigger('light');
      }
      props.onOpenChange?.(open);
    },
    [hapticFeedback, props]
  );

  return <DialogPrimitive.Root data-slot="dialog" {...props} onOpenChange={handleOpenChange} />;
}

function DialogTrigger({
  ...props
}: ComponentProps<typeof DialogPrimitive.Trigger>): JSX.Element {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogPortal({
  ...props
}: ComponentProps<typeof DialogPrimitive.Portal>): JSX.Element {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

function DialogClose({
  ...props
}: ComponentProps<typeof DialogPrimitive.Close>): JSX.Element {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

function DialogOverlay({
  className,
  ...props
}: ComponentProps<typeof DialogPrimitive.Overlay>): JSX.Element {
  const prefersReducedMotion = usePrefersReducedMotion();

  return (
    <DialogPrimitive.Overlay asChild data-slot="dialog-overlay" {...props}>
      <motion.div
        className={cn(
          'fixed inset-0 z-50 bg-black/50',
          className
        )}
        variants={dialogOverlayVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        transition={{
          duration: prefersReducedMotion ? 0 : motionDurations.smooth,
          ease: 'easeOut',
        }}
        style={{
          backdropFilter: 'blur(8px)',
        }}
      />
    </DialogPrimitive.Overlay>
  );
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  hapticFeedback = true,
  ...props
}: DialogContentProps): JSX.Element {
  const prefersReducedMotion = usePrefersReducedMotion();
  const dialogRef = useRef<HTMLDivElement>(null);

  // Focus trap
  useFocusTrap(dialogRef, true);

  const handleClose = useCallback((): void => {
    if (hapticFeedback) {
      haptics.trigger('light');
    }
  }, [hapticFeedback]);

  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay />
      <DialogPrimitive.Content asChild data-slot="dialog-content" role="dialog" aria-modal="true" {...props}>
        <motion.div
          ref={dialogRef}
          className={cn(
            'fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)]',
            'translate-x-[-50%] translate-y-[-50%]',
            'rounded-2xl border border-(--color-neutral-6) bg-(--color-bg-overlay) shadow-lg',
            'focus:outline-none',
            'sm:max-w-lg',
            !prefersReducedMotion && 'will-change-transform', // Performance optimization
            getSpacingClassesFromConfig({ gap: 'lg', padding: 'xl' }),
            className
          )}
          variants={dialogVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={{
            ...springConfigs.smooth,
            duration: prefersReducedMotion ? 0 : motionDurations.smooth,
          }}
        >
          {children}
          {showCloseButton && (
            <DialogPrimitive.Close asChild>
              <motion.button
                className={cn(
                  'absolute top-4 right-4 rounded-xs opacity-70 min-w-[44px] min-h-[44px]',
                  'ring-offset-background',
                  'hover:opacity-100 focus-visible:ring-2 focus-visible:ring-(--primary) focus-visible:ring-offset-2 focus-visible:ring-offset-(--background)',
                  'focus-visible:outline-none disabled:pointer-events-none',
                  'text-(--text-muted) hover:text-(--text-primary)',
                  '[&_svg]:pointer-events-none [&_svg]:shrink-0',
                  "[&_svg:not([class*='size-'])]:size-4",
                  getSpacingClassesFromConfig({ padding: 'xs' })
                )}
                onClick={handleClose}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                transition={{
                  duration: prefersReducedMotion ? 0 : motionDurations.fast,
                }}
                {...getAriaButtonAttributes({ label: 'Close dialog' })}
              >
                <X aria-hidden="true" />
                <span className="sr-only">Close</span>
              </motion.button>
            </DialogPrimitive.Close>
          )}
        </motion.div>
      </DialogPrimitive.Content>
    </DialogPortal>
  );
}

function DialogHeader({ className, ...props }: ComponentProps<'div'>): JSX.Element {
  return (
    <div
      data-slot="dialog-header"
      className={cn(
        'flex flex-col text-center sm:text-left',
        getSpacingClassesFromConfig({ gap: 'sm' }),
        className
      )}
      {...props}
    />
  );
}

function DialogFooter({ className, ...props }: ComponentProps<'div'>): JSX.Element {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        'flex flex-col-reverse sm:flex-row sm:justify-end',
        getSpacingClassesFromConfig({ gap: 'sm' }),
        className
      )}
      {...props}
    />
  );
}

function DialogTitle({
  className,
  ...props
}: ComponentProps<typeof DialogPrimitive.Title>): JSX.Element {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn(
        getTypographyClasses('h3'),
        className
      )}
      {...props}
    />
  );
}

function DialogDescription({
  className,
  ...props
}: ComponentProps<typeof DialogPrimitive.Description>): JSX.Element {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn(
        'text-(--text-muted)',
        getTypographyClasses('caption'),
        className
      )}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};
