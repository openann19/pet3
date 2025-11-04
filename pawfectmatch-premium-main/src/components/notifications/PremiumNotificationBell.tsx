import { useState, useEffect } from 'react'
import { useStorage } from '@/hooks/useStorage'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Bell, BellRinging, BellSlash } from '@phosphor-icons/react'
import { Badge } from '@/components/ui/badge'
import { haptics } from '@/lib/haptics'
import { PremiumNotificationCenter, type PremiumNotification } from './PremiumNotificationCenter'

export function PremiumNotificationBell() {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications] = useStorage<PremiumNotification[]>('premium-notifications', [])
  const [hasNewNotification, setHasNewNotification] = useState(false)
  const [lastCheckTime, setLastCheckTime] = useStorage<number>('last-notification-check', Date.now())

  const allNotifications = notifications || []
  const unreadCount = allNotifications.filter(n => !n.read && !n.archived).length
  const urgentCount = allNotifications.filter(
    n => !n.read && !n.archived && (n.priority === 'urgent' || n.priority === 'critical')
  ).length

  const hasUrgent = urgentCount > 0

  useEffect(() => {
    const newNotifs = allNotifications.filter(n => n.timestamp > (lastCheckTime || 0))
    if (newNotifs.length > 0 && !isOpen) {
      setHasNewNotification(true)
      haptics.trigger('medium')
      
      const timer = setTimeout(() => setHasNewNotification(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [allNotifications.length, lastCheckTime, isOpen])

  const handleClick = () => {
    haptics.trigger('medium')
    setIsOpen(true)
    setLastCheckTime(Date.now())
    setHasNewNotification(false)
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleClick}
        className="relative rounded-full w-11 h-11 hover:bg-primary/10 active:bg-primary/20 transition-colors flex-shrink-0 touch-manipulation"
        aria-label={`Notifications${unreadCount > 0 ? ` - ${unreadCount} unread` : ''}${urgentCount > 0 ? ` - ${urgentCount} urgent` : ''}`}
      >
        <AnimatePresence mode="wait">
          {hasNewNotification && unreadCount > 0 ? (
            <motion.div
              key="ringing"
              initial={{ rotate: 0 }}
              animate={{ 
                rotate: [-20, 20, -20, 20, -15, 15, -10, 10, 0],
                scale: [1, 1.15, 1, 1.15, 1.1, 1, 1.05, 1]
              }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ 
                duration: 0.8,
                ease: "easeInOut"
              }}
            >
              <BellRinging 
                size={20} 
                weight="fill" 
                className={hasUrgent ? 'text-destructive' : 'text-primary'} 
              />
            </motion.div>
          ) : (
            <motion.div
              key="bell"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <Bell 
                size={20} 
                weight={unreadCount > 0 ? 'fill' : 'regular'} 
                className={
                  hasUrgent 
                    ? 'text-destructive' 
                    : unreadCount > 0 
                    ? 'text-primary' 
                    : 'text-foreground/80'
                } 
              />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute -top-1 -right-1"
            >
              <motion.div
                animate={
                  hasUrgent
                    ? {
                        scale: [1, 1.2, 1],
                      }
                    : {}
                }
                transition={{
                  duration: 1,
                  repeat: hasUrgent ? Infinity : 0,
                }}
              >
                <Badge 
                  variant={hasUrgent ? 'destructive' : 'default'}
                  className="h-5 min-w-[20px] px-1 rounded-full text-xs font-bold flex items-center justify-center shadow-lg"
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Badge>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {unreadCount > 0 && (
          <motion.div
            className={cn(
              'absolute inset-0 rounded-full border-2',
              hasUrgent ? 'border-destructive' : 'border-primary'
            )}
            animate={{
              scale: [1, 1.4, 1],
              opacity: [0.6, 0, 0.6]
            }}
            transition={{
              duration: hasUrgent ? 1.5 : 2,
              repeat: Infinity,
              ease: "easeOut"
            }}
          />
        )}

        {hasUrgent && (
          <motion.div
            className="absolute inset-0 rounded-full"
            animate={{
              boxShadow: [
                '0 0 0 0 rgba(239, 68, 68, 0)',
                '0 0 0 8px rgba(239, 68, 68, 0.3)',
                '0 0 0 0 rgba(239, 68, 68, 0)'
              ]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeOut"
            }}
          />
        )}
      </Button>

      <PremiumNotificationCenter isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  )
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}
