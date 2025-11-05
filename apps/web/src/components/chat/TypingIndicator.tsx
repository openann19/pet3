import { motion } from 'framer-motion'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import type { TypingUser } from '@/lib/chat-types'

interface TypingIndicatorProps {
  users: TypingUser[]
}

export default function TypingIndicator({ users }: TypingIndicatorProps) {
  if (users.length === 0) return null

  const displayUsers = users.slice(0, 3)

  return (
    <motion.div
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -5 }}
      className="flex items-center gap-2"
    >
      <div className="flex -space-x-2">
        {displayUsers.map((user) => (
          <Avatar key={user.userId} className="w-4 h-4 ring-1 ring-background">
            <AvatarFallback className="text-[8px]">
              {user.userName?.[0] ?? '?'}
            </AvatarFallback>
          </Avatar>
        ))}
      </div>

      <div className="flex items-center gap-1 text-xs text-primary">
        <span>
          {users.length === 1
            ? `${users[0]?.userName ?? 'Someone'} is typing`
            : users.length === 2
            ? `${users[0]?.userName ?? 'Someone'} and ${users[1]?.userName ?? 'Someone'} are typing`
            : `${users[0]?.userName ?? 'Someone'} and ${users.length - 1} others are typing`}
        </span>
        <motion.div className="flex gap-0.5">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="w-1 h-1 bg-primary rounded-full"
              animate={{
                opacity: [0.3, 1, 0.3],
                y: [0, -3, 0]
              }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                delay: i * 0.2
              }}
            />
          ))}
        </motion.div>
      </div>
    </motion.div>
  )
}
