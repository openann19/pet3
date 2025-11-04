import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  PaperPlaneRight, 
  Smiley, 
  X, 
  ArrowLeft,
  DotsThree,
  Heart,
  Microphone,
  Sparkle,
  ChatCentered,
  Check,
  Checks,
  Play,
  Pause,
} from '@phosphor-icons/react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover'
import type { ChatRoom, ReactionType, ChatMessage } from '@/lib/chat-types'
import { formatChatTime, getReactionsArray } from '@/lib/chat-utils'
import { MESSAGE_TEMPLATES, REACTION_EMOJIS } from '@/lib/chat-types'
import { toast } from 'sonner'
import { haptics } from '@/lib/haptics'
import { createLogger } from '@/lib/logger'
import VoiceRecorder from '@/components/chat/VoiceRecorder'
import { StickerPicker } from '@/components/chat/StickerPicker'
import { StickerMessage } from '@/components/chat/StickerMessage'
import { useCall } from '@/hooks/useCall'
import { useChatMessages } from '@/hooks/useChatMessages'
import { useTypingIndicator } from '@/hooks/useTypingIndicator'
import { useVoiceMessages } from '@/hooks/useVoiceMessages'
import type { Sticker } from '@/lib/sticker-library'
import type { Sticker as ChatSticker } from '@/lib/chat-types'

interface ChatWindowProps {
  room: ChatRoom
  currentUserId: string
  currentUserName: string
  currentUserAvatar?: string
  onBack?: () => void
}

