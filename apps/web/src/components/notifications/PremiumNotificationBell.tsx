'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, useMotionValue, animate, useTransform } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useStorage } from '@/hooks/use-storage';
import { Button } from '@/components/ui/button';
import { Bell, BellRinging } from '@phosphor-icons/react';
import { Badge } from '@/components/ui/badge';
import { haptics } from '@/lib/haptics';
import { createLogger } from '@/lib/logger';
import { cn } from '@/lib/utils';
import { PremiumNotificationCenter } from './PremiumNotificationCenter';
import type { PremiumNotification } from './types';

const logger = createLogger('PremiumNotificationBell');

export function PremiumNotificationBell(): JSX.Element {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [notifications] = useStorage<PremiumNotification[]>('premium-notifications', []);
  const [hasNewNotification, setHasNewNotification] = useState<boolean>(false);
  const [lastCheckTime, setLastCheckTime] = useStorage<number>(
    'last-notification-check',
    Date.now()
  );
  const notificationTimerRef = useRef<NodeJS.Timeout | null>(null);

  const allNotifications = useMemo<PremiumNotification[]>(
    () => notifications || [],
    [notifications]
  );

  const unreadCount = useMemo<number>(
    () => allNotifications.filter((n) => !n.read && !n.archived).length,
    [allNotifications]
  );

  const urgentCount = useMemo<number>(
    () =>
      allNotifications.filter(
        (n) => !n.read && !n.archived && (n.priority === 'urgent' || n.priority === 'critical')
      ).length,
    [allNotifications]
  );

  const hasUrgent = useMemo<boolean>(() => urgentCount > 0, [urgentCount]);

  useEffect(() => {
    try {
      const newNotifs = allNotifications.filter((n) => n.timestamp > (lastCheckTime || 0));
      if (newNotifs.length > 0 && !isOpen) {
        setHasNewNotification(true);
        haptics.medium();
        logger.info('New notifications received', {
          count: newNotifs.length,
          urgentCount: newNotifs.filter((n) => n.priority === 'urgent' || n.priority === 'critical')
            .length,
        });

        if (notificationTimerRef.current) {
          clearTimeout(notificationTimerRef.current);
        }
        notificationTimerRef.current = setTimeout(() => {
          setHasNewNotification(false);
        }, 3000);

        return () => {
          if (notificationTimerRef.current) {
            clearTimeout(notificationTimerRef.current);
            notificationTimerRef.current = null;
          }
        };
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to check for new notifications');
      logger.error('Failed to check for new notifications', err);
    }
    return undefined;
  }, [allNotifications.length, lastCheckTime, isOpen, allNotifications]);

  const handleClick = useCallback((): void => {
    try {
      haptics.medium();
      setIsOpen(true);
      void setLastCheckTime(Date.now());
      setHasNewNotification(false);
      logger.info('Notification bell clicked', { unreadCount, urgentCount });
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to handle notification bell click');
      logger.error('Failed to handle notification bell click', err);
    }
  }, [setLastCheckTime, unreadCount, urgentCount]);

  const handleClose = useCallback((): void => {
    setIsOpen(false);
  }, []);

  const ariaLabel = useMemo<string>(() => {
    const parts: string[] = ['Notifications'];
    if (unreadCount > 0) {
      parts.push(`${unreadCount} unread`);
    }
    if (urgentCount > 0) {
      parts.push(`${urgentCount} urgent`);
    }
    return parts.join(' - ');
  }, [unreadCount, urgentCount]);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleClick}
        className="relative rounded-full w-11 h-11 hover:bg-primary/10 active:bg-primary/20 transition-colors shrink-0 touch-manipulation"
        aria-label={ariaLabel}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        <BellIcon
          hasNewNotification={hasNewNotification}
          unreadCount={unreadCount}
          hasUrgent={hasUrgent}
        />

        {unreadCount > 0 && <BadgeAnimation unreadCount={unreadCount} hasUrgent={hasUrgent} />}

        {unreadCount > 0 && <RippleEffect hasUrgent={hasUrgent} />}

        {hasUrgent && <UrgentGlow />}
      </Button>

      <PremiumNotificationCenter isOpen={isOpen} onClose={handleClose} />
    </>
  );
}

interface BellIconProps {
  hasNewNotification: boolean;
  unreadCount: number;
  hasUrgent: boolean;
}

