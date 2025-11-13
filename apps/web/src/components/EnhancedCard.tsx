import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { motion, type HTMLMotionProps } from 'framer-motion';
import React from 'react';
import type { ReactNode } from 'react';
import { useDesignTokens } from '@/hooks/useDesignTokens';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { cardVariants } from '@/effects/framer-motion/variants';
import { getShadow } from '@/lib/design-tokens';
import { createAccessibleButtonProps } from '@/utils/a11y-helpers';

interface EnhancedCardProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'glass' | 'elevated' | 'gradient';
  hover?: boolean;
  glow?: boolean;
  onClick?: () => void;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
}

const getVariantStyles = (
  variant: 'default' | 'glass' | 'elevated' | 'gradient'
): string => {
  switch (variant) {
    case 'glass':
      return 'glass-effect';
    case 'elevated':
      return 'card-elevated bg-card';
    case 'gradient':
      return 'gradient-card';
    default:
      return 'bg-card';
  }
};

export default function EnhancedCard({
  children,
  className,
  variant = 'default',
  hover = true,
  glow = false,
  onClick,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ariaDescribedBy,
  ...props
}: EnhancedCardProps) {
  const reducedMotion = useReducedMotion();
  const tokens = useDesignTokens();

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
        whileHover: hover ? 'hover' : undefined,
        whileTap: hover ? 'tap' : undefined,
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

  // Glow shadow from design tokens
  const glowShadow = glow ? getShadow('glow.primary') : undefined;

  return (
    <motion.div
      {...motionProps}
      {...accessibleProps}
      style={glowShadow ? { boxShadow: glowShadow } : undefined}
    >
      <Card
        className={cn(
          'relative overflow-hidden transition-all duration-300',
          getVariantStyles(variant),
          glow && 'glow-primary',
          className
        )}
        {...props}
      >
        {variant === 'gradient' && (
          <div 
            className="absolute inset-0 bg-linear-to-br from-white/10 via-transparent to-transparent pointer-events-none"
            aria-hidden="true"
          />
        )}
        <div className="relative z-10">{children}</div>
      </Card>
    </motion.div>
  );
}
