'use client';
import { motion } from 'framer-motion';

import { useTypingPlaceholder } from '@/hooks/use-typing-placeholder';
import { useAnimatedStyleValue, type AnimatedStyle } from '@/hooks/use-animated-style-value';
import { cn } from '@/lib/utils';

export interface TypingPlaceholderProps {
  enabled?: boolean;
  isOwn?: boolean;
  className?: string;
}

export function TypingPlaceholder({
  enabled = true,
  isOwn = false,
  className,
}: TypingPlaceholderProps): React.JSX.Element {
    const { animatedStyles, containerStyle } = useTypingPlaceholder({
        enabled,
        barCount: 3,
        barWidth: 4,
        barHeight: 32,
        animationDuration: 600,
      });

  const containerStyleValue = useAnimatedStyleValue(containerStyle as AnimatedStyle);

  return (
    <motion.div
      style={containerStyleValue}
      className={cn(
        'flex items-end gap-1.5 px-3 py-2 rounded-2xl max-w-[78%]',
        isOwn
          ? 'bg-linear-to-br from-primary to-accent rounded-br-sm'
          : 'bg-card border border-border rounded-bl-sm',
        className
      )}
    >
      {animatedStyles.map((style, index) => {
        const styleValue = useAnimatedStyleValue(style as AnimatedStyle);
        return (
          <motion.div
            key={index}
            style={styleValue}
            className={cn('rounded-full', isOwn ? 'bg-white/80' : 'bg-muted-foreground/60')}
          >
            <div className="w-full h-full" />
          </motion.div>
        );
      })}
    </motion.div>
  );
}
