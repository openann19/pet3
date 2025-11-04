import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, 
  Heart, 
  PaperPlaneRight, 
  Pause, 
  Play,
  SpeakerHigh,
  SpeakerSlash,
  DotsThree,
  BookmarkSimple
} from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Story } from '@/lib/stories-types'
import { formatStoryTime, addStoryView } from '@/lib/stories-utils'
import { STORY_REACTION_EMOJIS } from '@/lib/stories-types'
import { haptics } from '@/lib/haptics'
import { toast } from 'sonner'
import SaveToHighlightDialog from './SaveToHighlightDialog'

interface StoryViewerProps {
  stories: Story[]
  initialIndex?: number
  currentUserId: string
  currentUserName: string
  currentUserAvatar?: string
  onClose: () => void
  onComplete?: () => void
  onStoryUpdate?: (story: Story) => void
}

export default function StoryViewer({
  stories,
  initialIndex = 0,
  currentUserId,
  currentUserName,
  currentUserAvatar,
  onClose,
  onComplete,
  onStoryUpdate
}: StoryViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [isPaused, setIsPaused] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [progress, setProgress] = useState(0)
  const [replyText, setReplyText] = useState('')
  const [showReactions, setShowReactions] = useState(false)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  
  const startTimeRef = useRef<number>(Date.now())
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  const currentStory = stories[currentIndex]
  const isOwn = currentStory?.userId === currentUserId

  useEffect(() => {
    startTimeRef.current = Date.now()
    setProgress(0)
    
    if (!isPaused) {
      startProgress()
    }

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
      }
    }
  }, [currentIndex, isPaused])

  useEffect(() => {
    if (currentStory && currentStory.type === 'video' && videoRef.current) {
      if (isPaused) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
    }
  }, [isPaused, currentStory])

  const startProgress = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current)
    }

    const duration = currentStory?.duration || 5
    const interval = 50
    
    progressIntervalRef.current = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + (interval / (duration * 1000)) * 100
        
        if (newProgress >= 100) {
          handleNext()
          return 0
        }
        
        return newProgress
      })
    }, interval)
  }

  const handleNext = () => {
    const viewDuration = (Date.now() - startTimeRef.current) / 1000
    const completedView = viewDuration >= (currentStory?.duration || 5) * 0.8

    if (currentStory && !isOwn) {
      const updatedStory = addStoryView(
        currentStory,
        currentUserId,
        currentUserName,
        viewDuration,
        completedView,
        currentUserAvatar
      )
      onStoryUpdate?.(updatedStory)
    }

    if (currentIndex < stories.length - 1) {
      setCurrentIndex(prev => prev + 1)
      setProgress(0)
    } else {
      onComplete?.()
      onClose()
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1)
      setProgress(0)
    }
  }

  const handlePauseToggle = () => {
    haptics.trigger('selection')
    setIsPaused(prev => !prev)
  }

  const handleMuteToggle = () => {
    haptics.trigger('selection')
    setIsMuted(prev => !prev)
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
    }
  }

  const handleReaction = (emoji: string) => {
    haptics.trigger('success')
    
    if (currentStory && !isOwn) {
      const updatedStory = {
        ...currentStory,
        reactions: [
          ...currentStory.reactions,
          {
            emoji,
            userId: currentUserId,
            userName: currentUserName,
            userAvatar: currentUserAvatar,
            timestamp: new Date().toISOString()
          }
        ]
      }
      onStoryUpdate?.(updatedStory)
    }

    toast.success(`Reacted with ${emoji}`, {
      duration: 1500,
      position: 'top-center'
    })

    setShowReactions(false)
  }

  const handleReply = () => {
    if (!replyText.trim()) return

    haptics.trigger('light')
    
    toast.success('Reply sent!', {
      duration: 2000,
      position: 'top-center'
    })

    setReplyText('')
  }

  const handleSaveStory = () => {
    if (currentStory) {
      haptics.trigger('selection')
      setShowSaveDialog(true)
    }
  }

  const handleTouchArea = (side: 'left' | 'right') => {
    if (side === 'left') {
      handlePrevious()
    } else {
      handleNext()
    }
  }

  if (!currentStory) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black"
    >
      <div className="relative w-full h-full flex items-center justify-center">
        <div className="absolute top-0 left-0 right-0 z-20 p-4 space-y-3">
          <div className="flex gap-1">
            {stories.map((_, idx) => (
              <div
                key={idx}
                className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden"
              >
                <motion.div
                  className="h-full bg-white"
                  initial={{ width: '0%' }}
                  animate={{
                    width: idx < currentIndex ? '100%' : idx === currentIndex ? `${progress}%` : '0%'
                  }}
                  transition={{ duration: 0.1, ease: 'linear' }}
                />
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10 ring-2 ring-white">
                <AvatarImage src={currentStory.userAvatar} alt={currentStory.userName} />
                <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white font-bold">
                  {currentStory.userName[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-white font-semibold text-sm">{currentStory.petName}</p>
                <p className="text-white/80 text-xs">{formatStoryTime(currentStory.createdAt)}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePauseToggle}
                className="text-white hover:bg-white/20"
              >
                {isPaused ? <Play size={20} weight="fill" /> : <Pause size={20} weight="fill" />}
              </Button>

              {currentStory.type === 'video' && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleMuteToggle}
                  className="text-white hover:bg-white/20"
                >
                  {isMuted ? <SpeakerSlash size={20} weight="fill" /> : <SpeakerHigh size={20} weight="fill" />}
                </Button>
              )}

              {isOwn && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white hover:bg-white/20"
                    >
                      <DotsThree size={24} weight="bold" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-background/95 backdrop-blur-lg">
                    <DropdownMenuItem onClick={handleSaveStory}>
                      <BookmarkSimple size={18} className="mr-2" />
                      Save to Highlight
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-white hover:bg-white/20"
              >
                <X size={24} weight="bold" />
              </Button>
            </div>
          </div>
        </div>

        <div className="absolute inset-0 flex">
          <button
            onClick={() => handleTouchArea('left')}
            className="flex-1 cursor-w-resize"
            aria-label="Previous story"
          />
          <button
            onClick={() => handleTouchArea('right')}
            className="flex-1 cursor-e-resize"
            aria-label="Next story"
          />
        </div>

        <div className="relative w-full h-full max-w-2xl mx-auto">
          {currentStory.type === 'photo' && (
            <motion.img
              key={currentStory.id}
              src={currentStory.mediaUrl}
              alt={currentStory.caption || 'Story'}
              className="w-full h-full object-contain"
              initial={{ scale: 1.1, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
            />
          )}

          {currentStory.type === 'video' && (
            <video
              ref={videoRef}
              src={currentStory.mediaUrl}
              className="w-full h-full object-contain"
              autoPlay
              loop
              muted={isMuted}
              playsInline
            />
          )}

          {currentStory.caption && (
            <div className="absolute bottom-24 left-0 right-0 px-4">
              <div className="glass-strong p-4 rounded-2xl backdrop-blur-xl">
                <p className="text-white text-center">{currentStory.caption}</p>
              </div>
            </div>
          )}
        </div>

        {!isOwn && (
          <div className="absolute bottom-0 left-0 right-0 z-20 p-4 space-y-3">
            <AnimatePresence>
              {showReactions && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="glass-strong p-4 rounded-2xl backdrop-blur-xl"
                >
                  <div className="flex justify-center gap-4">
                    {STORY_REACTION_EMOJIS.map((emoji) => (
                      <motion.button
                        key={emoji}
                        onClick={() => handleReaction(emoji)}
                        className="text-4xl"
                        whileHover={{ scale: 1.3 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        {emoji}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <Input
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleReply()
                    }
                  }}
                  placeholder="Send a reply..."
                  className="glass-strong border-white/30 text-white placeholder:text-white/60 pr-12 backdrop-blur-xl"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowReactions(!showReactions)}
                  className="absolute right-1 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
                >
                  <Heart size={20} weight={showReactions ? 'fill' : 'regular'} />
                </Button>
              </div>

              <Button
                onClick={handleReply}
                disabled={!replyText.trim()}
                size="icon"
                className="flex-shrink-0 bg-white text-black hover:bg-white/90"
              >
                <PaperPlaneRight size={20} weight="fill" />
              </Button>
            </div>
          </div>
        )}

        {isOwn && (
          <div className="absolute bottom-4 left-4 right-4 z-20">
            <div className="glass-strong p-4 rounded-2xl backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-white text-2xl font-bold">{currentStory.viewCount}</p>
                    <p className="text-white/60 text-xs">Views</p>
                  </div>
                  <div className="text-center">
                    <p className="text-white text-2xl font-bold">{currentStory.reactions.length}</p>
                    <p className="text-white/60 text-xs">Reactions</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white"
                >
                  View Insights
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {showSaveDialog && currentStory && (
        <SaveToHighlightDialog
          open={showSaveDialog}
          onOpenChange={setShowSaveDialog}
          story={currentStory}
          onSaved={() => {
            setShowSaveDialog(false)
          }}
        />
      )}
    </motion.div>
  )
}
