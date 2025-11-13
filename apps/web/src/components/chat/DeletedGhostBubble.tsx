'use client';
import { motion, useMotionValue, animate } from 'framer-motion';
import { springConfigs, motionDurations } from '@/effects/framer-motion/variants';
import { cn } from '@/lib/utils';
import { useEffect, memo } from 'react';
import { useUIConfig } from "@/hooks/use-ui-config";
import { useReducedMotion } from '@/hooks/useReducedMotion';

export interface DeletedGhostBubbleProps {
  isIncoming?: boolean;
  className?: string;
  delay?: number;
}

export function DeletedGhostBubble({
  isIncoming = false,
  className,
  delay = 0,
}: DeletedGhostBubbleProps) {
  const _uiConfig = useUIConfig();
  const reducedMotion = useReducedMotion();
  const opacity = useMotionValue(0);
  const scale = useMotionValue(0.95);

  useEffect(() => {
    if (reducedMotion) {
      opacity.set(1);
      scale.set(1);
      return;
    }
    
    const timer = setTimeout(() => {
      void animate(opacity, 1, {
        duration: motionDurations.smooth,
        ease: [0.2, 0, 0, 1],
      });
      void animate(scale, 1, {
        type: 'spring',
        damping: springConfigs.smooth.damping,
        stiffness: springConfigs.smooth.stiffness,
      });
    }, delay);

    return () => clearTimeout(timer);
  }, [delay, opacity, scale, reducedMotion]);

  return (
    <motion.div
      style={{
        opacity,
        scale,
        alignSelf: isIncoming ? ('flex-start' as const) : ('flex-end' as const),
      }}
      className={cn(
        'relative rounded-2xl p-3 max-w-[85%]',
        'bg-muted/30 border border-border/50',
        'text-muted-foreground',
        isIncoming ? 'rounded-bl-sm' : 'rounded-br-sm',
        className
      )}
    >
      <p className={cn('text-sm font-medium italic text-center', 'text-muted-foreground/70')}>
        This message was deleted
      </p>
    </motion.div>
  );
}

// Memoize to prevent unnecessary re-renders
export const MemoizedDeletedGhostBubble = memo(DeletedGhostBubble);
