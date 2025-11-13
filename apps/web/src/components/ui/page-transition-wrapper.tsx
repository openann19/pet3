'use client';
import { motion, AnimatePresence } from 'framer-motion';

import type { ReactNode, JSX } from 'react';
import { useMemo } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useMotionTokens } from '@/hooks/useMotionTokens';
import { slideUpVariants, fadeVariants } from '@/effects/framer-motion/variants';

export interface PageTransitionWrapperProps {
  children: ReactNode;
  key?: string;
  duration?: number;
  direction?: 'up' | 'down' | 'fade';
  className?: string;
}

export function PageTransitionWrapper({
  children,
  key: transitionKey = 'default',
  duration,
  direction = 'up',
  className,
}: PageTransitionWrapperProps): JSX.Element {
  const reducedMotion = useReducedMotion();
  const tokens = useMotionTokens();
  const effectiveDuration = duration ?? (reducedMotion ? 0 : tokens.durations.smooth * 1000);

  const variants = useMemo(() => {
    if (reducedMotion) {
      return fadeVariants;
    }
    switch (direction) {
      case 'up':
        return slideUpVariants;
      case 'down':
        return slideUpVariants; // Can add slideDownVariants if needed
      case 'fade':
      default:
        return fadeVariants;
    }
  }, [direction, reducedMotion]);

  const wrapperClassName = useMemo(() => {
    const baseClasses = 'w-full h-full';
    return className ? `${baseClasses} ${className}` : baseClasses;
  }, [className]);

  if (reducedMotion) {
    return <div className={wrapperClassName}>{children}</div>;
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={transitionKey}
        variants={variants}
        initial="hidden"
        animate="visible"
        exit="exit"
        transition={{
          ...tokens.spring.smooth,
          duration: tokens.durations.smooth,
        }}
        className={wrapperClassName}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
