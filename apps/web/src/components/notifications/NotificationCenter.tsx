import { useState, useEffect } from 'react'
import { useStorage } from '@/hooks/useStorage'
import { AnimatedView } from '@/effects/reanimated/animated-view'
import { useAnimatePresence } from '@/effects/reanimated/use-animate-presence'
import { useEntryAnimation } from '@/effects/reanimated/use-entry-animation'
import { useHoverLift } from '@/effects/reanimated/use-hover-lift'
import { useSharedValue, useAnimatedStyle, withSpring, withTiming, withRepeat, withSequence, Easing } from 'react-native-reanimated'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import {
  Bell,
  BellRinging,
  Heart,
  ChatCircle,
  CheckCircle,
  Info,
  Check,
  Trash,
  DotsThreeVertical,
  Camera,
  ShieldCheck
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { haptics } from '@/lib/haptics'
import { formatDistanceToNow } from 'date-fns'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'

export interface AppNotification {
  id: string
  type: 'match' | 'message' | 'like' | 'verification' | 'story' | 'system' | 'moderation'
  title: string
  message: string
  timestamp: number
  read: boolean
  priority: 'low' | 'normal' | 'high' | 'urgent'
  actionUrl?: string
  actionLabel?: string
  imageUrl?: string
  metadata?: {
    petName?: string
    userName?: string
    matchId?: string
    messageId?: string
    count?: number
  }
}

interface NotificationCenterProps {
  isOpen: boolean
  onClose: () => void
}

export function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const [notifications, setNotifications] = useStorage<AppNotification[]>('app-notifications', [])
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const unreadCount = (notifications || []).filter(n => !n.read).length

  const filteredNotifications = (notifications || [])
    .filter(n => filter === 'all' || !n.read)
    .filter(n => selectedCategory === 'all' || n.type === selectedCategory)
    .sort((a, b) => b.timestamp - a.timestamp)

  const markAsRead = (id: string) => {
    haptics.trigger('light')
    setNotifications(current =>
      (current || []).map(n => n.id === id ? { ...n, read: true } : n)
    )
  }

  const markAllAsRead = () => {
    haptics.trigger('medium')
    setNotifications(current =>
      (current || []).map(n => ({ ...n, read: true }))
    )
  }

  const deleteNotification = (id: string) => {
    haptics.trigger('medium')
    setNotifications(current =>
      (current || []).filter(n => n.id !== id)
    )
  }

  const deleteAllRead = () => {
    haptics.trigger('heavy')
    setNotifications(current =>
      (current || []).filter(n => !n.read)
    )
  }

  const getNotificationIcon = (type: AppNotification['type'], priority: AppNotification['priority']) => {
    const iconProps = {
      size: 24,
      weight: priority === 'urgent' || priority === 'high' ? 'fill' : 'regular'
    } as const

    switch (type) {
      case 'match':
        return <Heart {...iconProps} className="text-primary" />
      case 'message':
        return <ChatCircle {...iconProps} className="text-secondary" />
      case 'like':
        return <Heart {...iconProps} className="text-accent" />
      case 'verification':
        return <CheckCircle {...iconProps} className="text-green-500" />
      case 'story':
        return <Camera {...iconProps} className="text-purple-500" />
      case 'moderation':
        return <ShieldCheck {...iconProps} className="text-orange-500" />
      case 'system':
        return <Info {...iconProps} className="text-blue-500" />
      default:
        return <Bell {...iconProps} />
    }
  }

  const getPriorityStyles = (priority: AppNotification['priority']) => {
    switch (priority) {
      case 'urgent':
        return 'border-l-4 border-l-destructive bg-destructive/5'
      case 'high':
        return 'border-l-4 border-l-accent bg-accent/5'
      case 'normal':
        return 'border-l-2 border-l-border'
      case 'low':
        return 'border-l border-l-border/50'
    }
  }

  const categories = [
    { value: 'all', label: 'All', icon: Bell },
    { value: 'match', label: 'Matches', icon: Heart },
    { value: 'message', label: 'Messages', icon: ChatCircle },
    { value: 'like', label: 'Likes', icon: Heart },
    { value: 'verification', label: 'Verified', icon: CheckCircle },
    { value: 'story', label: 'Stories', icon: Camera },
  ]

  // Animation hooks
  const bellRotate = useSharedValue(0)
  const bellScale = useSharedValue(1)
  const bellStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${bellRotate.value}deg` },
      { scale: bellScale.value },
    ],
  }))

  useEffect(() => {
    bellRotate.value = withSequence(
      withTiming(-10, { duration: 125 }),
      withTiming(10, { duration: 125 }),
      withTiming(-10, { duration: 125 }),
      withTiming(0, { duration: 125 })
    )
    bellScale.value = withSequence(
      withTiming(1.1, { duration: 250 }),
      withTiming(1, { duration: 250 })
    )
  }, [bellRotate, bellScale])

  const isEmpty = filteredNotifications.length === 0
  const emptyPresence = useAnimatePresence({ isVisible: isEmpty })
  const listPresence = useAnimatePresence({ isVisible: !isEmpty })

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-xl p-0 overflow-hidden">
        <div className="flex flex-col h-full">
          <SheetHeader className="px-6 py-4 border-b border-border/50 bg-gradient-to-br from-background via-primary/5 to-accent/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AnimatedView style={bellStyle}>
                  <BellRinging size={28} weight="fill" className="text-primary" />
                </AnimatedView>
                <div>
                  <SheetTitle className="text-xl">Notifications</SheetTitle>
                  {unreadCount > 0 && (
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {unreadCount} unread
                    </p>
                  )}
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <DotsThreeVertical size={20} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={markAllAsRead} disabled={unreadCount === 0}>
                    <Check size={16} className="mr-2" />
                    Mark all as read
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={deleteAllRead} disabled={(notifications || []).every(n => !n.read)}>
                    <Trash size={16} className="mr-2" />
                    Clear read
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-2 -mb-2">
              {categories.map((cat) => {
                const Icon = cat.icon
                const count = (notifications || []).filter(n => 
                  (cat.value === 'all' || n.type === cat.value) && !n.read
                ).length

                return (
                  <Button
                    key={cat.value}
                    variant={selectedCategory === cat.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      haptics.trigger('selection')
                      setSelectedCategory(cat.value)
                    }}
                    className={cn(
                      'rounded-full shrink-0 h-9',
                      selectedCategory === cat.value && 'shadow-lg'
                    )}
                  >
                    <Icon size={16} weight="fill" className="mr-1.5" />
                    {cat.label}
                    {count > 0 && (
                      <Badge
                        variant="secondary"
                        className="ml-2 px-1.5 min-w-[20px] h-5 rounded-full text-xs font-bold"
                      >
                        {count}
                      </Badge>
                    )}
                  </Button>
                )
              })}
            </div>
          </SheetHeader>

          <div className="flex items-center gap-2 px-6 py-3 bg-muted/30">
            <Button
              variant={filter === 'all' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => {
                haptics.trigger('selection')
                setFilter('all')
              }}
              className="rounded-full flex-1"
            >
              All
            </Button>
            <Button
              variant={filter === 'unread' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => {
                haptics.trigger('selection')
                setFilter('unread')
              }}
              className="rounded-full flex-1"
            >
              Unread
              {unreadCount > 0 && (
                <Badge variant="secondary" className="ml-2 px-1.5 min-w-[20px] h-5 rounded-full">
                  {unreadCount}
                </Badge>
              )}
            </Button>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-4">
              {emptyPresence.shouldRender && isEmpty && (
                <EmptyState 
                  filter={filter}
                  presence={emptyPresence}
                />
              )}
              {listPresence.shouldRender && !isEmpty && (
                <div className="space-y-2">
                  {filteredNotifications.map((notification, index) => {
                    const itemEntry = useEntryAnimation({ 
                      initialX: 20, 
                      delay: index * 20 
                    })
                    return (
                      <AnimatedView
                        key={notification.id}
                        style={[listPresence.animatedStyle, itemEntry.animatedStyle]}
                      >
                        <NotificationItem
                          notification={notification}
                          onMarkAsRead={markAsRead}
                          onDelete={deleteNotification}
                          getIcon={getNotificationIcon}
                          getPriorityStyles={getPriorityStyles}
                        />
                      </AnimatedView>
                    )
                  })}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  )
}

interface NotificationItemProps {
  notification: AppNotification
  onMarkAsRead: (id: string) => void
  onDelete: (id: string) => void
  getIcon: (type: AppNotification['type'], priority: AppNotification['priority']) => React.ReactNode
  getPriorityStyles: (priority: AppNotification['priority']) => string
}

// Empty state component
function EmptyState({ 
  filter, 
  presence 
}: { 
  filter: 'all' | 'unread'
  presence: ReturnType<typeof useAnimatePresence>
}) {
  const emptyEntry = useEntryAnimation({ initialScale: 0.9 })
  const bellRotate = useSharedValue(0)
  const bellScale = useSharedValue(1)
  const bellStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${bellRotate.value}deg` },
      { scale: bellScale.value },
    ],
  }))

  useEffect(() => {
    bellRotate.value = withRepeat(
      withSequence(
        withTiming(-10, { duration: 500 }),
        withTiming(10, { duration: 500 }),
        withTiming(-10, { duration: 500 }),
        withTiming(0, { duration: 500 })
      ),
      -1,
      false
    )
    bellScale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      ),
      -1,
      true
    )
  }, [bellRotate, bellScale])

  return (
    <AnimatedView
      className="flex flex-col items-center justify-center py-16 px-4"
      style={[presence.animatedStyle, emptyEntry.animatedStyle]}
    >
      <AnimatedView style={bellStyle}>
        <Bell size={64} weight="thin" className="text-muted-foreground/40" />
      </AnimatedView>
      <p className="text-muted-foreground mt-4 text-center">
        {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
      </p>
      <p className="text-sm text-muted-foreground/60 mt-1 text-center">
        We'll notify you when something important happens
      </p>
    </AnimatedView>
  )
}

