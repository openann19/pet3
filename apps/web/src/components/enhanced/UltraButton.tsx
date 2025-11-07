/**
 * Ultra Enhanced Button
 * Button with magnetic hover, elastic scale, and ripple effects
 */

import { type ReactNode, type ButtonHTMLAttributes } from 'react';
import { AnimatedView } from '@/effects/reanimated/animated-view';
import { useMagneticHover } from '@/effects/reanimated/use-magnetic-hover';
import { useShimmer } from '@/effects/reanimated/use-shimmer';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { isTruthy } from '@petspark/shared';
import { useSharedValue, useAnimatedStyle, withSpring, useCallback } from 'react-native-reanimated';
import type { AnimatedStyle } from '@/effects/reanimated/animated-view';
import { springConfigs } from '@/effects/reanimated/transitions';

export interface UltraButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  enableMagnetic?: boolean;
  enableElastic?: boolean;
  enableRipple?: boolean;
  enableGlow?: boolean;
  glowColor?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

function usePressBounce(scaleOnPress = 0.96) {
  const scale = useSharedValue(1)

  const onPressIn = useCallback(() => {
    scale.value = withSpring(scaleOnPress, springConfigs.smooth)
  }, [scale, scaleOnPress])

  const onPressOut = useCallback(() => {
    scale.value = withSpring(1, springConfigs.smooth)
  }, [scale])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  })) as AnimatedStyle

  return { onPressIn, onPressOut, animatedStyle }
}

export function UltraButton({
  children,
  enableMagnetic = true,
  enableElastic = true,
  enableRipple = true,
  enableGlow = false,
  glowColor = 'rgba(99, 102, 241, 0.5)',
  variant = 'default',
  size = 'default',
  className,
  onClick,
  ...props
}: UltraButtonProps) {
  const magnetic = useMagneticHover({
    strength: 40,
    enabled: enableMagnetic
  });

  const elastic = usePressBounce(0.96);

  const shimmer = useShimmer({
    duration: 240,
    enabled: enableGlow
  });

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (isTruthy(onClick)) {
      onClick(e);
    }
  };

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (enableMagnetic && magnetic.handleMouseMove) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      magnetic.handleMouseMove(x, y);
    }
  }, [enableMagnetic, magnetic]);

  return (
    <div
      onPointerMove={enableMagnetic ? handlePointerMove : undefined}
      onPointerLeave={enableMagnetic ? magnetic.handleMouseLeave : undefined}
      className="inline-block relative"
    >
      <AnimatedView style={magnetic.animatedStyle}>
        <AnimatedView style={elastic.animatedStyle}>
          <Button
            variant={variant}
            size={size}
            className={cn('relative overflow-hidden', className)}
            onClick={handleClick}
            {...props}
          >
            {enableGlow && (
              <AnimatedView style={shimmer.animatedStyle}>
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{ backgroundColor: glowColor }}
                />
              </AnimatedView>
            )}
            <span className="relative z-10">{children}</span>
          </Button>
        </AnimatedView>
      </AnimatedView>
    </div>
  );
}