export default function ChatWindow({ 
  room, 
  currentUserId,
  currentUserName,
  currentUserAvatar,
  onBack 
}: ChatWindowProps) {
  const [inputValue, setInputValue] = useState('')
  const [showStickers, setShowStickers] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [showReactions, setShowReactions] = useState<string | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  
  const {
    messages,
    messageGroups,
    sendMessage,
    addReaction,
    markAsRead,
  } = useChatMessages({
    roomId: room.id,
    currentUserId,
    currentUserName,
    currentUserAvatar,
  })

  const { isTyping, handleInputChange: handleTypingInput } = useTypingIndicator()
  
  const {
    voiceMessages,
    playingVoice,
    saveVoiceMessage,
    toggleVoicePlayback,
  } = useVoiceMessages(room.id)

  // Call hook initialized for call functionality
  const _callState = useCall(room.id, currentUserId, currentUserName, currentUserAvatar)
  void _callState

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    markAsRead()
  }, [room.id, markAsRead])

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }

  const handleSendMessage = (content: string, type: 'text' | 'sticker' | 'voice' = 'text', metadata?: ChatMessage['metadata']) => {
    if (!content.trim() && type === 'text') return
    
    haptics.trigger('light')
    const message = sendMessage(content, type, metadata)
    
    if (message && type === 'text') {
      toast.success('Message sent!', {
        duration: 1500,
        position: 'top-center'
      })
    }
    
    setInputValue('')
    setShowStickers(false)
  }

  const handleStickerSelect = (sticker: Sticker) => {
    const chatSticker: ChatSticker = {
      id: sticker.id,
      pack: 'default',
      categoryId: sticker.categoryId,
      emoji: sticker.emoji,
      label: sticker.label,
      keywords: sticker.keywords || []
    }
    handleSendMessage(JSON.stringify(chatSticker), 'sticker', { sticker: chatSticker })
    setShowStickers(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInputValue(value)
    handleTypingInput(e)
  }

  const handleReaction = (messageId: string, emoji: ReactionType) => {
    haptics.trigger('selection')
    addReaction(messageId, emoji)
    setShowReactions(null)
  }

  const handleUseTemplate = (template: string) => {
    setInputValue(template)
    setShowTemplates(false)
    inputRef.current?.focus()
  }

  const handleVoiceRecorded = async (audioBlob: Blob, duration: number, waveform: number[]) => {
    try {
      const messageId = await saveVoiceMessage(audioBlob, duration, waveform)
      
      sendMessage(
        `Voice message (${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')})`,
        'voice',
        { messageId }
      )
      
      setIsRecording(false)
      
      toast.success('Voice message sent!', {
        duration: 1500,
        position: 'top-center'
      })
    } catch (error) {
      const logger = createLogger('ChatWindow')
      logger.error('Failed to save voice message', error instanceof Error ? error : new Error(String(error)))
      toast.error('Failed to send voice message')
      setIsRecording(false)
    }
  }

  const handleVoiceCancel = () => {
    setIsRecording(false)
    toast.info('Recording cancelled', {
      duration: 1000,
      position: 'top-center'
    })
  }

  return (
    <div className="flex flex-col h-full">
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="glass-strong border-b border-white/20 p-4 shadow-xl backdrop-blur-2xl"
      >
        <div className="flex items-center gap-3">
          {onBack && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="md:hidden"
            >
              <ArrowLeft size={20} />
            </Button>
          )}
          
          <Avatar className="w-10 h-10 ring-2 ring-white/30">
            <AvatarImage src={room.matchedPetPhoto} alt={room.matchedPetName || 'Chat'} />
            <AvatarFallback className="bg-linear-to-br from-primary to-accent text-white font-bold">
              {(room.matchedPetName || 'C')[0]}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <h2 className="font-bold text-foreground">{room.matchedPetName || 'Chat'}</h2>
            {isTyping && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs text-primary flex items-center gap-1"
              >
                <motion.span
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  typing
                </motion.span>
                <motion.span
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.6, repeat: Infinity }}
                >
                  ...
                </motion.span>
              </motion.p>
            )}
          </div>

          <Button variant="ghost" size="icon" className="shrink-0">
            <DotsThree size={24} weight="bold" />
          </Button>
        </div>
      </motion.div>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-6"
      >
        {messageGroups.map((group, groupIdx) => (
          <div key={group.date} className="space-y-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: groupIdx * 0.1 }}
              className="flex justify-center"
            >
              <div className="glass-effect px-4 py-1.5 rounded-full text-xs font-medium text-muted-foreground shadow-sm">
                {group.date}
              </div>
            </motion.div>

            {group.messages.map((message, msgIdx) => {
              const isCurrentUser = message.senderId === currentUserId
              
              return (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ 
                    delay: msgIdx * 0.05,
                    type: 'spring',
                    stiffness: 300,
                    damping: 30
                  }}
                  className={`flex items-end gap-2 ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  {!isCurrentUser && (
                    <Avatar className="w-8 h-8 ring-2 ring-white/20 shrink-0">
                      <AvatarImage src={message.senderAvatar} alt={message.senderName || 'User'} />
                      <AvatarFallback className="bg-linear-to-br from-secondary to-primary text-white text-xs font-bold">
                        {(message.senderName || 'U')[0]}
                      </AvatarFallback>
                    </Avatar>
                  )}

                  <div className={`flex flex-col max-w-[75%] ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className={`relative group ${
                        message.type === 'sticker' ? 'p-0' : 'p-3'
                      } rounded-2xl shadow-lg ${
                        isCurrentUser
                          ? 'bg-linear-to-br from-primary to-accent text-white'
                          : 'glass-strong backdrop-blur-xl border border-white/20'
                      }`}
                    >
                      {message.type === 'text' && (
                        <p className="text-sm wrap-break-word">{message.content}</p>
                      )}
                      
                      {message.type === 'sticker' && message.metadata?.sticker && (
                        <StickerMessage 
                          sticker={{
                            id: message.metadata.sticker.id || '',
                            categoryId: 'default',
                            emoji: (message.metadata.sticker as ChatSticker).emoji || '😀',
                            label: (message.metadata.sticker as ChatSticker).label || 'Sticker',
                            keywords: (message.metadata.sticker as ChatSticker).keywords || []
                          }}
                          isOwn={isCurrentUser}
                        />
                      )}

                      {message.type === 'sticker' && !message.metadata?.sticker && (
                        <div className="text-5xl p-2">
                          {message.content}
                        </div>
                      )}

                      {message.type === 'voice' && voiceMessages && voiceMessages[message.id] && (() => {
                        const voiceData = voiceMessages[message.id]
                        if (!voiceData) return null
                        return (
                          <motion.button
                            onClick={() => toggleVoicePlayback(message.id)}
                            className="flex items-center gap-2 min-w-[200px]"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <motion.div 
                              className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center"
                              whileHover={{ scale: 1.1 }}
                            >
                              {playingVoice === message.id ? (
                                <Pause size={16} weight="fill" />
                              ) : (
                                <Play size={16} weight="fill" />
                              )}
                            </motion.div>
                            <div className="flex-1 h-8 flex items-center gap-0.5">
                              {voiceData.waveform.slice(0, 30).map((value, i) => (
                                <motion.div
                                  key={i}
                                  className="w-1 bg-white/60 rounded-full"
                                  style={{ height: `${Math.max(value * 24, 4)}px` }}
                                  animate={
                                    playingVoice === message.id
                                      ? { opacity: [0.4, 1, 0.4] }
                                      : {}
                                  }
                                  transition={{ duration: 0.5, delay: i * 0.02, repeat: playingVoice === message.id ? Infinity : 0 }}
                                />
                              ))}
                            </div>
                            <span className="text-xs opacity-80">
                              {Math.floor(voiceData.duration / 60)}:{(voiceData.duration % 60).toString().padStart(2, '0')}
                            </span>
                          </motion.button>
                        )
                      })()}

                      <Popover open={showReactions === message.id} onOpenChange={(open) => setShowReactions(open ? message.id : null)}>
                        <PopoverTrigger asChild>
                          <motion.button
                            className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-white shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            whileHover={{ scale: 1.2 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <Heart size={14} weight="fill" className="text-red-500" />
                          </motion.button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-2 glass-strong backdrop-blur-2xl border-white/30" side="top">
                          <div className="flex gap-1">
                            {REACTION_EMOJIS.slice(0, 6).map((emoji) => (
                              <motion.button
                                key={emoji}
                                onClick={() => handleReaction(message.id, emoji)}
                                className="text-2xl p-2 rounded-lg hover:bg-white/20 transition-colors"
                                whileHover={{ scale: 1.2 }}
                                whileTap={{ scale: 0.9 }}
                              >
                                {emoji}
                              </motion.button>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    </motion.div>

                    {(() => {
                      const reactionsArray = getReactionsArray(message.reactions)
                      return reactionsArray.length > 0 && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="flex gap-1 mt-1 px-2"
                        >
                          {reactionsArray.map((reaction, idx) => {
                            const count = reaction.count ?? (reaction.userIds?.length ?? 1)
                            return (
                              <motion.div
                                key={idx}
                                whileHover={{ scale: 1.2 }}
                                className="text-lg bg-white/80 rounded-full px-2 py-0.5 shadow-sm"
                                title={`${count} ${reaction.emoji}`}
                              >
                                {reaction.emoji} {count > 1 ? count : ''}
                              </motion.div>
                            )
                          })}
                        </motion.div>
                      )
                    })()}

                    <div className="flex items-center gap-1 mt-1 px-1">
                      <span className="text-xs text-muted-foreground">
                        {formatChatTime(message.timestamp)}
                      </span>
                      {isCurrentUser && (
                        <span className="text-muted-foreground">
                          {message.status === 'read' ? (
                            <Checks size={14} weight="bold" className="text-primary" />
                          ) : (
                            <Check size={14} weight="bold" />
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        ))}
      </div>

      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="glass-strong border-t border-white/20 p-4 shadow-2xl backdrop-blur-2xl"
      >
        {showTemplates && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-3 overflow-hidden"
          >
            <div className="glass-effect rounded-2xl p-3 space-y-2">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <Sparkle size={16} weight="fill" className="text-primary" />
                  Quick Templates
                </h4>
                <Button variant="ghost" size="sm" onClick={() => setShowTemplates(false)}>
                  <X size={16} />
                </Button>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {MESSAGE_TEMPLATES.slice(0, 4).map((template) => (
                  <motion.button
                    key={template.id}
                    onClick={() => handleUseTemplate(template.text || template.content || '')}
                    className="text-left p-2 rounded-lg glass-effect hover:glass-strong transition-all text-sm"
                    whileHover={{ scale: 1.02, x: 4 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {template.icon && <span className="mr-2">{template.icon}</span>}
                    {template.title || template.text}
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {isRecording ? (
          <VoiceRecorder
            onRecorded={handleVoiceRecorded}
            onCancel={handleVoiceCancel}
            maxDuration={120}
          />
        ) : (
          <div className="flex items-end gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowTemplates(!showTemplates)}
              className="shrink-0"
            >
              <ChatCentered size={24} weight={showTemplates ? 'fill' : 'regular'} />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                haptics.impact('light')
                setShowStickers(!showStickers)
              }}
              className="shrink-0"
            >
              <Smiley size={24} weight={showStickers ? 'fill' : 'regular'} />
            </Button>

            <div className="flex-1 relative">
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSendMessage(inputValue, 'text')
                  }
                }}
                placeholder="Type a message..."
                className="pr-12 glass-effect border-white/30 focus:border-primary/50 backdrop-blur-xl"
              />
            </div>

            <Button
              onClick={() => {
                haptics.trigger('medium')
                setIsRecording(true)
              }}
              size="icon"
              variant="ghost"
              className="shrink-0"
            >
              <Microphone size={20} weight="regular" />
            </Button>

            <Button
              onClick={() => handleSendMessage(inputValue, 'text')}
              disabled={!inputValue.trim()}
              size="icon"
              className="shrink-0 bg-linear-to-br from-primary to-accent hover:shadow-lg transition-all disabled:opacity-50"
            >
              <motion.div
                whileHover={{ x: 5 }}
                whileTap={{ scale: 0.9 }}
              >
                <PaperPlaneRight size={20} weight="fill" />
              </motion.div>
            </Button>
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {showStickers && (
          <StickerPicker
            onSelectSticker={handleStickerSelect}
            onClose={() => setShowStickers(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
