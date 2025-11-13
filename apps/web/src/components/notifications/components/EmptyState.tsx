/**
import { motion } from 'framer-motion';
 * Empty State Component
 *
 * Displays when there are no notifications
 */

import { useEffect, memo } from 'react';
import { motion, useMotionValue, animate } from 'framer-motion';
import { Bell } from '@phosphor-icons/react';
import { springConfigs, motionDurations } from '@/effects/framer-motion/variants';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import type { NotificationFilter } from '../types';

export interface EmptyStateProps {
  filter: NotificationFilter;
}

export function EmptyState({ filter }: EmptyStateProps): JSX.Element {
  const reducedMotion = useReducedMotion();
  const emptyOpacity = useMotionValue(0);
  const emptyScale = useMotionValue(0.9);
  const bellRotate = useMotionValue(0);
  const bellScale = useMotionValue(1);

  useEffect(() => {
    void animate(emptyOpacity, 1, {
      duration: motionDurations.smooth,
      ease: [0.2, 0, 0, 1],
    });
    void animate(emptyScale, 1, {
      type: 'spring',
      damping: springConfigs.smooth.damping,
      stiffness: springConfigs.smooth.stiffness,
    });

    if (!reducedMotion) {
      setTimeout(() => {
        void animate(bellRotate, [-10, 10, 0], {
          duration: 0.6,
          repeat: Infinity,
          ease: 'easeInOut',
        });
        void animate(bellScale, [1.1, 1], {
          type: 'spring',
          damping: springConfigs.bouncy.damping,
          stiffness: springConfigs.bouncy.stiffness,
          repeat: Infinity,
          repeatType: 'reverse',
        });
      }, 2000);
    }
  }, [emptyOpacity, emptyScale, bellRotate, bellScale, reducedMotion]);

  return (
    <motion.div
      style={{
        opacity: emptyOpacity,
        scale: emptyScale,
      }}
      className="flex flex-col items-center justify-center py-12 px-4"
    >
      <motion.div
        style={{
          rotate: bellRotate,
          scale: bellScale,
        }}
        className="mb-4"
      >
        <Bell size={48} className="text-muted-foreground" />
      </motion.div>
      <p className="text-muted-foreground mt-4 text-center text-lg font-medium">
        {filter === 'unread' && 'All caught up!'}
        {filter === 'archived' && 'No archived notifications'}
        {filter === 'all' && 'No notifications yet'}
      </p>
      <p className="text-sm text-muted-foreground/60 mt-1 text-center max-w-xs">
        {filter === 'unread' && "You've read all your notifications"}
        {filter === 'archived' && 'Archived notifications will appear here'}
        {filter === 'all' && "We'll notify you when something important happens"}
      </p>
    </motion.div>
  );
}

// Memoize to prevent unnecessary re-renders
export const MemoizedEmptyState = memo(EmptyState);
