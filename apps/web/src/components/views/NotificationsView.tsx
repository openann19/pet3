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
import { safeText } from '@/lib/safeText';
import { RouteErrorBoundary } from '@/components/error/RouteErrorBoundary';
import { useApp } from '@/contexts/AppContext';
import {
  ArrowLeft,
  At,
  Bell,
  ChatCircle,
  Check,
  CheckCircle,
  Heart,
  UserPlus,
  WifiSlash,
} from '@phosphor-icons/react';
import { formatDistanceToNow } from 'date-fns';
import { MotionView } from '@petspark/motion';
import { PageTransitionWrapper } from '@/components/ui/page-transition-wrapper';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

const logger = createLogger('NotificationsView');

// Helper function to get notification icon based on type
function getNotificationIcon(type: CommunityNotification['type']) {
  switch (type) {
    case 'like':
      return Heart;
    case 'comment':
    case 'reply':
      return ChatCircle;
    case 'follow':
      return UserPlus;
    case 'mention':
      return At;
    case 'moderation':
      return CheckCircle;
    default:
      return Bell;
  }
}

// Helper function to get sanitized notification message
function getNotificationMessage(notification: CommunityNotification): string {
  const actorName = safeText(notification.actorName);
  switch (notification.type) {
    case 'like':
      return `${actorName} liked your post`;
    case 'comment':
      return `${actorName} commented on your post`;
    case 'reply':
      return `${actorName} replied to your comment`;
    case 'follow':
      return `${actorName} started following you`;
    case 'mention':
      return `${actorName} mentioned you`;
    case 'moderation':
      return safeText(notification.content) || 'Your content was reviewed';
    default:
      return safeText(notification.content) || 'New notification';
  }
}

// Offline indicator component
function OfflineIndicator() {
  return (
    <MotionView
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-yellow-500/10 border-b border-yellow-500/20 px-4 py-2"
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-center gap-2 text-sm text-yellow-700 dark:text-yellow-300">
        <WifiSlash size={16} weight="fill" />
        <span>You're offline. Some features may not be available.</span>
      </div>
    </MotionView>
  );
}

// Empty state component
interface EmptyStateProps {
  filter: 'all' | 'unread';
}

