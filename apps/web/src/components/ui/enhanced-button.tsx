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
  MotionView,
  usePressMotion,
} from '@petspark/motion';
import { type AnimatedStyle as ViewAnimatedStyle } from '@/effects/reanimated/animated-view';                                                                   
import { springConfigs, timingConfigs } from '@/effects/reanimated/transitions';
import { haptics } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import { createLogger } from '@/lib/logger';
import { Button, type buttonVariants } from '@/components/ui/button';
import type { VariantProps } from 'class-variance-authority';
import type { MotionValue, Transition } from '@petspark/motion';

const logger = createLogger('EnhancedButton');

const runAnimation = (
  value: MotionValue<number>,
  target: number,
  transition?: Transition
) => {
  if (transition) {
    animate(value, target, transition);
  } else {
    animate(value, target);
  }
};

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
  // Use canonical press motion hook
  const pressMotion = usePressMotion({
    scaleOnPress: 0.96,
    scaleOnHover: 1.05,
    enableHover: enableHoverLift,
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

  // Note: Press motion is handled via motionProps, keeping glow and loading animations separate

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
      animate(loadingRotation, 360, {
        duration: 1,
        ease: 'linear',
        repeat: Infinity,
        repeatType: 'loop',
      });
    } else {
      loadingRotation.set(0);
    }
  }, [loading, loadingRotation]);

  const loadingSpinnerStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${loadingRotation.get()}deg` }],
  })) as ViewAnimatedStyle;

  // Start glow animation when enabled
  useEffect(() => {
    if (enableGlow) {
      const timingTransition = withTiming(1, {
        duration: 2000,
        easing: (t) => t,
      });
      const repeatTransition = withRepeat(timingTransition, -1, true);
      animate(glowProgress, 1, repeatTransition);
      const opacityTransition = withSpring(1, springConfigs.smooth);
      animate(glowOpacity, 1, opacityTransition);
    } else {
      const opacityTransition = withTiming(0, timingConfigs.fast);
      animate(glowOpacity, 0, opacityTransition);
      glowProgress.set(0);
    }
  }, [enableGlow, glowOpacity, glowProgress]);

  const handleClick = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      if (disabled || loading) {
        return;
      }

      try {
        if (hapticFeedback) {
          haptics.impact('light');
        }

        // Trigger glow pulse on click
        if (enableGlow) {
          const sequence = withSequence(
            withSpring(1, springConfigs.bouncy),
            withSpring(0.6, springConfigs.smooth)
          );
          animate(glowOpacity, 1, sequence);
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
      enableGlow,
      glowOpacity,
      onClick,
      variant,
      size,
    ]
  );

  const handleMouseEnter = useCallback(() => {
    if (disabled || loading) {
      return;
    }

    if (enableGlow) {
      const opacityTransition = withSpring(1, springConfigs.smooth);
      animate(glowOpacity, 1, opacityTransition);
    }
  }, [disabled, loading, enableGlow, glowOpacity]);

  const handleMouseLeave = useCallback(() => {
    if (disabled || loading) {
      return;
    }

    if (enableGlow) {
      const opacityTransition = withSpring(0.3, springConfigs.smooth);
      runAnimation(glowOpacity, opacityTransition);
    }
  }, [disabled, loading, enableGlow, glowOpacity]);

  // Map variant to Button variant
  const buttonVariant: VariantProps<typeof buttonVariants>['variant'] = variant;

  const isDisabled = disabled || loading;

  // Compose core Button with enhanced features
  return (
    <MotionView
      {...(pressMotion.motionProps as any)}
      className="inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Button
        variant={buttonVariant}
        size={size}
        onClick={handleClick}
        disabled={isDisabled}
        className={cn(
          'relative overflow-hidden',
          enableGlow && 'shadow-lg',
          className
        )}
        aria-busy={loading}
        aria-disabled={isDisabled}
        {...props}
      >
        {enableGlow && (
          <MotionView
            className="absolute inset-0 pointer-events-none rounded-xl"
            style={glowOverlayStyle as React.CSSProperties}
          />
        )}

        <span className="relative z-10 flex items-center justify-center gap-2">
          {loading ? (
            <MotionView
              className="h-5 w-5 rounded-full border-2 border-current border-t-transparent"                                                                     
              style={loadingSpinnerStyle as React.CSSProperties}
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
      </Button>
    </MotionView>
  );
}
