import { cn } from '@/lib/utils';
import { motion, type HTMLMotionProps } from 'framer-motion';
import React from 'react';
import type { ReactNode } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { cardVariants } from '@/effects/framer-motion/variants';
import { getRadius, getShadow, getColor } from '@/lib/design-tokens';
import { createAccessibleButtonProps } from '@/utils/a11y-helpers';
import { useTheme } from '@/hooks/useTheme';
import { colorWithOpacity } from '@/hooks/useDesignTokens';

interface GlassCardProps {
  children: ReactNode;
  intensity?: 'light' | 'medium' | 'strong';
  enableHover?: boolean;
  className?: string;
  onClick?: () => void;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
}

const getIntensityClasses = (intensity: 'light' | 'medium' | 'strong'): string => {
  switch (intensity) {
    case 'light':
      return 'backdrop-blur-sm border';
    case 'medium':
      return 'backdrop-blur-md border';
    case 'strong':
      return 'backdrop-blur-xl border';
    default:
      return 'backdrop-blur-md border';
  }
};

export default function GlassCard({
  children,
  intensity = 'medium',
  enableHover = true,
  className,
  onClick,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ariaDescribedBy,
  ...props
}: GlassCardProps) {
  const reducedMotion = useReducedMotion();
  const { theme } = useTheme();
  const themeMode: 'light' | 'dark' = theme;

  // Get intensity-specific styles with design tokens
  const intensityStyles = React.useMemo(() => {
    const whiteColor = getColor('background', themeMode);
    
    switch (intensity) {
      case 'light':
        return {
          backgroundColor: colorWithOpacity(whiteColor, 0.05),
          borderColor: colorWithOpacity(whiteColor, 0.1),
        };
      case 'medium':
        return {
          backgroundColor: colorWithOpacity(whiteColor, 0.1),
          borderColor: colorWithOpacity(whiteColor, 0.2),
        };
      case 'strong':
        return {
          backgroundColor: colorWithOpacity(whiteColor, 0.2),
          borderColor: colorWithOpacity(whiteColor, 0.3),
        };
      default:
        return {
          backgroundColor: colorWithOpacity(whiteColor, 0.1),
          borderColor: colorWithOpacity(whiteColor, 0.2),
        };
    }
  }, [intensity, themeMode]);

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

  return (
    <motion.div
      {...motionProps}
      {...accessibleProps}
      className={cn(
        getIntensityClasses(intensity),
        reducedMotion ? '' : 'transition-all duration-300',
        className
      )}
      style={{
        ...intensityStyles,
        borderRadius: getRadius('3xl'),
        boxShadow: getShadow('raised'),
      }}
      {...props}
    >
      <div 
        className="relative overflow-hidden" 
        style={{ borderRadius: getRadius('3xl') }}
      >
        {children}
      </div>
    </motion.div>
  );
}
