'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, useMotionValue, animate } from 'framer-motion';
import { useStorage } from '@/hooks/use-storage';
import { Button } from '@/components/ui/button';
import { Bell, BellRinging } from '@phosphor-icons/react';
import { Badge } from '@/components/ui/badge';
import { haptics } from '@/lib/haptics';
import { NotificationCenter, type AppNotification } from './NotificationCenter';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { motionDurations } from '@/effects/framer-motion/variants';

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications] = useStorage<AppNotification[]>('app-notifications', []);
  const [hasNewNotification, setHasNewNotification] = useState(false);

  const unreadCount = useMemo(() => {
    return (notifications ?? []).filter((n) => !n.read).length;
  }, [notifications]);

  useEffect(() => {
    if (unreadCount > 0) {
      setHasNewNotification(true);
      const timer = setTimeout(() => setHasNewNotification(false), 2000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [unreadCount]);

  const handleClick = useCallback(() => {
    haptics.trigger('medium');
    setIsOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleClick}
        className="relative rounded-full w-11 h-11 hover:bg-primary/10 active:bg-primary/20 transition-colors shrink-0 touch-manipulation"
        aria-label={`Notifications${unreadCount > 0 ? ` - ${unreadCount} unread` : ''}`}
      >
        <BellIconView hasNewNotification={hasNewNotification} unreadCount={unreadCount} />

        {unreadCount > 0 && <BadgeView unreadCount={unreadCount} />}

        {unreadCount > 0 && <PulseRingView />}
      </Button>

      <NotificationCenter isOpen={isOpen} onClose={handleClose} />
    </>
  );
}

interface BellIconViewProps {
  hasNewNotification: boolean;
  unreadCount: number;
}

function BellIconView({ hasNewNotification, unreadCount }: BellIconViewProps) {
  const reducedMotion = useReducedMotion();
  const rotate = useMotionValue(0);
  const scale = useMotionValue(1);
  const opacity = useMotionValue(1);

  useEffect(() => {
    if (reducedMotion) {
      rotate.set(0);
      scale.set(1);
      opacity.set(1);
      return;
    }

    if (hasNewNotification && unreadCount > 0) {
      void animate(rotate, [-15, 15, -15, 15, 0], {
        duration: 0.75,
        ease: 'easeInOut',
      });
      void animate(scale, [1.1, 1, 1.1, 1], {
        duration: 0.6,
        ease: 'easeInOut',
      });
    } else {
      void animate(opacity, 1, { duration: 0.2 });
      void animate(scale, 1, { duration: 0.2 });
    }
  }, [hasNewNotification, unreadCount, rotate, scale, opacity, reducedMotion]);

  if (hasNewNotification && unreadCount > 0) {
    return (
      <motion.div
        style={{
          rotate,
          scale,
          opacity,
        }}
      >
        <BellRinging size={20} weight="fill" className="text-primary" />
      </motion.div>
    );
  }

  return (
    <motion.div
      style={{
        rotate,
        scale,
        opacity,
      }}
    >
      <Bell
        size={20}
        weight={unreadCount > 0 ? 'fill' : 'regular'}
        className={unreadCount > 0 ? 'text-primary' : 'text-foreground/80'}
      />
    </motion.div>
  );
}

interface BadgeViewProps {
  unreadCount: number;
}

function BadgeView({ unreadCount }: BadgeViewProps) {
  const reducedMotion = useReducedMotion();
  const scale = useMotionValue(0);
  const opacity = useMotionValue(0);

  useEffect(() => {
    if (reducedMotion) {
      scale.set(1);
      opacity.set(1);
      return;
    }
    void animate(scale, 1, { duration: 0.3 });
    void animate(opacity, 1, { duration: 0.3 });
  }, [scale, opacity, reducedMotion]);

  return (
    <motion.div
      style={{
        scale,
        opacity,
      }}
      className="absolute -top-1 -right-1"
    >
      <Badge
        variant="destructive"
        className="h-5 min-w-5 px-1 rounded-full text-xs font-bold flex items-center justify-center shadow-lg"
      >
        {unreadCount > 99 ? '99+' : unreadCount}
      </Badge>
    </motion.div>
  );
}

function PulseRingView() {
  const reducedMotion = useReducedMotion();
  const scale = useMotionValue(1);
  const opacity = useMotionValue(0.5);

  useEffect(() => {
    if (reducedMotion) {
      scale.set(1);
      opacity.set(0);
      return;
    }
    void animate(scale, [1.3, 1], {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    });
    void animate(opacity, [0, 0.5], {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    });
  }, [scale, opacity, reducedMotion]);

  return (
    <motion.div
      style={{
        scale,
        opacity,
      }}
      className="absolute inset-0 rounded-full border-2 border-primary pointer-events-none"
    />
  );
}
