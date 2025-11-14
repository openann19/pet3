'use client';
import { motion, type MotionStyle } from 'framer-motion';

import { useTypingIndicator } from './effects/useTypingIndicator';
import { AnimatedView, type AnimatedStyle } from '@/hooks/use-animated-style-value';
import { cn } from '@/lib/utils';
import { useUIConfig } from "@/hooks/use-ui-config";

export interface TypingDotsProps {
  dotSize?: number;
  dotColor?: string;
  className?: string;
  enabled?: boolean;
}

export function TypingDots({
  dotSize = 6,
  dotColor = '#aaa',
  className,
  enabled = true,
}: TypingDotsProps): React.JSX.Element {
    const _uiConfig = useUIConfig();
    const { dotStyles, containerStyle } = useTypingIndicator({
        enabled,
        dotSize,
      });

  return (
    <motion.div
      style={containerStyle as MotionStyle}
      className={cn('flex items-center gap-1', className)}
    >
      {dotStyles.map((style, index) => (
        <motion.div key={index} style={style as MotionStyle} className="rounded-full">
          <div style={{ backgroundColor: dotColor }} />
        </motion.div>
      ))}
    </motion.div>
  );
}
