'use client';
import { motion, useMotionValue, animate } from 'framer-motion';
import { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useUIConfig } from "@/hooks/use-ui-config";
import { useReducedMotion } from '@/hooks/useReducedMotion';

export interface TypingDotsWebProps {
  dotSize?: number;
  dotColor?: string;
  gap?: number;
  animationDuration?: number;
  className?: string;
}

const DEFAULT_DOT_SIZE = 6;
const DEFAULT_DOT_COLOR = 'var(--color-neutral-a9)';
const DEFAULT_GAP = 4;
const DEFAULT_ANIMATION_DURATION = 1200;

export function TypingDotsWeb({
  dotSize = DEFAULT_DOT_SIZE,
  dotColor = DEFAULT_DOT_COLOR,
  gap = DEFAULT_GAP,
  animationDuration = DEFAULT_ANIMATION_DURATION,
  className,
}: TypingDotsWebProps): React.JSX.Element {
    const _uiConfig = useUIConfig();
    return (
        <div className={cn('flex items-center', className)} style={{ gap }}>
          {[0, 1, 2].map((index) => (
            <TypingDot
              key={index}
              dotSize={dotSize}
              dotColor={dotColor}
              animationDuration={animationDuration}
              delay={index * 200}
            />
          ))}
        </div>
      );
}

function TypingDot({
  dotSize,
  dotColor,
  animationDuration,
  delay,
}: {
  dotSize: number;
  dotColor: string;
  animationDuration: number;
  delay: number;
}) {
  const reducedMotion = useReducedMotion();
  const scale = useMotionValue(1);
  const opacity = useMotionValue(0.5);

  useEffect(() => {
    if (reducedMotion) return;
    
    const duration = animationDuration / 1000 / 3; // Convert to seconds and divide by 3
    
    setTimeout(() => {
      void animate(scale, [1, 1.4, 1], {
        duration: duration * 2,
        repeat: Infinity,
        ease: 'easeInOut',
      });
      void animate(opacity, [0.5, 1, 0.5], {
        duration: duration * 2,
        repeat: Infinity,
        ease: 'easeInOut',
      });
    }, delay);
  }, [delay, animationDuration, scale, opacity, reducedMotion]);

  return (
    <motion.div
      style={{
        scale,
        opacity,
        width: dotSize,
        height: dotSize,
        backgroundColor: dotColor,
      }}
      className="rounded-full"
    />
  );
}
