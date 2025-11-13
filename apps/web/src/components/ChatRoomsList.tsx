'use client';

import { ChatCircle, Check, Checks } from '@phosphor-icons/react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { ChatRoom } from '@/lib/chat-types';
import { formatMessageTime } from '@/lib/chat-utils';
import { motion, AnimatePresence } from 'framer-motion';
import { staggerContainerVariants, staggerItemVariants, getVariantsWithReducedMotion, motionDurations } from '@/effects/framer-motion/variants';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface ChatRoomsListProps {
  rooms: ChatRoom[];
  onSelectRoom: (room: ChatRoom) => void;
  selectedRoomId?: string;
}

export default function ChatRoomsList({ rooms, onSelectRoom, selectedRoomId }: ChatRoomsListProps) {
  const prefersReducedMotion = useReducedMotion();

  if (rooms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="w-24 h-24 rounded-full bg-linear-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-6 relative"
        >
          <motion.div
            animate={prefersReducedMotion ? {} : { scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: prefersReducedMotion ? 0 : Infinity }}
          >
            <ChatCircle size={48} className="text-primary" weight="fill" />
          </motion.div>
          {!prefersReducedMotion && (
            <motion.div
              className="absolute inset-0 rounded-full bg-linear-to-br from-primary/20 to-accent/20"
              animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: prefersReducedMotion ? 0 : 0.2 }}
          className="text-2xl font-bold mb-2"
        >
          No Conversations Yet
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: prefersReducedMotion ? 0 : 0.3 }}
          className="text-muted-foreground max-w-md"
        >
          Start chatting with your matches to plan playdates and get to know each other!
        </motion.div>
      </div>
    );
  }

  return (
    <motion.ul
      className="space-y-2 overflow-y-auto max-h-full"
      role="list"
      aria-label="Chat rooms list"
      variants={getVariantsWithReducedMotion(staggerContainerVariants, prefersReducedMotion)}
      initial="hidden"
      animate="visible"
    >
      <AnimatePresence mode="popLayout">
        {rooms.map((room, idx) => {
        const unreadValue =
          typeof room.unreadCount === 'number'
            ? room.unreadCount
            : typeof room.unreadCount === 'object' && room.unreadCount
              ? Object.values(room.unreadCount).reduce((sum, count) => sum + count, 0)
              : 0;
        const hasUnread = unreadValue > 0;

        return (
          <motion.li
            key={room.id}
            variants={getVariantsWithReducedMotion(staggerItemVariants, prefersReducedMotion)}
            layout
            transition={{
              delay: prefersReducedMotion ? 0 : idx * 0.05,
              duration: prefersReducedMotion ? 0 : motionDurations.smooth,
            }}
          >
            <motion.button
              onClick={() => onSelectRoom(room)}
              className={`w-full text-left p-4 rounded-2xl transition-all relative overflow-hidden ${
                selectedRoomId === room.id
                  ? 'glass-strong shadow-lg scale-[1.02] border border-primary/30'
                  : 'glass-effect hover:glass-strong hover:scale-[1.01]'
              }`}
              whileHover={prefersReducedMotion ? undefined : { y: -2 }}
              whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
            >
              {hasUnread && !prefersReducedMotion && (
                <motion.div
                  className="absolute inset-0 bg-linear-to-r from-primary/5 to-accent/5"
                  animate={{ opacity: [0.5, 0.8, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}

              <div className="flex items-start gap-3 relative z-10">
                <div className="relative shrink-0">
                  <motion.div
                    animate={hasUnread && !prefersReducedMotion ? { scale: [1, 1.05, 1] } : {}}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Avatar
                      className={`w-14 h-14 ${hasUnread ? 'ring-2 ring-primary' : 'ring-2 ring-white/30'}`}
                    >
                      <AvatarImage src={room.matchedPetPhoto} alt={room.matchedPetName || 'Pet'} />
                      <AvatarFallback className="bg-linear-to-br from-primary to-accent text-white font-bold">
                        {room.matchedPetName?.[0] || '?'}
                      </AvatarFallback>
                    </Avatar>
                  </motion.div>

                  {hasUnread && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 min-w-6 h-6 rounded-full bg-linear-to-br from-accent to-primary flex items-center justify-center shadow-lg px-2"
                    >
                      <motion.span
                        className="text-white text-xs font-bold"
                        animate={prefersReducedMotion ? {} : { scale: [1, 1.1, 1] }}
                        transition={{ duration: 1, repeat: prefersReducedMotion ? 0 : Infinity }}
                      >
                        {unreadValue > 99 ? '99+' : String(unreadValue)}
                      </motion.span>
                    </motion.div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3
                      className={`font-semibold truncate ${hasUnread ? 'text-foreground' : 'text-foreground/90'}`}
                    >
                      {room.matchedPetName || 'Unknown Pet'}
                    </h3>
                    {room.lastMessage && (
                      <span
                        className={`text-xs shrink-0 ml-2 ${hasUnread ? 'text-primary font-semibold' : 'text-muted-foreground'}`}
                      >
                        {formatMessageTime(
                          room.lastMessage.timestamp || room.lastMessage.createdAt
                        )}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {room.lastMessage ? (
                      <div className="flex-1 min-w-0 flex items-center gap-1">
                        {room.lastMessage.status &&
                          ['sent', 'delivered', 'read'].includes(room.lastMessage.status) && (
                            <span className="shrink-0">
                              {room.lastMessage.status === 'read' ? (
                                <Checks size={14} weight="bold" className="text-primary" />
                              ) : (
                                <Check size={14} weight="bold" className="text-muted-foreground" />
                              )}
                            </span>
                          )}
                        <p
                          className={`text-sm truncate ${hasUnread ? 'text-foreground font-medium' : 'text-muted-foreground'}`}
                        >
                          {room.lastMessage.type === 'text'
                            ? room.lastMessage.content
                            : room.lastMessage.type === 'sticker'
                              ? `${room.lastMessage.content} Sticker`
                              : room.lastMessage.type === 'voice'
                                ? '🎤 Voice message'
                                : '📷 Image'}
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground italic flex-1 truncate">
                        Say hello! 👋
                      </p>
                    )}
                  </div>

                  {room.isTyping && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-1 mt-1"
                    >
                      <div className="flex gap-1">
                        {[0, 1, 2].map((i) => (
                          <motion.div
                            key={i}
                            className="w-2 h-2 rounded-full bg-primary"
                            animate={prefersReducedMotion ? {} : { scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 1, repeat: prefersReducedMotion ? 0 : Infinity, delay: i * 0.2 }}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-primary">typing...</span>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.button>
          </motion.li>
        );
      })}
      </AnimatePresence>
    </motion.ul>
  );
}
