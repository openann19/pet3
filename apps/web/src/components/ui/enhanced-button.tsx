'use client';

import type { ReactNode, ButtonHTMLAttributes, MouseEvent } from 'react';
import { useCallback, useEffect, useMemo } from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  interpolate,
  animate,
} from '@petspark/motion';
import { AnimatedView, type AnimatedStyle as ViewAnimatedStyle } from '@/effects/reanimated/animated-view';
import { useHoverLift } from '@/effects/reanimated/use-hover-lift';
import { useBounceOnTap } from '@/effects/reanimated/use-bounce-on-tap';
import { springConfigs, timingConfigs } from '@/effects/reanimated/transitions';
import { usePrefersReducedMotion } from '@/utils/reduced-motion';
import { haptics } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import { createLogger } from '@/lib/logger';
import { getTypographyClasses } from '@/lib/typography';
import type { MotionValue, Transition } from 'framer-motion';

const logger = createLogger('EnhancedButton');

const runAnimation = (
  value: MotionValue<number>,
  animation: { target: number; transition?: Transition }
) => animate(value, animation.target, animation.transition);

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
  const reducedMotion = usePrefersReducedMotion();
  const hoverLift = useHoverLift({
    scale: reducedMotion ? 1 : 1.05,
    translateY: reducedMotion ? 0 : -4,
  });
  const bounceOnTap = useBounceOnTap({
    scale: reducedMotion ? 1 : 0.96,
    hapticFeedback: false,
  });

  // Glow effect
  const glowOpacity = useSharedValue<number>(0);
  const glowProgress = useSharedValue<number>(0);

  // Loading spinner rotation
  const loadingRotation = useSharedValue<number>(0);

  const resolvedGlowColor = useMemo(() => {
    if (glowColor) {
      return glowColor;
    }

    const glowColors: Record<NonNullable<EnhancedButtonProps['variant']>, string> = {
      default: 'rgba(255, 113, 91, 0.35)',
      destructive: 'rgba(248, 81, 73, 0.4)',
      outline: 'rgba(15, 23, 42, 0.25)',
      secondary: 'rgba(255, 184, 77, 0.35)',
      ghost: 'rgba(148, 163, 184, 0.25)',
      link: 'rgba(88, 166, 255, 0.35)',
    };

    return glowColors[variant] ?? glowColors.default;
  }, [glowColor, variant]);

  // Combined animation style
  const combinedAnimatedStyle = useAnimatedStyle(() => {
    const hoverScale = enableHoverLift ? hoverLift.scale.get() : 1;
    const tapScale = enableBounceOnTap ? bounceOnTap.scale.get() : 1;
    const hoverY = enableHoverLift ? hoverLift.translateY.get() : 0;

    return {
      transform: [{ scale: hoverScale * tapScale }, { translateY: hoverY }],
    };
  }) as ViewAnimatedStyle;

  // Glow animation style
  const glowOverlayStyle = useAnimatedStyle(() => {
    if (!enableGlow) {
      return { opacity: 0, backgroundColor: resolvedGlowColor };
    }

    const opacity = interpolate(
      glowProgress.get(),
      [0, 0.5, 1],
      [0.3, 0.6, 0.3],
      { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
    );

    return {
      opacity: glowOpacity.get() * opacity,
      backgroundColor: resolvedGlowColor,
    };
  }) as ViewAnimatedStyle;

  // Loading spinner animation
  useEffect(() => {
    if (loading) {
      const timingTransition = withTiming(360, {
        duration: 1000,
        easing: (t) => t,
      });
      const repeatTransition = withRepeat(timingTransition, -1, false);
      runAnimation(loadingRotation, repeatTransition);
    } else {
      runAnimation(loadingRotation, { target: 0, transition: { duration: 0 } });
    }
  }, [loading, loadingRotation]);

  const loadingSpinnerStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${loadingRotation.get()}deg` }],
  })) as ViewAnimatedStyle;

  // Start glow animation when enabled
  useEffect(() => {
    if (enableGlow && !reducedMotion) {
      const timingTransition = withTiming(1, {
        duration: 2000,
        easing: (t) => t,
      });
      const repeatTransition = withRepeat(timingTransition, -1, true);
      runAnimation(glowProgress, repeatTransition);
      const opacityTransition = withSpring(1, springConfigs.smooth);
      runAnimation(glowOpacity, opacityTransition);
    } else {
      const opacityTransition = withTiming(0, timingConfigs.fast);
      runAnimation(glowOpacity, opacityTransition);
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
          const sequence = withSequence(
            withSpring(1, springConfigs.bouncy),
            withSpring(0.6, springConfigs.smooth)
          );
          runAnimation(glowOpacity, sequence);
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
      const opacityTransition = withSpring(1, springConfigs.smooth);
      runAnimation(glowOpacity, opacityTransition);
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
      const opacityTransition = withSpring(0.3, springConfigs.smooth);
      runAnimation(glowOpacity, opacityTransition);
    }
  }, [disabled, loading, reducedMotion, enableHoverLift, enableGlow, hoverLift, glowOpacity]);

  // Variant styles using design tokens
  const variantClasses = useMemo(() => {
    const focusRing = 'focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-ring';
    const disabledState = 'disabled:bg-muted/40 disabled:text-muted-foreground/70 disabled:shadow-none';

    const variants: Record<NonNullable<EnhancedButtonProps['variant']>, string> = {
      default:
        cn(
          'group relative inline-flex min-h-[52px] items-center justify-center overflow-hidden rounded-2xl bg-primary px-6 py-3 text-primary-foreground shadow-[0px_8px_20px_rgba(255,113,91,0.35)] transition-transform duration-300 hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-[0px_15px_35px_rgba(255,113,91,0.35)]',
          focusRing
        ),
      destructive:
        cn('bg-destructive text-destructive-foreground shadow-lg hover:shadow-xl hover:bg-destructive/90', focusRing, 'focus-visible:ring-destructive'),
      outline: cn('border border-border bg-transparent text-foreground shadow-sm hover:bg-muted/60 hover:text-foreground', focusRing),
      secondary:
        cn('bg-secondary text-secondary-foreground shadow-lg hover:shadow-xl hover:bg-secondary/90', focusRing),
      ghost: cn('bg-transparent text-foreground hover:bg-muted/40', focusRing),
      link: cn('text-primary underline-offset-4 hover:underline bg-transparent shadow-none px-0', focusRing),
    };

    return cn(variants[variant] ?? variants.default, disabledState);
  }, [variant]);

  // Size styles with typography tokens
  const sizeClasses = useMemo(() => {
    const sizes: Record<NonNullable<EnhancedButtonProps['size']>, string> = {
      default: cn('h-11 px-4 py-2 min-h-[44px] min-w-[44px]', getTypographyClasses('body')),
      sm: cn('h-9 px-3 py-1.5 rounded-lg gap-1.5 min-h-[44px] min-w-[44px]', getTypographyClasses('bodyMuted')),
      lg: cn('h-14 px-6 py-3 rounded-xl min-h-[44px] min-w-[44px]', getTypographyClasses('h3')),
      icon: 'size-11 min-w-[44px] min-h-[44px] p-0',
    };

    return sizes[size] ?? sizes.default;
  }, [size]);

  const isDisabled = disabled || loading;

  // Determine glow color based on variant
  return (
    <AnimatedView
      style={combinedAnimatedStyle}
      className="inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        type="button"
        onClick={handleClick}
        disabled={isDisabled}
        className={cn(
          'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl font-medium',
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
          <AnimatedView
            className="absolute inset-0 pointer-events-none rounded-2xl"
            style={glowOverlayStyle}
          />
        )}

        <span className="relative z-10 flex items-center justify-center gap-2">
          {loading ? (
            <AnimatedView
              className="h-5 w-5 rounded-full border-2 border-current border-t-transparent"
              style={loadingSpinnerStyle}
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
    </AnimatedView>
  );
}