function BellIcon({ hasNewNotification, unreadCount, hasUrgent }: BellIconProps): JSX.Element {
  const reducedMotion = useReducedMotion();
  const rotation = useMotionValue(0);
  const scale = useMotionValue(1);
  const opacity = useMotionValue(1);

  useEffect(() => {
    if (reducedMotion) {
      rotation.set(0);
      scale.set(1);
      return;
    }

    if (hasNewNotification && unreadCount > 0) {
      // Shake sequence
      void animate(rotation, [-20, 20, -20, 20, -15, 15, -10, 10, 0], {
        duration: 0.68,
        ease: 'easeInOut',
      });
      void animate(scale, [1.15, 1, 1.15, 1, 1.1, 1, 1.05, 1], {
        duration: 0.68,
        ease: 'easeInOut',
      });
    } else {
      void animate(rotation, 0, { duration: 0.2 });
      void animate(scale, 1, { duration: 0.2 });
    }
  }, [hasNewNotification, unreadCount, rotation, scale, reducedMotion]);

  const iconClassName = useMemo<string>(() => {
    if (hasUrgent) return 'text-destructive';
    if (unreadCount > 0) return 'text-primary';
    return 'text-foreground/80';
  }, [hasUrgent, unreadCount]);

  const rotate = useTransform(rotation, (r) => `${r}deg`);

  if (hasNewNotification && unreadCount > 0) {
    return (
      <motion.div style={{ rotate, scale, opacity }}>
        <BellRinging size={20} weight="fill" className={iconClassName} aria-hidden="true" />
      </motion.div>
    );
  }

  return (
    <motion.div style={{ rotate, scale, opacity }}>
      <Bell
        size={20}
        weight={unreadCount > 0 ? 'fill' : 'regular'}
        className={iconClassName}
        aria-hidden="true"
      />
    </motion.div>
  );
}

interface BadgeAnimationProps {
  unreadCount: number;
  hasUrgent: boolean;
}

function BadgeAnimation({ unreadCount, hasUrgent }: BadgeAnimationProps): JSX.Element {
  const reducedMotion = useReducedMotion();
  const scale = useMotionValue(0);
  const opacity = useMotionValue(0);
  const pulseScale = useMotionValue(1);

  useEffect(() => {
    if (reducedMotion) {
      scale.set(1);
      opacity.set(1);
      return;
    }
    void animate(scale, 1, { duration: 0.3 });
    void animate(opacity, 1, { duration: 0.3 });
  }, [scale, opacity, reducedMotion]);

  useEffect(() => {
    if (reducedMotion) {
      pulseScale.set(1);
      return;
    }
    if (hasUrgent) {
      void animate(pulseScale, [1.2, 1], {
        duration: 1,
        repeat: Infinity,
        ease: 'easeInOut',
      });
    } else {
      void animate(pulseScale, 1, { duration: 0.2 });
    }
  }, [hasUrgent, pulseScale, reducedMotion]);

  return (
    <motion.div style={{ scale, opacity }} className="absolute -top-1 -right-1">
      <motion.div style={{ scale: pulseScale }}>
        <Badge
          variant={hasUrgent ? 'destructive' : 'default'}
          className="h-5 min-w-5 px-1 rounded-full text-xs font-bold flex items-center justify-center shadow-lg"
          aria-label={`${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`}
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </Badge>
      </motion.div>
    </motion.div>
  );
}

interface RippleEffectProps {
  hasUrgent: boolean;
}

function RippleEffect({ hasUrgent }: RippleEffectProps): JSX.Element {
  const reducedMotion = useReducedMotion();
  const scale = useMotionValue(1);
  const opacity = useMotionValue(0.6);

  useEffect(() => {
    if (reducedMotion) {
      scale.set(1);
      opacity.set(0);
      return;
    }
    const duration = hasUrgent ? 1.5 : 2;
    void animate(scale, [1.4, 1], {
      duration,
      repeat: Infinity,
      ease: 'easeOut',
    });
    void animate(opacity, [0, 0.6], {
      duration,
      repeat: Infinity,
      ease: 'easeOut',
    });
  }, [hasUrgent, scale, opacity, reducedMotion]);

  return (
    <motion.div
      style={{ scale, opacity }}
      className={cn(
        'absolute inset-0 rounded-full border-2 pointer-events-none',
        hasUrgent ? 'border-destructive' : 'border-primary'
      )}
      aria-hidden="true"
    >
      <span className="sr-only">Ripple effect</span>
    </motion.div>
  );
}

function UrgentGlow(): JSX.Element {
  const reducedMotion = useReducedMotion();
  const shadowRadius = useMotionValue(0);
  const shadowOpacity = useMotionValue(0);

  useEffect(() => {
    if (reducedMotion) {
      shadowRadius.set(0);
      shadowOpacity.set(0);
      return;
    }
    void animate(shadowRadius, [8, 0], {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut',
    });
    void animate(shadowOpacity, [0.3, 0], {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut',
    });
  }, [shadowRadius, shadowOpacity, reducedMotion]);

  const boxShadow = useTransform(
    [shadowRadius, shadowOpacity],
    ([radius, opacity]: number[]) => `0 0 ${radius}px rgba(239, 68, 68, ${opacity})`
  );

  return (
    <motion.div
      style={{ boxShadow }}
      className="absolute inset-0 rounded-full pointer-events-none"
      aria-hidden="true"
    >
      <span className="sr-only">Urgent glow effect</span>
    </motion.div>
  );
}