function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
  getIcon,
  getPriorityStyles
}: NotificationItemProps) {
  const [isHovered, setIsHovered] = useState(false)
  const itemHover = useHoverLift({ scale: 1.01 })
  const iconScale = useSharedValue(1)
  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }))
  const urgentOpacity = useSharedValue(0.5)
  const urgentStyle = useAnimatedStyle(() => ({
    opacity: urgentOpacity.value,
  }))

  useEffect(() => {
    if (!notification.read && notification.priority === 'urgent') {
      iconScale.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 500 }),
          withTiming(1, { duration: 500 })
        ),
        -1,
        true
      )
      urgentOpacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 750 }),
          withTiming(0.5, { duration: 750 })
        ),
        -1,
        true
      )
    }
  }, [notification.read, notification.priority, iconScale, urgentOpacity])

  return (
    <AnimatedView
      className={cn(
        'relative rounded-xl overflow-hidden transition-all',
        !notification.read && 'bg-primary/5',
        getPriorityStyles(notification.priority)
      )}
      style={itemHover.animatedStyle}
      onMouseEnter={() => {
        setIsHovered(true)
        itemHover.handleEnter()
      }}
      onMouseLeave={() => {
        setIsHovered(false)
        itemHover.handleLeave()
      }}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <AnimatedView
            className={cn(
              'shrink-0 w-12 h-12 rounded-xl flex items-center justify-center',
              notification.priority === 'urgent' && 'bg-destructive/10',
              notification.priority === 'high' && 'bg-accent/10',
              notification.priority === 'normal' && 'bg-primary/10',
              notification.priority === 'low' && 'bg-muted'
            )}
            style={iconStyle}
          >
            {getIcon(notification.type, notification.priority)}
          </AnimatedView>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h4 className={cn(
                  'font-semibold text-sm leading-tight',
                  !notification.read && 'text-foreground',
                  notification.read && 'text-muted-foreground'
                )}>
                  {notification.title}
                </h4>
                <p className={cn(
                  'text-sm mt-1 leading-relaxed',
                  !notification.read && 'text-foreground/80',
                  notification.read && 'text-muted-foreground/70'
                )}>
                  {notification.message}
                </p>
              </div>

              {!notification.read && (
                <UnreadDot />
              )}
            </div>

            {notification.metadata && (
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {notification.metadata.petName && (
                  <Badge variant="secondary" className="text-xs rounded-full">
                    {notification.metadata.petName}
                  </Badge>
                )}
                {notification.metadata.count && notification.metadata.count > 1 && (
                  <Badge variant="secondary" className="text-xs rounded-full">
                    +{notification.metadata.count} more
                  </Badge>
                )}
              </div>
            )}

            <div className="flex items-center justify-between mt-3 gap-2">
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
              </span>

              <div className="flex items-center gap-1">
                <HoverActions
                  isHovered={isHovered}
                  isRead={notification.read}
                  onMarkAsRead={() => onMarkAsRead(notification.id)}
                  onDelete={() => onDelete(notification.id)}
                />

                {notification.actionLabel && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full h-8 text-xs"
                    onClick={() => haptics.trigger('medium')}
                  >
                    {notification.actionLabel}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {notification.priority === 'urgent' && !notification.read && (
        <AnimatedView
          className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-destructive via-accent to-destructive"
          style={urgentStyle}
        />
      )}
    </AnimatedView>
  )
}

