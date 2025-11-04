import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { Plus } from '@phosphor-icons/react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { MessageReaction } from '@/lib/chat-types'

interface MessageReactionsProps {
  reactions: MessageReaction[]
  availableReactions: readonly string[]
  onReact: (emoji: string) => void
  currentUserId: string
}

export default function MessageReactions({
  reactions,
  availableReactions,
  onReact,
  currentUserId
}: MessageReactionsProps) {
  const [showPicker, setShowPicker] = useState(false)

  const reactionGroups = reactions.reduce((acc, reaction) => {
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = []
    }
    acc[reaction.emoji].push(reaction)
    return acc
  }, {} as Record<string, MessageReaction[]>)

  const hasUserReacted = reactions.some(r => r.userId === currentUserId)

  return (
    <div className="flex items-center gap-1 mt-2 flex-wrap">
      <AnimatePresence>
        {Object.entries(reactionGroups).map(([emoji, reactionList]) => {
          const userReacted = reactionList.some(r => r.userId === currentUserId)
          
          return (
            <Popover key={emoji}>
              <PopoverTrigger asChild>
                <motion.button
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onReact(emoji)}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-all ${
                    userReacted
                      ? 'bg-primary/20 ring-1 ring-primary'
                      : 'bg-white/10 hover:bg-white/20'
                  }`}
                >
                  <span className="text-sm">{emoji}</span>
                  <span className="text-[10px] font-semibold">{reactionList.length}</span>
                </motion.button>
              </PopoverTrigger>
              <PopoverContent className="w-48 glass-strong p-2">
                <div className="space-y-2">
                  {reactionList.map((reaction, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Avatar className="w-6 h-6">
                        <AvatarImage src={reaction.userAvatar} />
                        <AvatarFallback className="text-[10px]">
                          {reaction.userName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs">{reaction.userName}</span>
                      <span className="ml-auto text-sm">{emoji}</span>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          )
        })}
      </AnimatePresence>

      <Popover open={showPicker} onOpenChange={setShowPicker}>
        <PopoverTrigger asChild>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center justify-center w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <Plus size={12} weight="bold" />
          </motion.button>
        </PopoverTrigger>
        <PopoverContent className="w-64 glass-strong p-3">
          <div className="grid grid-cols-6 gap-2">
            {availableReactions.map((emoji) => (
              <motion.button
                key={emoji}
                onClick={() => {
                  onReact(emoji)
                  setShowPicker(false)
                }}
                className="text-2xl p-1 rounded-lg hover:bg-white/20 transition-colors"
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
              >
                {emoji}
              </motion.button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
