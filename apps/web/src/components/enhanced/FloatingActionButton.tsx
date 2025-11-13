'use client';
import { motion, useMotionValue, animate } from 'framer-motion';

import { useEffect, useCallback, useState, memo } from 'react';
import { Plus } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { haptics } from '@/lib/haptics';
import { usePrefersReducedMotion } from '@/utils/reduced-motion';
import { useUIConfig } from "@/hooks/use-ui-config";
import { springConfigs, motionDurations } from '@/effects/framer-motion/variants';
import { createLogger } from '@/lib/logger';

const logger = createLogger('FloatingActionButton');

export interface FloatingActionButtonProps {
  icon?: React.ReactNode;
  onClick?: () => void;
  className?: string;
  expanded?: boolean;
  label?: string;
}

export function FloatingActionButton({
  icon = <Plus size={24} weight="bold" />,
  onClick,
  className,
  expanded = false,
  label,
}: FloatingActionButtonProps): React.JSX.Element {
  const _uiConfig = useUIConfig();
  const prefersReducedMotion = usePrefersReducedMotion();
  const [isVisible, setIsVisible] = useState(false);
  const [hoverScale, setHoverScale] = useState(1);
  const [hoverRotate, setHoverRotate] = useState(0);

  // Entry animation
  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Shimmer animation
  const shimmerX = useMotionValue(-100);
  useEffect(() => {
    if (prefersReducedMotion) return;

    const animateShimmer = () => {
      void animate(shimmerX, 100, {
        duration: 2,
        ease: 'linear',
        onComplete: () => {
          shimmerX.set(-100);
          setTimeout(animateShimmer, 3000);
        },
      });
    };

    const timeout = setTimeout(animateShimmer, 3000);
    return () => clearTimeout(timeout);
  }, [shimmerX, prefersReducedMotion]);

  const handleClick = useCallback(() => {
    try {
      haptics.impact('medium');
      onClick?.();
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('FloatingActionButton onClick error', err);
    }
  }, [onClick]);

  const handleMouseEnter = useCallback(() => {
    if (prefersReducedMotion) return;
    setHoverScale(1.1);
    setHoverRotate(5);
  }, [prefersReducedMotion]);

  const handleMouseLeave = useCallback(() => {
    if (prefersReducedMotion) return;
    setHoverScale(1);
    setHoverRotate(0);
  }, [prefersReducedMotion]);

  const handleMouseDown = useCallback(() => {
    if (prefersReducedMotion) return;
    setHoverScale(0.95);
  }, [prefersReducedMotion]);

  const handleMouseUp = useCallback(() => {
    if (prefersReducedMotion) return;
    setHoverScale(1.1);
  }, [prefersReducedMotion]);

  const fabVariants = {
    hidden: {
      scale: 0,
      rotate: -180,
    },
    visible: {
      scale: 1,
      rotate: 0,
      transition: prefersReducedMotion
        ? { duration: 0 }
        : {
            ...springConfigs.bouncy,
            duration: motionDurations.smooth,
          },
    },
  };

  const iconVariants = {
    collapsed: { rotate: 0 },
    expanded: { rotate: 45 },
  };

  const labelVariants = {
    collapsed: { opacity: 0, width: 0 },
    expanded: { opacity: 1, width: 'auto' },
  };

  return (
    <motion.button
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      initial="hidden"
      animate={isVisible ? 'visible' : 'hidden'}
      variants={fabVariants}
      whileHover={prefersReducedMotion ? undefined : { scale: hoverScale, rotate: hoverRotate }}
      whileTap={prefersReducedMotion ? undefined : { scale: 0.95 }}
      style={{
        width: expanded ? 'auto' : 56,
        paddingLeft: expanded ? 20 : 0,
        paddingRight: expanded ? 20 : 0,
      }}
      className={cn(
        'fixed bottom-24 right-6 z-50 flex items-center gap-3 rounded-full',
        'bg-linear-to-br from-primary via-accent to-secondary',
        'text-primary-foreground shadow-2xl',
        'overflow-hidden',
        'cursor-pointer',
        'border-0',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        className
      )}
      aria-label={label ?? 'Floating action button'}
    >
      <motion.div
        variants={iconVariants}
        animate={expanded ? 'expanded' : 'collapsed'}
        transition={prefersReducedMotion ? { duration: 0 } : springConfigs.smooth}
        className="flex items-center justify-center"
        style={{ width: 56, height: 56 }}
      >
        {icon}
      </motion.div>

      {label && (
        <motion.div
          variants={labelVariants}
          animate={expanded ? 'expanded' : 'collapsed'}
          transition={prefersReducedMotion ? { duration: 0 } : { duration: motionDurations.normal }}
          className="font-semibold text-sm whitespace-nowrap"
        >
          {label}
        </motion.div>
      )}

      {!prefersReducedMotion && (
        <motion.div
          style={{ x: shimmerX }}
          className="absolute inset-0 bg-linear-to-r from-white/0 via-white/30 to-white/0 pointer-events-none"
        />
      )}
    </motion.button>
  );
}

// Memoize to prevent unnecessary re-renders
export const MemoizedFloatingActionButton = memo(FloatingActionButton);
