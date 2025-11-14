'use client';
import { motion, type MotionValue } from 'framer-motion';

import { type ReactNode } from 'react';
import { useTypingIndicator } from './effects/useTypingIndicator';
import { useReactionTrail, type ReactionTrailParticle } from './effects/useReactionTrail';
import { useAiReplyAnimation } from './effects/use-ai-reply-animation';
import { useBubbleMoodTheme } from './effects/useBubbleMoodTheme';
import { useMessageAgeEffect } from './effects/useMessageAgeEffect';
import { useBubbleCompressionOnSpeed } from './effects/useBubbleCompressionOnSpeed';
import { useDeleteBubbleAnimation } from './effects/use-delete-bubble-animation';
import { useParticleExplosionDelete } from '@/hooks/use-particle-explosion-delete';
import { ParticleView } from '../ParticleView';
import { useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useUIConfig } from "@/hooks/use-ui-config";

export interface BubbleWrapperGodTierProps {
  children: ReactNode;
  showTyping?: boolean;
  isAIMessage?: boolean;
  messageText?: string;
  timestamp?: number | string;
  messageRate?: number;
  deleteContext?: 'self-delete' | 'admin-delete' | 'emoji-media' | 'group-chat';
  onDeleteFinish?: () => void;
  className?: string;
  enabled?: boolean;
  isDeleting?: boolean;
}

export function BubbleWrapperGodTier({
  children,
  showTyping = false,
  isAIMessage = false,
  messageText = '',
  timestamp,
  messageRate = 0,
  deleteContext = 'self-delete',
  onDeleteFinish,
  className,
  enabled = true,
  isDeleting = false,
}: BubbleWrapperGodTierProps): React.JSX.Element {
  const _uiConfig = useUIConfig();
  const typingIndicator = useTypingIndicator({
    enabled: showTyping && enabled,
  });

  const reactionTrail = useReactionTrail({
    enabled,
  });

  const aiAnimation = useAiReplyAnimation({
    enabled: isAIMessage && enabled,
  });

  const moodTheme = useBubbleMoodTheme({
    text: messageText,
    enabled,
  });

  const ageEffect = useMessageAgeEffect({
    timestamp: timestamp ?? Date.now(),
    enabled,
  });

  const compression = useBubbleCompressionOnSpeed({
    messageRate,
    enabled,
  });

  const deleteAnimationOptions: {
    context: 'self-delete' | 'admin-delete' | 'emoji-media' | 'group-chat';
    onFinish?: () => void;
  } = {
    context: deleteContext,
    ...(onDeleteFinish !== undefined ? { onFinish: onDeleteFinish } : {}),
  };
  const deleteAnimation = useDeleteBubbleAnimation(deleteAnimationOptions);

  const bubbleRef = useRef<HTMLDivElement>(null);

  const particleExplosion = useParticleExplosionDelete({
    enabled: enabled && isDeleting,
    colors:
      deleteContext === 'admin-delete'
        ? ['var(--color-error-9)', '#DC2626', '#991B1B']
        : ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A'],
    particleCount: deleteContext === 'admin-delete' ? 20 : 15,
  });

  useEffect(() => {
    if (isDeleting && bubbleRef.current) {
      deleteAnimation.triggerDelete();

      const rect = bubbleRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      particleExplosion.triggerExplosion(centerX, centerY);
    }
  }, [isDeleting, deleteAnimation, particleExplosion]);

  // Combine all animation values directly for framer-motion
  // Note: compression.scaleY and compression.marginBottom are SharedValue, not MotionValue
  // Framer Motion's style prop accepts MotionValue directly, but SharedValue needs conversion
  const combinedStyle = {
    opacity: deleteAnimation.opacity,
    scale: deleteAnimation.scale,
    scaleY: typeof compression.scaleY === 'object' && 'get' in compression.scaleY 
      ? compression.scaleY as unknown as MotionValue<number>
      : compression.scaleY,
    y: deleteAnimation.translateY,
    x: deleteAnimation.translateX,
    rotate: deleteAnimation.rotation,
    marginBottom: typeof compression.marginBottom === 'object' && 'get' in compression.marginBottom
      ? compression.marginBottom as unknown as MotionValue<number>
      : compression.marginBottom,
    height: deleteAnimation.height,
    overflow: 'hidden' as const,
  } as React.CSSProperties & {
    opacity: MotionValue<number>;
    scale: MotionValue<number>;
    scaleY: MotionValue<number>;
    y: MotionValue<number>;
    x: MotionValue<number>;
    rotate: MotionValue<number>;
    marginBottom: MotionValue<number>;
    height: MotionValue<number>;
    overflow: 'hidden';
  };

  return (
    <div className={cn('relative', className)} ref={bubbleRef}>
      <motion.div style={combinedStyle} className="relative">
        {isAIMessage && (
            <motion.div style={aiAnimation.containerStyle} className="relative">
              <motion.div
                style={aiAnimation.glowStyle}
                className="absolute inset-0 rounded-2xl pointer-events-none -z-10 bg-linear-to-r from-purple-500/20 via-pink-500/20 to-cyan-500/20 blur-xl"
              >
                <div />
              </motion.div>
              <motion.div
                style={aiAnimation.shimmerStyle}
                className="absolute inset-0 rounded-2xl pointer-events-none overflow-hidden"
              >
                <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent w-1/3" />
              </motion.div>
            </motion.div>
        )}

        <motion.div
          style={moodTheme.animatedStyle}
          className="absolute inset-0 rounded-2xl pointer-events-none -z-10"
        >
          <div />
        </motion.div>

        {showTyping ? (
          <div className="flex items-center gap-1 px-4 py-3">
            {typingIndicator.dotStyles.map((style, index) => (
              <motion.div
                key={index}
                style={style}
                className="rounded-full bg-foreground/30"
              >
                <div />
              </motion.div>
            ))}
          </div>
        ) : (
          children
        )}

        {reactionTrail.particles.map((particle: ReactionTrailParticle) => (
          <motion.div
            key={particle.id}
            style={reactionTrail.getParticleStyle(particle)}
            className="absolute pointer-events-none z-9999 text-2xl"
          >
            {particle.emoji}
          </motion.div>
        ))}
      </motion.div>

      {particleExplosion.particles.map((particle) => (
        <ParticleView
          key={particle.id}
          particle={particle}
          className="absolute pointer-events-none z-[10000] rounded-full"
        />
      ))}
    </div>
  );
}