// Unread dot component
function UnreadDot() {
  const dotScale = useSharedValue(0)
  const dotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: dotScale.value }],
  }))

  useEffect(() => {
    dotScale.value = withSpring(1, { damping: 15, stiffness: 200 })
  }, [dotScale])

  return (
    <AnimatedView
      className="shrink-0 w-2 h-2 rounded-full bg-primary mt-1"
      style={dotStyle}
    />
  )
}

// Hover actions component
function HoverActions({
  isHovered,
  isRead,
  onMarkAsRead,
  onDelete,
}: {
  isHovered: boolean
  isRead: boolean
  onMarkAsRead: () => void
  onDelete: () => void
}) {
  const markReadPresence = useAnimatePresence({ isVisible: isHovered && !isRead })
  const deletePresence = useAnimatePresence({ isVisible: isHovered })
  const markReadEntry = useEntryAnimation({ initialScale: 0, delay: 0 })
  const deleteEntry = useEntryAnimation({ initialScale: 0, delay: 50 })

  return (
    <>
      {markReadPresence.shouldRender && !isRead && (
        <AnimatedView
          style={[markReadPresence.animatedStyle, markReadEntry.animatedStyle]}
        >
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={onMarkAsRead}
          >
            <Check size={16} />
          </Button>
        </AnimatedView>
      )}
      {deletePresence.shouldRender && (
        <AnimatedView
          style={[deletePresence.animatedStyle, deleteEntry.animatedStyle]}
        >
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive"
            onClick={onDelete}
          >
            <Trash size={16} />
          </Button>
        </AnimatedView>
      )}
    </>
  )
}
