'use client';
import { motion, useMotionValue, animate } from 'framer-motion';
import { useEffect, useMemo, memo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { TypingUser } from '@/lib/chat-types';
import { motionDurations } from '@/effects/framer-motion/variants';
import { useUIConfig } from "@/hooks/use-ui-config";
import { usePrefersReducedMotion } from '@/utils/reduced-motion';

export interface TypingIndicatorProps {
  readonly users: readonly TypingUser[];
}

interface TypingDotProps {
  index: number;
}

function TypingDot({ index }: TypingDotProps): JSX.Element {
  const _uiConfig = useUIConfig();
  const prefersReducedMotion = usePrefersReducedMotion();
  const opacity = useMotionValue(0.3);
  const translateY = useMotionValue(0);

  useEffect(() => {
    if (prefersReducedMotion) return;
    
    const delay = index * 200;

    setTimeout(() => {
      void animate(opacity, [0.3, 1, 0.3], {
        duration: 0.6,
        repeat: Infinity,
        ease: 'easeInOut',
      });
      void animate(translateY, [0, -3, 0], {
        duration: 0.6,
        repeat: Infinity,
        ease: 'easeInOut',
      });
    }, delay);
  }, [index, opacity, translateY, prefersReducedMotion]);

  return (
    <motion.div
      style={{
        opacity,
        y: translateY,
      }}
      className="w-1 h-1 bg-primary rounded-full"
    />
  );
}

export default function TypingIndicator({ users }: TypingIndicatorProps): JSX.Element | null {
  if (users.length === 0) return null;

  const prefersReducedMotion = usePrefersReducedMotion();
  const displayUsers = useMemo(() => users.slice(0, 3), [users]);
  const containerOpacity = useMotionValue(0);
  const containerTranslateY = useMotionValue(-5);

  useEffect(() => {
    if (prefersReducedMotion) {
      containerOpacity.set(1);
      containerTranslateY.set(0);
      return;
    }
    
    void animate(containerOpacity, 1, {
      duration: motionDurations.smooth,
      ease: [0.2, 0, 0, 1],
    });
    void animate(containerTranslateY, 0, {
      duration: motionDurations.smooth,
      ease: [0.2, 0, 0, 1],
    });
  }, [containerOpacity, containerTranslateY, prefersReducedMotion]);

  const typingText = useMemo(() => {
    if (users.length === 1) {
      const userName = users[0]?.userName?.trim();
      return `${userName ?? 'Someone'} is typing`;
    }
    if (users.length === 2) {
      const userName1 = users[0]?.userName?.trim();
      const userName2 = users[1]?.userName?.trim();
      return `${userName1 ?? 'Someone'} and ${userName2 ?? 'Someone'} are typing`;
    }
    const firstName = users[0]?.userName?.trim();
    return `${firstName ?? 'Someone'} and ${users.length - 1} others are typing`;
  }, [users]);

  return (
    <motion.div
      style={{
        opacity: containerOpacity,
        y: containerTranslateY,
      }}
      className="flex items-center gap-2"
      role="status"
      aria-live="polite"
      aria-label={typingText}
    >
      <div className="flex -space-x-2">
        {displayUsers.map((user) => (
          <Avatar key={user.userId} className="w-4 h-4 ring-1 ring-background">
            <AvatarImage src={(user as { userAvatar?: string }).userAvatar} alt={user.userName} />
            <AvatarFallback className="text-[8px]">{user.userName?.[0] ?? '?'}</AvatarFallback>
          </Avatar>
        ))}
      </div>

      <div className="flex items-center gap-1 text-xs text-primary">
        <span>{typingText}</span>
        <div className="flex gap-0.5" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <TypingDot key={i} index={i} />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// Memoize to prevent unnecessary re-renders
export const MemoizedTypingIndicator = memo(TypingIndicator);