function EmptyState({ filter }: EmptyStateProps) {
  return (
    <MotionView
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-4">
        <Bell size={48} className="text-muted-foreground" />
      </div>
      <h2 className="text-xl font-semibold mb-2">
        {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
      </h2>
      <p className="text-sm text-muted-foreground max-w-sm">
        {filter === 'unread'
          ? "You're all caught up!"
          : "When you get notifications, they'll appear here"}
      </p>
    </MotionView>
  );
}

// Notification item component
interface NotificationItemProps {
  notification: CommunityNotification;
  index: number;
  onClick: (notification: CommunityNotification) => void;
}

function NotificationItem({ notification, index, onClick }: NotificationItemProps) {
  const Icon = getNotificationIcon(notification.type);
  const message = getNotificationMessage(notification);

  return (
    <MotionView
      key={notification.id}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      onClick={() => onClick(notification)}
      role="button"
      tabIndex={0}
      aria-label={`${notification.read ? 'Read' : 'Unread'} notification: ${message}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(notification);
        }
      }}
      className={`
        flex gap-3 p-3 rounded-lg cursor-pointer transition-colors
        ${notification.read
          ? 'hover:bg-muted/50'
          : 'bg-primary/5 hover:bg-primary/10 border border-primary/20'
        }
      `}
    >
      <Avatar
        {...(notification.actorAvatar && { src: notification.actorAvatar })}
        className="w-12 h-12"
      >
        <Icon size={20} />
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <p className="text-sm font-medium line-clamp-2">{message}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {formatDistanceToNow(new Date(notification.createdAt), {
                addSuffix: true,
              })}
            </p>
          </div>
          {!notification.read && (
            <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1" />
          )}
        </div>
      </div>
    </MotionView>
  );
}

// Header component
interface HeaderProps {
  onBack?: () => void;
  unreadCount: number;
  onMarkAllRead: () => void;
}

function NotificationsHeader({ onBack, unreadCount, onMarkAllRead }: HeaderProps) {
  return (
    <header role="banner" className="flex items-center gap-4 p-4 border-b bg-card">
      {onBack && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="rounded-full"
          aria-label="Go back to previous page"
        >
          <ArrowLeft size={20} />
        </Button>
      )}
      <div className="flex items-center gap-3 flex-1">
        <div className="w-10 h-10 rounded-full bg-linear-to-br from-primary to-accent flex items-center justify-center">
          <Bell size={24} className="text-white" weight="fill" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-muted-foreground">
              {unreadCount} {unreadCount === 1 ? 'unread' : 'unread'}
            </p>
          )}
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              void onMarkAllRead();
            }}
            className="text-xs"
          >
            <Check size={14} className="mr-1" />
            Mark all read
          </Button>
        )}
      </div>
    </header>
  );
}

// Filter tabs component
interface FilterTabsProps {
  filter: 'all' | 'unread';
  onFilterChange: (filter: 'all' | 'unread') => void;
  unreadCount: number;
}

function FilterTabs({ filter, onFilterChange, unreadCount }: FilterTabsProps) {
  return (
    <Tabs
      value={filter}
      onValueChange={(v) => onFilterChange(v as 'all' | 'unread')}
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
  );
}

// Loading skeleton component
function LoadingSkeleton() {
  return (
    <div className="space-y-4">
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
  );
}

// Notifications content list component
interface NotificationsContentProps {
  loading: boolean;
  filter: 'all' | 'unread';
  filteredNotifications: CommunityNotification[];
  onNotificationClick: (notification: CommunityNotification) => void;
}

function NotificationsContent({
  loading,
  filter,
  filteredNotifications,
  onNotificationClick,
}: NotificationsContentProps) {
  if (loading) {
    return <LoadingSkeleton />;
  }

  if (filteredNotifications.length === 0) {
    return <EmptyState filter={filter} />;
  }

  return (
    <>
      {filteredNotifications.map((notification, index) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          index={index}
          onClick={onNotificationClick}
        />
      ))}
    </>
  );
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
  const { t } = useApp();
  const [notifications, setNotifications] = useState<CommunityNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadNotifications = useCallback(async () => {
    if (!isOnline) {
      logger.warn('Cannot load notifications - offline');
      return;
    }

    setLoading(true);
    try {
      const notifs = await communityService.getNotifications();
      setNotifications(notifs);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.warn('Failed to load notifications', err);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [isOnline, t]);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  const handleMarkAsRead = useCallback(async (notificationId: string) => {
    haptics.impact('light');
    try {
      await communityService.markNotificationRead(notificationId);
      setNotifications(
        notifications.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.warn('Failed to mark notification as read', err);
    }
  }, [notifications]);

  const handleMarkAllAsRead = useCallback(async () => {
    haptics.impact('medium');
    try {
      const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
      await Promise.all(unreadIds.map((id) => communityService.markNotificationRead(id)));
      setNotifications(notifications.map((n) => ({ ...n, read: true })));
      toast.success('All notifications marked as read');
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.warn('Failed to mark all as read', err);
    }
  }, [notifications]);

  const handleNotificationClick = useCallback((notification: CommunityNotification) => {
    if (!notification.read) {
      void handleMarkAsRead(notification.id).catch((error) => {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.warn('Failed to mark notification as read', err, { notificationId: notification.id });
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
  }, [handleMarkAsRead, onPostClick, onUserClick]);

  const filteredNotifications = notifications
    .filter((n) => filter === 'all' || !n.read)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <PageTransitionWrapper key="notifications-view" direction="up">
      <div className="flex flex-col h-full bg-background">
        {/* Header */}
        <NotificationsHeader
          onBack={onBack}
          unreadCount={unreadCount}
          onMarkAllRead={handleMarkAllAsRead}
        />

        {/* Tabs */}
        <FilterTabs
          filter={filter}
          onFilterChange={setFilter}
          unreadCount={unreadCount}
        />

        {/* Offline Indicator */}
        {!isOnline && <OfflineIndicator />}

        {/* Content */}
        <main role="main" aria-label="Notifications content">
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-2">
              <NotificationsContent
                loading={loading}
                filter={filter}
                filteredNotifications={filteredNotifications}
                onNotificationClick={handleNotificationClick}
              />
            </div>
          </ScrollArea>
        </main>

        {/* Post Detail Dialog */}
        {selectedPostId && (
          <PostDetailView
            open={!!selectedPostId}
            onOpenChange={(open) => {
              if (!open) setSelectedPostId(null);
            }}
            postId={selectedPostId}
          />
        )}
      </div>
    </PageTransitionWrapper>
  );
}

export default function NotificationsView(props: NotificationsViewProps) {
  return (
    <RouteErrorBoundary
      onError={(error) => {
        logger.error('NotificationsView error', error);
      }}
    >
      <NotificationsViewContent {...props} />
    </RouteErrorBoundary>
  );
}
