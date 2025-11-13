'use client';

import { PostDetailView } from '@/components/community/PostDetailView';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { communityService } from '@/lib/community-service';
import type { CommunityNotification } from '@/lib/community-types';
import { haptics } from '@/lib/haptics';
import { createLogger } from '@/lib/logger';
import {
  ArrowLeft,
  At,
  Bell,
  ChatCircle,
  Check,
  CheckCircle,
  Heart,
  UserPlus,
} from '@phosphor-icons/react';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { motionDurations, staggerContainerVariants, staggerItemVariants, getVariantsWithReducedMotion } from '@/effects/framer-motion/variants';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { PageTransitionWrapper } from '@/components/ui/page-transition-wrapper';
import { useCallback, useEffect, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { toast } from 'sonner';
import { ScreenErrorBoundary } from '@/components/error/ScreenErrorBoundary';
import { getTypographyClasses, getSpacingClassesFromConfig, getColorClasses } from '@/lib/design-token-utils';
import { cn } from '@/lib/utils';

const logger = createLogger('NotificationsView');

function getNotificationIcon(type: CommunityNotification['type']) {
  switch (type) {
    case 'like':
      return Heart
    case 'comment':
    case 'reply':
      return ChatCircle
    case 'follow':
      return UserPlus
    case 'mention':
      return At
    case 'moderation':
      return CheckCircle
    default:
      return Bell
  }
}

function getNotificationMessage(notification: CommunityNotification): string {
  switch (notification.type) {
    case 'like':
      return `${String(notification.actorName ?? '')} liked your post`
    case 'comment':
      return `${String(notification.actorName ?? '')} commented on your post`
    case 'reply':
      return `${String(notification.actorName ?? '')} replied to your comment`
    case 'follow':
      return `${String(notification.actorName ?? '')} started following you`
    case 'mention':
      return `${String(notification.actorName ?? '')} mentioned you`
      case 'moderation':
        return notification.content ?? 'Your content was reviewed';
      default:
        return notification.content ?? 'New notification';
  }
}

function _EmptyStateView({ filter }: { filter: 'all' | 'unread' }) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: prefersReducedMotion ? 0 : motionDurations.smooth,
        ease: 'easeOut',
      }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-4">
        <Bell size={48} className="text-muted-foreground" aria-hidden="true" />
      </div>
      <h2 className={cn(getTypographyClasses('h3'), getSpacingClassesFromConfig({ marginY: 'sm' }))}>
        {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
      </h2>
      <p className={cn(getTypographyClasses('bodySmall'), getColorClasses('mutedForeground', 'text'), 'max-w-sm')}>
        {filter === 'unread' 
          ? 'You\'re all caught up!'
          : 'When you get notifications, they\'ll appear here'}
      </p>
    </motion.div>
  )
}

function _NotificationItemView({
  notification,
  index,
  onNotificationClick
}: {
  notification: CommunityNotification
  index: number
  onNotificationClick: (notification: CommunityNotification) => void
}) {
  const prefersReducedMotion = useReducedMotion();
  const Icon = getNotificationIcon(notification.type)
  const message = getNotificationMessage(notification)

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        delay: prefersReducedMotion ? 0 : index * 0.03,
        duration: prefersReducedMotion ? 0 : motionDurations.smooth,
        ease: 'easeOut',
      }}
      onClick={() => {
        onNotificationClick(notification);
      }}
      className={`
        flex gap-3 p-3 rounded-lg cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
        ${notification.read 
          ? 'hover:bg-muted/50' 
          : 'bg-primary/5 hover:bg-primary/10 border border-primary/20'
        }
      `}
      role="button"
      tabIndex={0}
      aria-label={`Notification: ${message}`}
      onKeyDown={(e: KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onNotificationClick(notification);
        }
      }}
    >
      <Avatar
        {...(notification.actorAvatar ? { src: notification.actorAvatar } : {})}
        className="w-12 h-12"
      >
        <Icon size={20} aria-hidden="true" />
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <p className="text-sm font-medium line-clamp-2">
              {message}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
            </p>
          </div>
          {!notification.read && (
            <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1" aria-label="Unread notification" />
          )}
        </div>
      </div>
    </motion.div>
  )
}

interface NotificationsViewProps {
  onBack?: () => void;
  onPostClick?: (postId: string) => void;
  onUserClick?: (userId: string) => void;
}

