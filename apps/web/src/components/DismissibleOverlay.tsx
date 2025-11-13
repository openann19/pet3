'use client';

import type { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useCallback, useRef } from 'react';
import { X } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { usePrefersReducedMotion } from '@/utils/reduced-motion';
import { motionDurations, springConfigs } from '@/effects/framer-motion/variants';
import { createLogger } from '@/lib/logger';

const logger = createLogger('DismissibleOverlay');

export interface DismissibleOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  showCloseButton?: boolean;
  closeOnEscape?: boolean;
  closeOnOutsideClick?: boolean;
  closeOnAndroidBack?: boolean;
  trapFocus?: boolean;
  className?: string;
  overlayClassName?: string;
  contentClassName?: string;
  description?: string;
}

export function DismissibleOverlay({
  isOpen,
  onClose,
  children,
  title,
  showCloseButton = true,
  closeOnEscape = true,
  closeOnOutsideClick = true,
  closeOnAndroidBack = true,
  trapFocus = true,
  className,
  overlayClassName,
  contentClassName,
  description,
}: DismissibleOverlayProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  const duration = prefersReducedMotion ? 0.1 : motionDurations.normal;

  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && closeOnEscape && isOpen) {
        onClose();
      }
    },
    [closeOnEscape, onClose, isOpen]
  );

  const handleAndroidBack = useCallback(
    (e: PopStateEvent) => {
      if (closeOnAndroidBack && isOpen) {
        e.preventDefault();
        onClose();
      }
    },
    [closeOnAndroidBack, isOpen, onClose]
  );

  const handleOutsideClick = useCallback(
    (e: MouseEvent) => {
      if (
        closeOnOutsideClick &&
        contentRef.current &&
        !contentRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    },
    [closeOnOutsideClick, onClose]
  );

  useEffect(() => {
    if (!isOpen) return;
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    try {
      // Store the previously focused element for focus restoration
      if (trapFocus && document.activeElement) {
        previousActiveElementRef.current = document.activeElement as HTMLElement;
      }

      if (closeOnEscape) {
        document.addEventListener('keydown', handleEscape);
      }

      if (closeOnAndroidBack) {
        window.history.pushState(null, '', window.location.href);
        window.addEventListener('popstate', handleAndroidBack);
      }

      if (closeOnOutsideClick) {
        document.addEventListener('mousedown', handleOutsideClick);
      }

      // Focus trap implementation
      if (trapFocus && contentRef.current) {
        const focusableSelectors = [
          'button:not([disabled])',
          '[href]',
          'input:not([disabled])',
          'select:not([disabled])',
          'textarea:not([disabled])',
          '[tabindex]:not([tabindex="-1"])',
        ].join(', ');

        const focusableElements = Array.from(
          contentRef.current.querySelectorAll<HTMLElement>(focusableSelectors)
        ).filter((el) => {
          const style = window.getComputedStyle(el);
          return style.display !== 'none' && style.visibility !== 'hidden';
        });

        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        // Focus first element
        firstElement?.focus();

        const handleTabKey = (e: KeyboardEvent) => {
          if (e.key !== 'Tab') return;

          if (e.shiftKey && document.activeElement === firstElement) {
            lastElement?.focus();
            e.preventDefault();
          } else if (!e.shiftKey && document.activeElement === lastElement) {
            firstElement?.focus();
            e.preventDefault();
          }
        };

        document.addEventListener('keydown', handleTabKey);

        return () => {
          if (typeof window !== 'undefined' && typeof document !== 'undefined') {
            try {
              document.removeEventListener('keydown', handleTabKey);
              document.removeEventListener('keydown', handleEscape);
              document.removeEventListener('mousedown', handleOutsideClick);
              window.removeEventListener('popstate', handleAndroidBack);

              // Restore focus to previously focused element
              if (previousActiveElementRef.current) {
                previousActiveElementRef.current.focus();
              }
            } catch (error) {
              const err = error instanceof Error ? error : new Error('DismissibleOverlay cleanup error');
              logger.error('DismissibleOverlay cleanup error', err);
            }
          }
        };
      }

      return () => {
        if (typeof window !== 'undefined' && typeof document !== 'undefined') {
          try {
            document.removeEventListener('keydown', handleEscape);
            document.removeEventListener('mousedown', handleOutsideClick);
            window.removeEventListener('popstate', handleAndroidBack);

            // Restore focus if not already restored
            if (previousActiveElementRef.current && !trapFocus) {
              previousActiveElementRef.current.focus();
            }
          } catch (error) {
            const err = error instanceof Error ? error : new Error('DismissibleOverlay cleanup error');
            logger.error('DismissibleOverlay cleanup error', err);
          }
        }
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error('DismissibleOverlay setup error');
      logger.error('DismissibleOverlay setup error', err);
      return undefined;
    }
  }, [
    isOpen,
    closeOnEscape,
    closeOnOutsideClick,
    closeOnAndroidBack,
    trapFocus,
    handleEscape,
    handleOutsideClick,
    handleAndroidBack,
  ]);

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  const contentVariants = {
    hidden: {
      opacity: 0,
      scale: prefersReducedMotion ? 1 : 0.95,
      y: prefersReducedMotion ? 0 : 20,
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: prefersReducedMotion
        ? { duration: 0.1 }
        : { duration, ...springConfigs.smooth },
    },
    exit: {
      opacity: 0,
      scale: prefersReducedMotion ? 1 : 0.95,
      y: prefersReducedMotion ? 0 : 20,
      transition: { duration: prefersReducedMotion ? 0.1 : duration },
    },
  };

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <div
          className={cn('fixed inset-0 z-50 flex items-center justify-center', className)}
          role="presentation"
        >
          {/* Backdrop */}
          <motion.div
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ duration: prefersReducedMotion ? 0.1 : duration }}
            className={cn(
              'absolute inset-0 bg-background/80 backdrop-blur-sm',
              overlayClassName
            )}
            aria-hidden="true"
            onClick={closeOnOutsideClick ? onClose : undefined}
            onKeyDown={(e) => {
              if (closeOnOutsideClick && e.key === 'Enter') {
                onClose();
              }
            }}
          />

          {/* Dialog Content */}
          <motion.div
            ref={contentRef}
            variants={contentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={cn(
              'relative bg-card rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden',
              contentClassName
            )}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? 'overlay-title' : undefined}
            aria-describedby={description ? 'overlay-description' : undefined}
            onKeyDown={(e) => {
              if (e.key === 'Escape' && closeOnEscape) {
                onClose();
              }
            }}
          >
            {(title != null || showCloseButton) && (
              <header className="flex items-center justify-between px-6 py-4 border-b border-border">
                {title && (
                  <h2 id="overlay-title" className="text-xl font-semibold text-foreground">
                    {title}
                  </h2>
                )}
                {showCloseButton && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="ml-auto rounded-full"
                    aria-label="Close dialog"
                    aria-keyshortcuts="Escape"
                  >
                    <X size={20} weight="bold" aria-hidden="true" />
                  </Button>
                )}
              </header>
            )}

            {description && (
              <div id="overlay-description" className="sr-only">
                {description}
              </div>
            )}

            <div className="overflow-y-auto max-h-[calc(90vh-5rem)]">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
