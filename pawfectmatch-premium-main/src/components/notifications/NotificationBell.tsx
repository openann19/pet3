import { useState, useEffect } from 'react'
import { useStorage } from '@/hooks/useStorage'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Bell, BellRinging } from '@phosphor-icons/react'
import { Badge } from '@/components/ui/badge'
import { haptics } from '@/lib/haptics'
import { NotificationCenter, type AppNotification } from './NotificationCenter'

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications] = useStorage<AppNotification[]>('app-notifications', [])
  const [hasNewNotification, setHasNewNotification] = useState(false)

  const unreadCount = (notifications || []).filter(n => !n.read).length

  useEffect(() => {
    if (unreadCount > 0) {
      setHasNewNotification(true)
      const timer = setTimeout(() => setHasNewNotification(false), 2000)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [unreadCount])

  const handleClick = () => {
    haptics.trigger('medium')
    setIsOpen(true)
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleClick}
        className="relative rounded-full w-11 h-11 hover:bg-primary/10 active:bg-primary/20 transition-colors shrink-0 touch-manipulation"
        aria-label={`Notifications${unreadCount > 0 ? ` - ${unreadCount} unread` : ''}`}
      >
        <AnimatePresence mode="wait">
          {hasNewNotification && unreadCount > 0 ? (
            <motion.div
              key="ringing"
              initial={{ rotate: 0 }}
              animate={{ 
                rotate: [-15, 15, -15, 15, 0],
                scale: [1, 1.1, 1, 1.1, 1]
              }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ 
                duration: 0.6,
                ease: "easeInOut"
              }}
            >
              <BellRinging size={20} weight="fill" className="text-primary" />
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
                className={unreadCount > 0 ? 'text-primary' : 'text-foreground/80'} 
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
              <Badge 
                variant="destructive" 
                className="h-5 min-w-[20px] px-1 rounded-full text-xs font-bold flex items-center justify-center shadow-lg"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            </motion.div>
          )}
        </AnimatePresence>

        {unreadCount > 0 && (
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-primary"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.5, 0, 0.5]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeOut"
            }}
          />
        )}
      </Button>

      <NotificationCenter isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  )
}
