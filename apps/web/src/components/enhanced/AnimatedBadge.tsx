'use client';

import { motion, AnimatePresence } from 'framer-motion';
import React from 'react';
import type { ReactNode } from 'react';
import { springConfigs } from '@/effects/framer-motion/variants';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export interface AnimatedBadgeProps {
  children: ReactNode;
  show?: boolean;
  className?: string;
}

/**
 * Animated badge component using pure Framer Motion
 * Migrated from @petspark/motion to native Framer Motion for better performance
 */
export function AnimatedBadge({ children, show = true, className }: AnimatedBadgeProps) {
  const reducedMotion = useReducedMotion();

  const variants = {
    hidden: {
      scale: 0,
      opacity: 0,
    },
    visible: {
      scale: 1,
      opacity: 1,
      transition: reducedMotion
        ? { duration: 0.1 }
        : {
            ...springConfigs.bouncy,
            opacity: {
              ...springConfigs.smooth,
            },
          },
    },
    exit: {
      scale: 0,
      opacity: 0,
      transition: reducedMotion
        ? { duration: 0.1 }
        : springConfigs.smooth,
    },
  };

  return (
    <AnimatePresence mode="wait">
      {show && (
        <motion.div
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={variants}
          className={className}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
