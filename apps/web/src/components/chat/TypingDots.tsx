'use client';

import React, { useEffect } from 'react';
import { motion, useMotionValue, animate } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useUIConfig } from "@/hooks/use-ui-config";
import { useReducedMotion } from '@/hooks/useReducedMotion';

export interface TypingDotsProps {
  dotSize?: number;
  dotColor?: string;
  gap?: number;
  animationDuration?: number;
  className?: string;
}

const DEFAULT_DOT_SIZE = 6;
const DEFAULT_DOT_COLOR = '#aaa';
const DEFAULT_GAP = 4;
const DEFAULT_ANIMATION_DURATION = 1200;

export function TypingDots({
  dotSize = DEFAULT_DOT_SIZE,
  dotColor = DEFAULT_DOT_COLOR,
  gap = DEFAULT_GAP,
  animationDuration = DEFAULT_ANIMATION_DURATION,
  className,
}: TypingDotsProps): React.JSX.Element {
  const _uiConfig = useUIConfig();
  const reducedMotion = useReducedMotion();
  const scale1 = useMotionValue(1);
  const scale2 = useMotionValue(1);
  const scale3 = useMotionValue(1);
  const opacity1 = useMotionValue(0.5);
  const opacity2 = useMotionValue(0.5);
  const opacity3 = useMotionValue(0.5);

  useEffect(() => {
    if (reducedMotion) return;
    
    const delay2 = 150 / 1000; // Convert to seconds
    const delay3 = 300 / 1000;
    const duration = animationDuration / 1000; // Convert to seconds

    // Dot 1 animations (no delay)
    void animate(scale1, [1, 1.4, 1], {
      duration,
      repeat: Infinity,
      ease: [0.4, 0, 0.6, 1],
    });
    
    void animate(opacity1, [0.5, 1, 0.5], {
      duration,
      repeat: Infinity,
      ease: [0.4, 0, 0.6, 1],
    });

    // Dot 2 animations (150ms delay)
    setTimeout(() => {
      void animate(scale2, [1, 1.4, 1], {
        duration,
        repeat: Infinity,
        ease: [0.4, 0, 0.6, 1],
      });
      
      void animate(opacity2, [0.5, 1, 0.5], {
        duration,
        repeat: Infinity,
        ease: [0.4, 0, 0.6, 1],
      });
    }, delay2 * 1000);

    // Dot 3 animations (300ms delay)
    setTimeout(() => {
      void animate(scale3, [1, 1.4, 1], {
        duration,
        repeat: Infinity,
        ease: [0.4, 0, 0.6, 1],
      });
      
      void animate(opacity3, [0.5, 1, 0.5], {
        duration,
        repeat: Infinity,
        ease: [0.4, 0, 0.6, 1],
      });
    }, delay3 * 1000);
  }, [scale1, scale2, scale3, opacity1, opacity2, opacity3, animationDuration, reducedMotion]);

  const staticDotStyle: React.CSSProperties = {
    width: dotSize,
    height: dotSize,
    backgroundColor: dotColor,
    borderRadius: dotSize / 2,
  };

  return (
    <div className={cn('flex items-center', className)} style={{ gap }}>
      <motion.div
        style={{
          ...staticDotStyle,
          scale: scale1,
          opacity: opacity1,
        }}
        className="rounded-full"
      />
      <motion.div
        style={{
          ...staticDotStyle,
          scale: scale2,
          opacity: opacity2,
        }}
        className="rounded-full"
      />
      <motion.div
        style={{
          ...staticDotStyle,
          scale: scale3,
          opacity: opacity3,
        }}
        className="rounded-full"
      />
    </div>
  );
}
