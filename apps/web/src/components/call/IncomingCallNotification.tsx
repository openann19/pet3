import { motion } from 'framer-motion'
import { Phone, PhoneDisconnect, VideoCamera } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import type { Call } from '@/lib/call-types'
import { haptics } from '@/lib/haptics'

interface IncomingCallNotificationProps {
  call: Call
  callerName: string
  callerAvatar?: string
  onAccept: () => void
  onDecline: () => void
}

export default function IncomingCallNotification({
  call,
  callerName,
  callerAvatar,
  onAccept,
  onDecline
}: IncomingCallNotificationProps) {
  const handleAccept = () => {
    haptics.trigger('success')
    onAccept()
  }

  const handleDecline = () => {
    haptics.trigger('heavy')
    onDecline()
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: -20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: -20 }}
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4"
    >
      <motion.div
        animate={{
          boxShadow: [
            '0 10px 40px rgba(0,0,0,0.2)',
            '0 15px 50px rgba(245,158,11,0.4)',
            '0 10px 40px rgba(0,0,0,0.2)'
          ]
        }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className="glass-strong backdrop-blur-2xl rounded-3xl p-6 border border-white/30 shadow-2xl"
      >
        <div className="flex items-center gap-4 mb-6">
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            <Avatar className="w-16 h-16 ring-4 ring-primary/30">
              <AvatarImage src={callerAvatar} alt={callerName} />
              <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white text-2xl font-bold">
                {callerName[0]}
              </AvatarFallback>
            </Avatar>
          </motion.div>

          <div className="flex-1">
            <h3 className="font-bold text-lg text-foreground">{callerName}</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {call.type === 'video' ? (
                <>
                  <VideoCamera size={16} weight="fill" />
                  <span>Incoming video call...</span>
                </>
              ) : (
                <>
                  <Phone size={16} weight="fill" />
                  <span>Incoming call...</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <motion.div
            className="flex-1"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              onClick={handleDecline}
              variant="outline"
              className="w-full h-12 border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-all"
            >
              <PhoneDisconnect size={20} weight="fill" className="mr-2" />
              Decline
            </Button>
          </motion.div>

          <motion.div
            className="flex-1"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              onClick={handleAccept}
              className="w-full h-12 bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg"
            >
              <Phone size={20} weight="fill" className="mr-2" />
              Accept
            </Button>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  )
}
