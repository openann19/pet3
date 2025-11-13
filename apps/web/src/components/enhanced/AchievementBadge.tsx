import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { springConfigs, motionDurations } from '@/effects/framer-motion/variants';
import { useUIConfig } from "@/hooks/use-ui-config";
import { cn } from '@/lib/utils';
import { usePrefersReducedMotion } from '@/utils/reduced-motion';

export interface AchievementBadgeProps {
  size?: number;
  color?: string;
  className?: string;
}

export function AchievementBadge({
  size = 32,
  color = 'var(--primary)',
  className = '',
}: AchievementBadgeProps) {
  const _uiConfig = useUIConfig();
  const prefersReducedMotion = usePrefersReducedMotion();

  const badgeVariants = {
    hidden: {
      scale: 0,
      opacity: 0,
    },
    visible: {
      scale: 1,
      opacity: 1,
      transition: prefersReducedMotion
        ? { duration: 0 }
        : {
            ...springConfigs.bouncy,
            duration: motionDurations.smooth,
          },
    },
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={badgeVariants}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
      }}
      className={cn('bg-primary rounded-full', className)}
    />
  );
}

// Memoize to prevent unnecessary re-renders
export const MemoizedAchievementBadge = memo(AchievementBadge);
