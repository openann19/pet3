'use client';

import type { ComponentProps, MouseEvent } from 'react';
import { forwardRef, useCallback, useEffect, memo } from 'react';
import type { buttonVariants } from '@/components/ui/button';
import { Button } from '@/components/ui/button';
import type { VariantProps } from 'class-variance-authority';
import { motion, useMotionValue, animate } from 'framer-motion';
import { cn } from '@/lib/utils';
import { createLogger } from '@/lib/logger';
import { haptics } from '@/lib/haptics';
import { springConfigs, motionDurations } from '@/effects/framer-motion/variants';
import { useReducedMotion } from '@/hooks/useReducedMotion';

const logger = createLogger('EnhancedButton');

export interface EnhancedButtonProps
  extends ComponentProps<'button'>,
    VariantProps<typeof buttonVariants> {
  ripple?: boolean;
  hapticFeedback?: boolean;
  successAnimation?: boolean;
  asChild?: boolean;
}

export const EnhancedButton = forwardRef<HTMLButtonElement, EnhancedButtonProps>(
  (
    {
      ripple: _ripple = true,
      hapticFeedback = true,
      successAnimation = false,
      onClick,
      className,
      children,
      ...props
    },
    _ref
  ) => {
    const reducedMotion = useReducedMotion();
    const bounceScale = useMotionValue(1);
    const successScale = useMotionValue(1);
    const errorShake = useMotionValue(0);

    const isPromise = useCallback((value: unknown): value is Promise<unknown> => {
      return (
        value != null &&
        typeof value === 'object' &&
        'then' in value &&
        typeof (value as Promise<unknown>).then === 'function'
      );
    }, []);

    useEffect(() => {
      // Reset scales when component mounts
      successScale.set(1);
      errorShake.set(0);
      bounceScale.set(1);
    }, [successScale, errorShake, bounceScale]);

    const handleClick = useCallback(
      (e: MouseEvent<HTMLButtonElement>): void => {
        try {
          if (hapticFeedback) {
            haptics.impact('light');
          }

          // Press animation
          if (!reducedMotion) {
            void animate(bounceScale, 0.95, {
              ...springConfigs.snappy,
              duration: motionDurations.fast,
            });
          }

          if (onClick) {
            const result = onClick(e);

            if (isPromise(result)) {
              result
                .then(() => {
                  if (successAnimation) {
                    if (!reducedMotion) {
                      void animate(successScale, 1.1, {
                        ...springConfigs.bouncy,
                        duration: motionDurations.normal,
                      }).then(() => {
                        void animate(successScale, 1, {
                          ...springConfigs.smooth,
                          duration: motionDurations.smooth,
                        });
                      });
                    }
                    if (hapticFeedback) {
                      haptics.impact('medium');
                    }
                    logger.info('Button action succeeded', { successAnimation: true });
                  }
                })
                .catch((error: unknown) => {
                  const err = error instanceof Error ? error : new Error(String(error));
                  logger.error('Button promise rejected', err);
                });
            }
          }
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error));
          if (!reducedMotion) {
            // Shake animation sequence
            animate(errorShake, -5, { duration: 0.05 })
              .then(() => void animate(errorShake, 5, { duration: 0.05 }))
              .then(() => void animate(errorShake, -5, { duration: 0.05 }))
              .then(() => void animate(errorShake, 5, { duration: 0.05 }))
              .then(() => void animate(errorShake, 0, { duration: 0.05 }))
              .catch(() => {
                // Ignore animation errors
              });
          }
          if (hapticFeedback) {
            haptics.impact('heavy');
          }
          logger.error('Button action failed', err);
        } finally {
          // Release animation
          if (!reducedMotion) {
            void animate(bounceScale, 1, {
              ...springConfigs.smooth,
              duration: motionDurations.normal,
            });
          }
        }
      },
      [
        hapticFeedback,
        successAnimation,
        onClick,
        bounceScale,
        successScale,
        errorShake,
        isPromise,
        reducedMotion,
      ]
    );

    return (
      <motion.div
        style={{ scale: successScale, x: errorShake }}
        className="relative"
      >
        <motion.div
          style={{ scale: bounceScale }}
          className="relative"
        >
            <div className="relative overflow-hidden">
              <Button
                onClick={handleClick}
                className={cn(
                  'relative overflow-hidden transition-all duration-300',
                  'hover:shadow-lg hover:-translate-y-0.5',
                  'active:translate-y-0 active:shadow-md',
                  className
                )}
                {...(props as Omit<typeof props, 'aria-pressed' | 'aria-expanded'>)}
              >
                {children}
              </Button>
            </div>
        </motion.div>
      </motion.div>
    );
  }
);

EnhancedButton.displayName = 'EnhancedButton';

// Memoize to prevent unnecessary re-renders when props haven't changed
export const MemoizedEnhancedButton = memo(EnhancedButton);
