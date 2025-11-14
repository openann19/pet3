'use client';
import { motion, useTransform } from 'framer-motion';
import { cn } from '@/lib/utils';
import { type ReactNode, useCallback } from 'react';
import { useBubbleTilt } from '@/effects/framer-motion/hooks/use-bubble-tilt';
import { useBubbleEntry } from '@/effects/framer-motion/hooks/use-bubble-entry';
import { useEntryAnimation } from '@/effects/framer-motion/hooks/use-entry-animation';
import { TypingDotsWeb } from './TypingDotsWeb';
import { useUIConfig } from "@/hooks/use-ui-config";
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { springConfigs } from '@/effects/framer-motion/variants';

export interface WebBubbleWrapperProps {
  children: ReactNode;
  isIncoming?: boolean;
  index?: number;
  onClick?: () => void;
  onLongPress?: () => void;
  hasReaction?: boolean;
  reactionEmoji?: string;
  showTyping?: boolean;
  className?: string;
  bubbleClassName?: string;
  enable3DTilt?: boolean;
  enableSwipeReply?: boolean;
  staggerDelay?: number;
  glowOpacity?: number;
  glowIntensity?: number;
}

const DEFAULT_STAGGER_DELAY = 0.04;

export function WebBubbleWrapper({
  children,
  isIncoming = false,
  index = 0,
  onClick,
  onLongPress,
  hasReaction = false,
  reactionEmoji = '❤️',
  showTyping = false,
  className,
  bubbleClassName,
  enable3DTilt = true,
  staggerDelay = DEFAULT_STAGGER_DELAY,
  glowOpacity = 0,
  glowIntensity = 0.85,
}: WebBubbleWrapperProps) {
  const _uiConfig = useUIConfig();
  const prefersReducedMotion = useReducedMotion();
  
  const bubbleTilt = useBubbleTilt({
    enabled: enable3DTilt,
    maxTilt: 10,
  });

  const bubbleEntry = useBubbleEntry({
    index,
    staggerDelay,
    direction: isIncoming ? 'incoming' : 'outgoing',
    enabled: true,
    isNew: true,
  });

  const reactionEntry = useEntryAnimation({
    initialScale: 0,
    delay: 100,
    enabled: hasReaction,
  });

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!enable3DTilt) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      bubbleTilt.handleMove(x, y, rect.width, rect.height);
    },
    [enable3DTilt, bubbleTilt]
  );

  const handleMouseLeave = useCallback(() => {
    if (!enable3DTilt) return;
    bubbleTilt.handleLeave();
  }, [enable3DTilt, bubbleTilt]);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      if (onLongPress) {
        onLongPress();
      }
    },
    [onLongPress]
  );

  // Combine all motion values for container transform
  const rotateX = useTransform(bubbleTilt.rotateX, (val) => `${val}deg`);
  const rotateY = useTransform(bubbleTilt.rotateY, (val) => `${val}deg`);

  const glowColor = isIncoming ? 'rgba(59, 130, 246, 0.6)' : 'rgba(255, 255, 255, 0.8)';

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      onContextMenu={handleContextMenu}
      variants={bubbleEntry.variants}
      initial={bubbleEntry.initial}
      animate={bubbleEntry.animate}
      style={{
        rotateX: rotateX,
        rotateY: rotateY,
        perspective: '1000px',
      }}
      className={cn('relative', className)}
    >
      {/* Glow trail effect */}
      {glowOpacity > 0 && (
        <motion.div
          style={{
            position: 'absolute',
            inset: '-4px',
            borderRadius: 'inherit',
            background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`,
            opacity: glowOpacity * glowIntensity,
            filter: 'blur(8px)',
            pointerEvents: 'none',
            zIndex: -1,
          }}
        />
      )}

      <motion.div
        whileHover={prefersReducedMotion || !enable3DTilt ? {} : { scale: 1.02 }}
        whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
        transition={springConfigs.smooth}
        className={cn(
          'relative max-w-[85%] rounded-2xl px-4 py-2 shadow-lg transition-all duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          isIncoming
            ? 'bg-neutral-800 text-white self-start rounded-bl-sm'
            : 'bg-blue-600 text-white self-end rounded-br-sm',
          bubbleClassName
        )}
      >
        {showTyping ? (
          <TypingDotsWeb dotColor={isIncoming ? '#9ca3af' : 'var(--color-bg-overlay)'} dotSize={6} />
        ) : (
          children
        )}
      </motion.div>
      {hasReaction && (
        <motion.div
          variants={reactionEntry.variants}
          initial={reactionEntry.initial}
          animate={reactionEntry.animate}
          className="absolute -bottom-4 -right-2 text-base pointer-events-none"
        >
          {reactionEmoji}
        </motion.div>
      )}
    </motion.div>
  );
}
