import { cn } from '@/lib/utils';
import { motion, type HTMLMotionProps } from 'framer-motion';
import React from 'react';
import type { ReactNode } from 'react';
import { colorWithOpacity } from '@/hooks/useDesignTokens';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { cardVariants } from '@/effects/framer-motion/variants';
import { getSpacing, getRadius, getShadow, getColor } from '@/lib/design-tokens';
import { createAccessibleButtonProps } from '@/utils/a11y-helpers';
import { useTheme } from '@/hooks/useTheme';

export type CardVariant =
  | 'glass'
  | 'gradient'
  | 'neon'
  | 'holographic'
  | 'premium'
  | 'minimal'
  | 'floating';
export type CardSize = 'sm' | 'md' | 'lg' | 'xl';

interface AdvancedCardProps {
  variant?: CardVariant;
  size?: CardSize;
  children: ReactNode;
  enableHover?: boolean;
  enableGlow?: boolean;
  glowColor?: string;
  className?: string;
  onClick?: () => void;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
}

const getSizeSpacing = (size: CardSize): string => {
  switch (size) {
    case 'sm':
      return getSpacing('4');
    case 'md':
      return getSpacing('6');
    case 'lg':
      return getSpacing('8');
    case 'xl':
      return getSpacing('10');
    default:
      return getSpacing('6');
  }
};

const getVariantClasses = (variant: CardVariant): string => {
  switch (variant) {
    case 'glass':
      return `backdrop-blur-xl ${getShadow('overlay')}`;
    case 'gradient':
      return `bg-gradient-to-br backdrop-blur-sm`;
    case 'neon':
      return `bg-background border-2 ${getShadow('glow.accent')}`;
    case 'holographic':
      return `bg-gradient-to-br backdrop-blur-md relative overflow-hidden`;
    case 'premium':
      return `bg-gradient-to-br backdrop-blur-xl ${getShadow('overlay')}`;
    case 'minimal':
      return `bg-card border`;
    case 'floating':
      return `bg-card border ${getShadow('raised')}`;
    default:
      return `bg-card border`;
  }
};

export default function AdvancedCard({
  variant = 'glass',
  size = 'md',
  children,
  enableHover = true,
  enableGlow = false,
  glowColor: _glowColor,
  className,
  onClick,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ariaDescribedBy,
  ...props
}: AdvancedCardProps) {
  const reducedMotion = useReducedMotion();
  const { theme } = useTheme();
  const themeMode: 'light' | 'dark' = theme;

  // Get glow shadow from design tokens
  const glowShadow = enableGlow 
    ? `${getShadow('glow.accent')}, ${getShadow('raised')}`
    : undefined;

  // Get variant-specific styles with design tokens
  const variantStyles = React.useMemo(() => {
    const whiteColor = getColor('background', themeMode);
    const primaryColor = getColor('primary', themeMode);
    const accentColor = getColor('accent', themeMode);
    const secondaryColor = getColor('secondary', themeMode);
    const borderColor = getColor('border', themeMode);
    
    switch (variant) {
      case 'glass':
        return {
          backgroundColor: colorWithOpacity(whiteColor, 0.1),
          borderColor: colorWithOpacity(whiteColor, 0.2),
        };
      case 'gradient':
        return {
          background: `linear-gradient(to bottom right, ${colorWithOpacity(primaryColor, 0.1)}, ${colorWithOpacity(accentColor, 0.05)}, ${colorWithOpacity(secondaryColor, 0.1)})`,
          borderColor: colorWithOpacity(whiteColor, 0.1),
        };
      case 'neon':
        return {
          borderColor: accentColor,
        };
      case 'holographic':
        return {
          background: `linear-gradient(to bottom right, ${colorWithOpacity(primaryColor, 0.2)}, ${colorWithOpacity(accentColor, 0.2)}, ${colorWithOpacity(secondaryColor, 0.2)})`,
          borderColor: colorWithOpacity(whiteColor, 0.3),
        };
      case 'premium':
        return {
          background: `linear-gradient(to bottom right, ${colorWithOpacity(whiteColor, 0.9)}, ${colorWithOpacity(whiteColor, 0.7)})`,
          borderColor: colorWithOpacity(whiteColor, 0.4),
        };
      case 'minimal':
      case 'floating':
      default:
        return {
          borderColor: borderColor,
        };
    }
  }, [variant, themeMode]);

  // Motion props
  const motionProps: Partial<HTMLMotionProps<'div'>> = reducedMotion
    ? {
        initial: { opacity: 1 },
        animate: { opacity: 1 },
      }
    : {
        variants: cardVariants,
        initial: 'hidden',
        animate: 'visible',
        whileHover: enableHover ? 'hover' : undefined,
        whileTap: enableHover ? 'tap' : undefined,
      };

  // Accessibility props if clickable
  const accessibleProps = onClick
    ? createAccessibleButtonProps({
        label: ariaLabel,
        labelledBy: ariaLabelledBy,
        describedBy: ariaDescribedBy,
        onClick,
        role: 'button',
      })
    : {};

  const paddingStyle = {
    padding: getSizeSpacing(size),
  };

  return (
    <motion.div
      {...motionProps}
      {...accessibleProps}
      className={cn(
        'rounded-2xl transition-all duration-300',
        getVariantClasses(variant),
        className
      )}
      style={{
        ...paddingStyle,
        ...variantStyles,
        ...(glowShadow ? { boxShadow: glowShadow } : {}),
        borderRadius: getRadius('xl'),
      }}
      {...props}
    >
      {variant === 'holographic' && (
        <div 
          className="absolute inset-0 opacity-30 pointer-events-none" 
          aria-hidden="true"
        />
      )}
      {children}
    </motion.div>
  );
}
