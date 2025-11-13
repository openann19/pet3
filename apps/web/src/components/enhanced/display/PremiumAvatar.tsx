'use client';

import { motion } from 'framer-motion';
import React, { useCallback } from 'react';
import { haptics } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { usePrefersReducedMotion } from '@/utils/reduced-motion';
import { getSpacing } from '@/lib/design-tokens';
import { springConfigs } from '@/effects/framer-motion/variants';

export type AvatarStatus = 'online' | 'offline' | 'away' | 'busy';

export interface PremiumAvatarProps {
  src?: string;
  alt?: string;
  fallback?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  status?: AvatarStatus;
  badge?: number | string;
  variant?: 'default' | 'ring' | 'glow';
  onClick?: () => void;
  className?: string;
  'aria-label'?: string;
}

const SIZE_CONFIG = {
  sm: { size: 32, ring: 2, status: 8 },
  md: { size: 48, ring: 3, status: 10 },
  lg: { size: 64, ring: 4, status: 12 },
  xl: { size: 96, ring: 5, status: 16 },
} as const;

const STATUS_COLORS: Record<AvatarStatus, string> = {
  online: 'bg-(--success)',
  offline: 'bg-(--text-muted)',
  away: 'bg-(--warning)',
  busy: 'bg-(--danger)',
};

export function PremiumAvatar({
  src,
  alt,
  fallback,
  size = 'md',
  status,
  badge,
  variant = 'default',
  onClick,
  className,
  'aria-label': ariaLabel,
}: PremiumAvatarProps): React.JSX.Element {
  const prefersReducedMotion = usePrefersReducedMotion();

  const handleClick = useCallback(() => {
    if (onClick) {
      haptics.impact('light');
      onClick();
    }
  }, [onClick]);

  const handleLongPress = useCallback(() => {
    haptics.impact('medium');
  }, []);

  const config = SIZE_CONFIG[size];

  const avatarVariants = {
    rest: {
      scale: 1,
    },
    hover: {
      scale: prefersReducedMotion ? 1 : 1.05,
      transition: prefersReducedMotion ? { duration: 0 } : springConfigs.smooth,
    },
    tap: {
      scale: 0.98,
      transition: { duration: 0.1 },
    },
  };

  const glowVariants = {
    rest: {
      opacity: 0,
    },
    hover: {
      opacity: prefersReducedMotion ? 0 : 1,
      transition: prefersReducedMotion ? { duration: 0 } : springConfigs.smooth,
    },
  };

  return (
    <motion.div
      className={cn('relative inline-block', className)}
      onClick={handleClick}
      onContextMenu={handleLongPress}
      role={onClick ? 'button' : 'img'}
      aria-label={ariaLabel ?? alt}
      tabIndex={onClick ? 0 : undefined}
      whileHover="hover"
      whileTap="tap"
      initial="rest"
      animate="rest"
      variants={avatarVariants}
    >
      {variant === 'ring' && (
        <div
          className="absolute inset-0 rounded-full border-2 border-(--primary)"
          style={{
            width: config.size + config.ring * 2,
            height: config.size + config.ring * 2,
            top: -config.ring,
            left: -config.ring,
          }}
          aria-hidden="true"
        />
      )}

      {variant === 'glow' && (
        <motion.div
          variants={glowVariants}
          initial="rest"
          animate="rest"
          whileHover="hover"
          style={{
            position: 'absolute',
            width: config.size + 8,
            height: config.size + 8,
            top: -4,
            left: -4,
            borderRadius: '50%',
          }}
          className="bg-(--primary)/30 blur-md pointer-events-none"
          aria-hidden="true"
        />
      )}

      <Avatar
        className={cn(
          'relative overflow-hidden shadow-lg',
          onClick && cn(
            'cursor-pointer',
            prefersReducedMotion ? '' : 'transition-shadow duration-200 hover:shadow-xl'
          )
        )}
        style={{
          width: config.size,
          height: config.size,
        }}
      >
        <AvatarImage src={src} alt={alt} />
        <AvatarFallback className="bg-(--surface) text-(--text-muted) font-semibold">
          {fallback ?? '?'}
        </AvatarFallback>
      </Avatar>

      {status && (
        <div
          className={cn(
            'absolute bottom-0 right-0 rounded-full border-2 border-(--background)',
            STATUS_COLORS[status]
          )}
          style={{
            width: config.status,
            height: config.status,
            minWidth: getSpacing('2'),
            minHeight: getSpacing('2'),
          }}
        />
      )}

      {badge !== undefined && (
        <div 
          className="absolute -top-1 -right-1 flex items-center justify-center px-1 bg-(--danger) text-(--primary-foreground) text-xs font-bold rounded-full border-2 border-(--background) shadow-lg"
          style={{ minWidth: getSpacing('5'), minHeight: getSpacing('5') }}
        >
          {typeof badge === 'number' && badge > 99 ? '99+' : badge}
        </div>
      )}
    </motion.div>
  );
}