function NotificationsViewContent({
  onBack,
  onPostClick,
  onUserClick,
}: NotificationsViewProps) {
  const prefersReducedMotion = useReducedMotion();
  const [notifications, setNotifications] = useState<CommunityNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  
  // Defensive data handling
  const safeNotifications = Array.isArray(notifications) ? notifications : [];

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const notifs = await communityService.getNotifications();
      setNotifications(notifs);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to load notifications', err);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  const handleMarkAsRead = async (notificationId: string) => {
    haptics.impact('light');
    try {
      await communityService.markNotificationRead(notificationId);
      setNotifications(
        notifications.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to mark notification as read', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    haptics.impact('medium');
    try {
      const unreadIds = safeNotifications.filter((n) => !n.read).map((n) => n.id);
      if (unreadIds.length > 0) {
        await Promise.all(unreadIds.map((id) => communityService.markNotificationRead(id)));
        setNotifications(safeNotifications.map((n) => ({ ...n, read: true })));
        toast.success('All notifications marked as read');
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to mark all as read', err);
      toast.error('Failed to mark all notifications as read');
    }
  };

  const handleNotificationClick = (notification: CommunityNotification) => {
    if (!notification.read) {
      void handleMarkAsRead(notification.id).catch((error) => {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error('Failed to mark notification as read', err, { notificationId: notification.id });
      });
    }

    if (notification.targetType === 'post' && notification.targetId) {
      setSelectedPostId(notification.targetId);
      if (onPostClick) {
        onPostClick(notification.targetId);
      }
    } else if (notification.targetType === 'user' && notification.targetId) {
      if (onUserClick) {
        onUserClick(notification.targetId);
      }
    }
  };


  const filteredNotifications = safeNotifications
    .filter((n) => filter === 'all' || !n.read)
    .sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });

  const unreadCount = safeNotifications.filter((n) => !n.read).length;

  return (
    <PageTransitionWrapper key="notifications-view" direction="up">
      <main aria-label="Notifications" className="flex flex-col h-full bg-background">
        {/* Header */}
        <header className={cn(
          'flex items-center border-b bg-card',
          getSpacingClassesFromConfig({ gap: 'lg', padding: 'lg' })
        )}>
          {onBack && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="rounded-full"
              aria-label="Go back to previous page"
            >
              <ArrowLeft size={20} aria-hidden="true" />
            </Button>
          )}
          <div className={cn('flex items-center flex-1', getSpacingClassesFromConfig({ gap: 'md' }))}>
            <div
              className="w-10 h-10 rounded-full bg-linear-to-br from-primary to-accent flex items-center justify-center"
              aria-hidden="true"
            >
              <Bell size={24} className="text-white" weight="fill" />
            </div>
            <div className="flex-1">
              <h1 className={cn(getTypographyClasses('h1'))}>Notifications</h1>
              {unreadCount > 0 && (
                <p className={cn(getTypographyClasses('bodySmall'), getColorClasses('mutedForeground', 'text'))}>
                  {unreadCount} {unreadCount === 1 ? 'unread' : 'unread'}
                </p>
              )}
            </div>
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  void handleMarkAllAsRead();
                }}
                className={getTypographyClasses('caption')}
                aria-label="Mark all notifications as read"
              >
                <Check size={14} className={getSpacingClassesFromConfig({ marginX: 'xs' })} aria-hidden="true" />
                Mark all read
              </Button>
            )}
          </div>
        </header>

        {/* Tabs */}
        <Tabs
          value={filter}
          onValueChange={(v) => setFilter(v as 'all' | 'unread')}
          className="border-b"
        >
          <TabsList className="w-full rounded-none">
            <TabsTrigger value="all" className="flex-1">
              All
            </TabsTrigger>
            <TabsTrigger value="unread" className="flex-1">
              Unread {unreadCount > 0 && `(${unreadCount})`}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Content */}
        <section aria-label="Notifications list" className="flex-1">
          <ScrollArea className="h-full">
            <div className={cn(
              getSpacingClassesFromConfig({ padding: 'lg', spaceY: 'sm' })
            )}>
              {loading ? (
                <div className="space-y-4" role="status" aria-live="polite" aria-label="Loading notifications">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex gap-3">
                      <Skeleton className="w-12 h-12 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredNotifications.length === 0 ? (
                <_EmptyStateView filter={filter} />
              ) : (
                <motion.ul
                  className="space-y-2"
                  role="list"
                  aria-label="Notifications list"
                  variants={getVariantsWithReducedMotion(staggerContainerVariants, prefersReducedMotion)}
                  initial="hidden"
                  animate="visible"
                >
                  <AnimatePresence mode="popLayout">
                    {filteredNotifications.map((notification, index) => (
                      <motion.li
                        key={notification.id}
                        variants={getVariantsWithReducedMotion(staggerItemVariants, prefersReducedMotion)}
                        layout
                        transition={{
                          delay: prefersReducedMotion ? 0 : index * 0.03,
                          duration: prefersReducedMotion ? 0 : motionDurations.smooth,
                        }}
                      >
                        <_NotificationItemView
                          notification={notification}
                          index={index}
                          onNotificationClick={handleNotificationClick}
                        />
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </motion.ul>
              )}
            </div>
          </ScrollArea>
        </section>

        {/* Post Detail Dialog */}
        {selectedPostId && (
          <PostDetailView
            open={Boolean(selectedPostId)}
            onOpenChange={(open) => {
              if (!open) setSelectedPostId(null);
            }}
            postId={selectedPostId}
          />
        )}
      </main>
    </PageTransitionWrapper>
  );
}

export default function NotificationsView(props: NotificationsViewProps) {
  return (
    <ScreenErrorBoundary screenName="Notifications" enableNavigation={true} enableReporting={false}>
      <NotificationsViewContent {...props} />
    </ScreenErrorBoundary>
  );
}
