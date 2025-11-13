'use client';
import { motion, useMotionValue, animate } from 'framer-motion';

import { useEffect, useRef } from 'react';
import { springConfigs, motionDurations } from '@/effects/framer-motion/variants';
import { usePrefersReducedMotion } from '@/utils/reduced-motion';
import { useFeatureFlags } from '@/config/feature-flags';
import { X } from '@phosphor-icons/react';
import { useUIConfig } from "@/hooks/use-ui-config";

export interface MessagePeekProps {
  message: {
    content: string;
    senderName: string;
    timestamp: string;
    type?: string;
  };
  visible: boolean;
  onClose: () => void;
  position?: { x: number; y: number };
  triggerRef?: React.RefObject<HTMLElement>;
}

/**
 * MessagePeek Component
 *
 * Long-press preview card with magnified message content
 * Opens within 120ms, respects reduced motion
 * Manages focus: traps focus when open, returns to trigger on close
 */
export function MessagePeek({ message, visible, onClose, position, triggerRef }: MessagePeekProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const { enableMessagePeek } = useFeatureFlags();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  const scale = useMotionValue(0.9);
  const opacity = useMotionValue(0);
  const backdropOpacity = useMotionValue(0);

  useEffect(() => {
    if (!enableMessagePeek) {
      return;
    }

    if (visible) {
      // Store the previously focused element
      if (typeof document !== 'undefined') {
        previouslyFocusedRef.current = document.activeElement as HTMLElement;
      }

      const duration = prefersReducedMotion ? 0.12 : 0.18; // Convert to seconds for Framer Motion
      
      // Animate scale with spring
      void animate(scale, 1, {
        type: 'spring',
        damping: springConfigs.smooth.damping,
        stiffness: springConfigs.smooth.stiffness,
      });
      
      // Animate opacity with timing
      void animate(opacity, 1, {
        duration,
        ease: [0.2, 0, 0, 1],
      });
      
      // Animate backdrop opacity with timing
      void animate(backdropOpacity, 0.25, {
        duration,
        ease: [0.2, 0, 0, 1],
      });

      // Focus the close button after animation starts
      setTimeout(() => {
        closeButtonRef.current?.focus();
      }, duration * 1000);
    } else {
      const fastDuration = motionDurations.fast / 1000; // Convert to seconds
      
      void animate(scale, 0.9, {
        duration: fastDuration,
        ease: [0.2, 0, 0, 1],
      });
      void animate(opacity, 0, {
        duration: fastDuration,
        ease: [0.2, 0, 0, 1],
      });
      void animate(backdropOpacity, 0, {
        duration: fastDuration,
        ease: [0.2, 0, 0, 1],
      });

      // Return focus to trigger element
      if (previouslyFocusedRef.current) {
        previouslyFocusedRef.current.focus();
      } else if (triggerRef?.current) {
        triggerRef.current.focus();
      }
    }
  }, [visible, prefersReducedMotion, enableMessagePeek, scale, opacity, backdropOpacity, triggerRef]);

  useEffect(() => {
    if (!visible || !enableMessagePeek) {
      return;
    }

    const handleEscape = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        onClose();
        e.preventDefault();
      }
    };

    // Trap focus within the modal
    const handleTab = (e: KeyboardEvent): void => {
      if (e.key !== 'Tab') return;

      const dialog = closeButtonRef.current?.closest('[role="dialog"]');
      if (!dialog) return;

      const focusableElements = dialog.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0] as HTMLElement | null;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement | null;

      if (!firstElement || !lastElement) {
        return;
      }

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    if (typeof window === 'undefined') return;

    window.addEventListener('keydown', handleEscape);
    window.addEventListener('keydown', handleTab);

    return () => {
      if (typeof window === 'undefined') return;
      window.removeEventListener('keydown', handleEscape);
      window.removeEventListener('keydown', handleTab);
    };
  }, [visible, onClose, enableMessagePeek]);

  // Styles are now handled directly via motion.div style props

  if (!enableMessagePeek || !visible) {
    return null;
  }

  const cardPosition = position
    ? { left: `${position.x}px`, top: `${position.y}px`, transform: 'translate(-50%, -50%)' }
    : { left: '50%', top: '50%', transform: 'translate(-50%, -50%)' };

  return (
    <>
      <motion.div
        style={{ opacity: backdropOpacity }}
        className="fixed inset-0 bg-black z-40"
        onClick={onClose}
        aria-hidden="true"
      />
      <motion.div
        style={{ 
          ...cardPosition, 
          scale,
          opacity,
        }}
        className="fixed z-50 bg-card border border-border rounded-2xl shadow-2xl p-6 max-w-md w-[90vw]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="message-peek-title"
        aria-describedby="message-peek-content"
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <p id="message-peek-title" className="font-semibold text-sm text-foreground">
              {message.senderName}
            </p>
            <p className="text-xs text-muted-foreground">
              {message.timestamp
                ? new Date(message.timestamp).toLocaleTimeString()
                : 'Unknown time'}
            </p>
          </div>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="p-1 rounded-full hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Close message preview"
            aria-keyshortcuts="Escape"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>
        <div
          id="message-peek-content"
          className="text-base text-foreground whitespace-pre-wrap wrap-break-word"
        >
          {message.content}
        </div>
      </motion.div>
    </>
  );
}
