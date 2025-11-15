/**
 * Premium Button - KRASIVO Edition (Web)
 *
 * Showcases the complete motion system: press bounce, hover lift, magnetic
 * Feels more expensive than any competitor app
 */

import { MotionView, usePressBounce, useHoverLift, useMagnetic } from '@petspark/motion';
import { cn } from '@/lib/utils';
import { getTypographyClasses } from '@/lib/typography';

interface PremiumButtonProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  magnetic?: boolean;
  disabled?: boolean;
  className?: string;
  onPress: () => void;
}

export function PremiumButton({
  label,
  variant = 'primary',
  size = 'md',
  magnetic = false,
  disabled = false,
  className = '',
  onPress,
}: PremiumButtonProps) {
  // Motion hooks - combine for premium feel
  const pressBounce = usePressBounce(0.94);
  const hoverLift = useHoverLift(size === 'lg' ? 8 : size === 'md' ? 6 : 4);
  const magneticEffect = useMagnetic(magnetic ? 80 : 0);

  // Combine all animated styles
  const combinedAnimatedStyles = [
    pressBounce.animatedStyle,
    hoverLift.animatedStyle,
    magnetic ? magneticEffect.animatedStyle : undefined,
  ].filter(Boolean);

  // Base classes for styling
  const baseClasses = cn(
    'inline-flex items-center justify-center rounded-2xl border transition-all duration-200 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:cursor-not-allowed shadow-sm hover:shadow-md',
    getTypographyClasses('body')
  );

  const sizeClasses: Record<NonNullable<PremiumButtonProps['size']>, string> = {
    sm: cn('px-4 py-2 min-h-[40px] min-w-[40px]', getTypographyClasses('bodyMuted')),
    md: 'px-5 py-3 min-h-[44px] min-w-[44px]',
    lg: cn('px-6 py-4 min-h-[48px] min-w-[48px]', getTypographyClasses('h3')),
  };

  const variantClasses: Record<NonNullable<PremiumButtonProps['variant']>, string> = {
    primary:
      'bg-primary border-primary text-primary-foreground hover:bg-primary/90 hover:border-primary/90 shadow-[0_12px_30px_rgba(255,113,91,0.25)]',
    secondary:
      'bg-secondary border-secondary text-secondary-foreground hover:bg-secondary/90 hover:border-secondary/90 shadow-[0_10px_25px_rgba(255,184,77,0.25)]',
    outline:
      'bg-transparent border-border text-foreground hover:bg-muted/60',
  };

  const disabledClasses = 'disabled:bg-muted/40 disabled:border-muted/40 disabled:text-muted-foreground/70';

  const allClasses = cn(
    baseClasses,
    sizeClasses[size],
    variantClasses[variant],
    disabledClasses,
    disabled ? 'opacity-60' : 'cursor-pointer',
    className
  );

  return (
    <button
      className={allClasses}
      onMouseDown={() => {
        if (!disabled) {
          pressBounce.onPressIn();
        }
      }}
      onMouseUp={() => {
        if (!disabled) {
          pressBounce.onPressOut();
          onPress();
        }
      }}
      onMouseEnter={hoverLift.onMouseEnter}
      onMouseLeave={hoverLift.onMouseLeave}
      onPointerMove={magnetic ? magneticEffect.onPointerMove : undefined}
      disabled={disabled}
      type="button"
    >
      <MotionView
        animatedStyle={combinedAnimatedStyles}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        {label}
      </MotionView>
    </button>
  );
}

PremiumButton.displayName = 'PremiumButton';
