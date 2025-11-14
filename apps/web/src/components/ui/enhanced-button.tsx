'use client';

import type { ReactNode, ButtonHTMLAttributes, MouseEvent } from 'react';
import { useCallback, useEffect, useMemo } from 'react';
import { motion, useMotionValue, animate, useTransform } from 'framer-motion';
import { useHoverLift, useBounceOnTap } from '@/effects/framer-motion/hooks';
import { springConfigs, motionDurations } from '@/effects/framer-motion/variants';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { haptics } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import { createLogger } from '@/lib/logger';
import { getTypographyClasses } from '@/lib/typography';
import { getMinTouchTargetClasses } from '@/lib/design-token-utils';

const logger = createLogger('EnhancedButton');

export interface EnhancedButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  children: ReactNode;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  enableHoverLift?: boolean;
  enableBounceOnTap?: boolean;
  enableGlow?: boolean;
  glowColor?: string;
  loading?: boolean;
  hapticFeedback?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
}

export function EnhancedButton({
  children,
  variant = 'default',
  size = 'default',
  enableHoverLift = true,
  enableBounceOnTap = true,
  enableGlow = false,
  glowColor,
  loading = false,
  hapticFeedback = true,
  icon,
  iconPosition = 'left',
  className,
  onClick,
  disabled,
  ...props
}: EnhancedButtonProps): React.JSX.Element {
  const reducedMotion = useReducedMotion();
  const hoverLift = useHoverLift({
    scale: reducedMotion ? 1 : 1.05,
    translateY: reducedMotion ? 0 : -4,
  });
  const bounceOnTap = useBounceOnTap({
    scale: reducedMotion ? 1 : 0.96,
    hapticFeedback: false,
  });

  // Glow effect
  const glowOpacity = useMotionValue(0);
  const glowProgress = useMotionValue(0);

  // Loading spinner rotation
  const loadingRotation = useMotionValue(0);

  // Fallback motion values for when effects are disabled
  const fallbackScale = useMotionValue(1);
  const fallbackTranslateY = useMotionValue(0);

  // Combined scale and translateY for hover and tap
  const combinedScale = useTransform(
    [
      enableHoverLift ? hoverLift.scale : fallbackScale,
      enableBounceOnTap ? bounceOnTap.scale : fallbackScale,
    ],
    ([hoverScale, tapScale]: number[]) => (hoverScale ?? 1) * (tapScale ?? 1)
  );

  const combinedTranslateY = enableHoverLift ? hoverLift.translateY : fallbackTranslateY;

  // Glow animation opacity - interpolated from glowProgress
  const glowAnimatedOpacity = useTransform(glowProgress, (value) => {
    if (!enableGlow) return 0;
    // Interpolate: [0, 0.5, 1] -> [0.3, 0.6, 0.3]
    const progress = Math.max(0, Math.min(1, value));
    const opacity = progress < 0.5 
      ? 0.3 + (progress / 0.5) * 0.3 
      : 0.6 - ((progress - 0.5) / 0.5) * 0.3;
    return glowOpacity.get() * opacity;
  });

  // Loading spinner animation
  useEffect(() => {
    if (loading && !reducedMotion) {
      void animate(loadingRotation, 360, {
        duration: 1,
        ease: 'linear',
        repeat: Infinity,
        repeatType: 'loop',
      });
    } else {
      loadingRotation.set(0);
    }
  }, [loading, loadingRotation, reducedMotion]);

  // Start glow animation when enabled
  useEffect(() => {
    if (enableGlow && !reducedMotion) {
      void animate(glowProgress, 1, {
        duration: 2,
        ease: 'linear',
        repeat: Infinity,
        repeatType: 'reverse',
      });
      void animate(glowOpacity, 1, {
        type: 'spring',
        damping: springConfigs.smooth.damping,
        stiffness: springConfigs.smooth.stiffness,
      });
    } else {
      void animate(glowOpacity, 0, {
        duration: motionDurations.fast,
        ease: [0.2, 0, 0, 1],
      });
      glowProgress.set(0);
    }
  }, [enableGlow, reducedMotion, glowOpacity, glowProgress]);

  const handleClick = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      if (disabled || loading) {
        return;
      }

      try {
        if (hapticFeedback) {
          haptics.impact('light');
        }

        if (enableBounceOnTap) {
          bounceOnTap.handlePress();
        }

        // Trigger glow pulse on click
        if (enableGlow && !reducedMotion) {
          void animate(glowOpacity, 1, {
            type: 'spring',
            damping: springConfigs.bouncy.damping,
            stiffness: springConfigs.bouncy.stiffness,
          }).then(() => {
            void animate(glowOpacity, 0.6, {
              type: 'spring',
              damping: springConfigs.smooth.damping,
              stiffness: springConfigs.smooth.stiffness,
            });
          });
        }

        onClick?.(e);
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error('EnhancedButton onClick error', err, { variant, size });
      }
    },
    [
      disabled,
      loading,
      hapticFeedback,
      enableBounceOnTap,
      enableGlow,
      reducedMotion,
      bounceOnTap,
      glowOpacity,
      onClick,
      variant,
      size,
    ]
  );

  const handleMouseEnter = useCallback(() => {
    if (disabled || loading || reducedMotion) {
      return;
    }

    if (enableHoverLift) {
      hoverLift.handleEnter();
    }

    if (enableGlow) {
      void animate(glowOpacity, 1, {
        type: 'spring',
        damping: springConfigs.smooth.damping,
        stiffness: springConfigs.smooth.stiffness,
      });
    }
  }, [disabled, loading, reducedMotion, enableHoverLift, enableGlow, hoverLift, glowOpacity]);

  const handleMouseLeave = useCallback(() => {
    if (disabled || loading || reducedMotion) {
      return;
    }

    if (enableHoverLift) {
      hoverLift.handleLeave();
    }

    if (enableGlow) {
      void animate(glowOpacity, 0.3, {
        type: 'spring',
        damping: springConfigs.smooth.damping,
        stiffness: springConfigs.smooth.stiffness,
      });
    }
  }, [disabled, loading, reducedMotion, enableHoverLift, enableGlow, hoverLift, glowOpacity]);

  // Variant styles using design tokens
  const variantClasses = useMemo(() => {
    const variants = {
      default:
        'bg-(--btn-primary-bg) text-(--btn-primary-fg) shadow-lg hover:shadow-xl disabled:bg-(--btn-primary-disabled-bg) disabled:text-(--btn-primary-disabled-fg) disabled:shadow-none focus-visible:ring-2 focus-visible:ring-[var(--btn-primary-focus-ring)] focus-visible:ring-offset-2',
      destructive:
        'bg-(--btn-destructive-bg) text-(--btn-destructive-fg) shadow-lg hover:shadow-xl disabled:bg-(--btn-destructive-disabled-bg) disabled:text-(--btn-destructive-disabled-fg) disabled:shadow-none focus-visible:ring-2 focus-visible:ring-[var(--btn-destructive-focus-ring)] focus-visible:ring-offset-2',
      outline:
        'border-[1.5px] border-(--btn-outline-border) bg-(--btn-outline-bg) text-(--btn-outline-fg) shadow-sm hover:shadow-lg hover:bg-(--btn-outline-hover-bg) hover:text-(--btn-outline-hover-fg) hover:border-(--btn-outline-hover-border) disabled:bg-(--btn-outline-disabled-bg) disabled:text-(--btn-outline-disabled-fg) disabled:border-(--btn-outline-disabled-border) disabled:shadow-none focus-visible:ring-2 focus-visible:ring-[var(--btn-outline-focus-ring)] focus-visible:ring-offset-2',
      secondary:
        'bg-(--btn-secondary-bg) text-(--btn-secondary-fg) shadow-lg hover:shadow-xl disabled:bg-(--btn-secondary-disabled-bg) disabled:text-(--btn-secondary-disabled-fg) disabled:shadow-none focus-visible:ring-2 focus-visible:ring-[var(--btn-secondary-focus-ring)] focus-visible:ring-offset-2',
      ghost:
        'bg-(--btn-ghost-bg) text-(--btn-ghost-fg) hover:bg-(--btn-ghost-hover-bg) hover:text-(--btn-ghost-hover-fg) disabled:bg-(--btn-ghost-disabled-bg) disabled:text-(--btn-ghost-disabled-fg) focus-visible:ring-2 focus-visible:ring-[var(--btn-ghost-focus-ring)] focus-visible:ring-offset-2',
      link: 'text-(--btn-link-fg) underline-offset-4 hover:underline hover:text-(--btn-link-hover-fg) disabled:text-(--btn-link-disabled-fg) disabled:no-underline bg-transparent focus-visible:ring-2 focus-visible:ring-[var(--btn-link-focus-ring)] focus-visible:ring-offset-2',
    };

    return variants[variant] ?? variants.default;
  }, [variant]);

  // Size styles with typography tokens
  const sizeClasses = useMemo(() => {
    const sizes = {
      default: cn('h-11 px-4 py-2', getMinTouchTargetClasses(), getTypographyClasses('body')),
      sm: cn('h-9 px-3 py-1.5 rounded-md gap-1.5', getMinTouchTargetClasses(), getTypographyClasses('caption')),
      lg: cn('h-14 px-6 py-3 rounded-md', getMinTouchTargetClasses(), getTypographyClasses('h3')),
      icon: cn('size-11 p-0', getMinTouchTargetClasses()),
    };

    return sizes[size] ?? sizes.default;
  }, [size]);

  const isDisabled = Boolean(disabled) || Boolean(loading);

  // Determine glow color based on variant
  const resolvedGlowColor = useMemo(() => {
    if (glowColor) {
      return glowColor;
    }

    const glowColors = {
      default: 'rgba(37, 99, 235, 0.4)',
      destructive: 'rgba(220, 38, 38, 0.4)',
      outline: 'rgba(100, 116, 139, 0.3)',
      secondary: 'rgba(100, 116, 139, 0.4)',
      ghost: 'rgba(100, 116, 139, 0.2)',
      link: 'rgba(37, 99, 235, 0.3)',
    };

    return glowColors[variant] ?? glowColors.default;
  }, [glowColor, variant]);

  return (
    <motion.div
      style={{
        scale: combinedScale,
        y: combinedTranslateY,
      }}
      className="inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        type="button"
        onClick={handleClick}
        disabled={isDisabled}
        className={cn(
          'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium',
          'disabled:pointer-events-none disabled:cursor-default',
          'outline-none',
          '[&_svg]:pointer-events-none [&_svg:not([class*="size-"])]:size-5 shrink-0 [&_svg]:shrink-0',
          'relative overflow-hidden',
          variantClasses,
          sizeClasses,
          className
        )}
        aria-busy={loading}
        aria-disabled={isDisabled}
        {...props}
      >
        {enableGlow && (
          <motion.div
            className="absolute inset-0 pointer-events-none rounded-md"
            style={{
              backgroundColor: resolvedGlowColor,
              opacity: glowAnimatedOpacity,
            }}
          />
        )}

        <span className="relative z-10 flex items-center justify-center gap-2">
          {loading ? (
            <motion.div
              className="h-5 w-5 rounded-full border-2 border-current border-t-transparent"
              style={{
                rotate: loadingRotation,
              }}
              aria-hidden="true"
            />
          ) : (
            <>
              {icon && iconPosition === 'left' && <span className="shrink-0">{icon}</span>}
              {children}
              {icon && iconPosition === 'right' && <span className="shrink-0">{icon}</span>}
            </>
          )}
        </span>
      </button>
    </motion.div>
  );
}
