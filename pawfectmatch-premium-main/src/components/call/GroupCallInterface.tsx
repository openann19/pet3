import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  PhoneDisconnect,
  Microphone,
  MicrophoneSlash,
  VideoCamera,
  VideoCameraSlash,
  GridFour,
  UserFocus,
  Sidebar,
  ArrowsOut,
  ArrowsIn,
  Users,
  Hand,
  ChatCircle,
  ShareNetwork
} from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { GroupCallSession, CallParticipant } from '@/lib/call-types'
import { formatCallDuration } from '@/lib/call-utils'
import { haptics } from '@/lib/haptics'
import { cn } from '@/lib/utils'

interface GroupCallInterfaceProps {
  session: GroupCallSession
  onEndCall: () => void
  onToggleMute: () => void
  onToggleVideo: () => void
  onToggleLayout?: () => void
  onInviteParticipants?: () => void
}

export default function GroupCallInterface({
  session,
  onEndCall,
  onToggleMute,
  onToggleVideo,
  onToggleLayout,
  onInviteParticipants
}: GroupCallInterfaceProps) {
  const [duration, setDuration] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showParticipants, setShowParticipants] = useState(false)
  const [raisedHands, setRaisedHands] = useState<Set<string>>(new Set())
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map())
  const localVideoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (session.call.status === 'active') {
      const interval = setInterval(() => {
        setDuration(prev => prev + 1)
      }, 1000)

      return () => clearInterval(interval)
    }
    return undefined
  }, [session.call.status])

  useEffect(() => {
    if (localVideoRef.current && session.localStream) {
      localVideoRef.current.srcObject = session.localStream
    }
  }, [session.localStream])

  useEffect(() => {
    session.streams.forEach((stream, participantId) => {
      const videoElement = videoRefs.current.get(participantId)
      if (videoElement) {
        videoElement.srcObject = stream
      }
    })
  }, [session.streams])

  const handleToggleMute = () => {
    haptics.trigger('selection')
    onToggleMute()
  }

  const handleToggleVideo = () => {
    haptics.trigger('selection')
    onToggleVideo()
  }

  const handleEndCall = () => {
    haptics.trigger('heavy')
    onEndCall()
  }

  const handleToggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  const handleToggleLayout = () => {
    haptics.trigger('selection')
    onToggleLayout?.()
  }

  const handleRaiseHand = () => {
    haptics.trigger('selection')
    setRaisedHands(prev => {
      const newSet = new Set(prev)
      if (newSet.has(session.localParticipant.id)) {
        newSet.delete(session.localParticipant.id)
      } else {
        newSet.add(session.localParticipant.id)
      }
      return newSet
    })
  }

  const isVideoCall = session.call.type === 'video'
  const isActive = session.call.status === 'active'
  const participantsArray = Array.isArray(session.participants) ? session.participants : Array.from(session.participants.values())
  const totalParticipants = participantsArray.length + 1

  const getGridLayout = () => {
    if (totalParticipants <= 2) return 'grid-cols-1'
    if (totalParticipants <= 4) return 'grid-cols-2'
    if (totalParticipants <= 9) return 'grid-cols-3'
    return 'grid-cols-4'
  }

  const renderParticipantVideo = (participant: CallParticipant, streamId: string) => {
    const stream = session.streams.get(streamId)
    const isRaised = raisedHands.has(participant.id)

    return (
      <motion.div
        key={participant.id}
        layout
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        className={cn(
          'relative rounded-2xl overflow-hidden bg-gradient-to-br from-primary/20 to-accent/20',
          session.layout === 'spotlight' && session.spotlightParticipantId === participant.id
            ? 'col-span-full row-span-2'
            : ''
        )}
      >
        {isVideoCall && participant.isVideoEnabled && stream ? (
          <video
            ref={el => {
              if (el) videoRefs.current.set(streamId, el)
            }}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Avatar className="w-24 h-24 ring-4 ring-white/30">
              <AvatarImage src={participant.avatar} alt={participant.name} />
              <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white text-3xl font-bold">
                {participant.name[0]}
              </AvatarFallback>
            </Avatar>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 pointer-events-none" />

        <div className="absolute top-3 left-3 flex flex-col gap-2">
          <div className="glass-strong backdrop-blur-xl px-3 py-1.5 rounded-full">
            <p className="text-white font-semibold text-sm">{participant.name}</p>
            {participant.petName && (
              <p className="text-white/70 text-xs">{participant.petName}</p>
            )}
          </div>
          {isRaised && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="glass-strong backdrop-blur-xl px-2 py-1 rounded-full flex items-center gap-1"
            >
              <Hand size={16} weight="fill" className="text-yellow-400" />
              <span className="text-white text-xs">Raised hand</span>
            </motion.div>
          )}
        </div>

        <div className="absolute bottom-3 right-3 flex items-center gap-2">
          {participant.isMuted && (
            <div className="glass-strong backdrop-blur-xl p-2 rounded-full">
              <MicrophoneSlash size={16} weight="fill" className="text-red-400" />
            </div>
          )}
          {!participant.isVideoEnabled && isVideoCall && (
            <div className="glass-strong backdrop-blur-xl p-2 rounded-full">
              <VideoCameraSlash size={16} weight="fill" className="text-red-400" />
            </div>
          )}
          {participant.isSpeaking && (
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.5, repeat: Infinity }}
              className="w-2 h-2 bg-green-400 rounded-full"
            />
          )}
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`fixed inset-0 z-50 flex items-center justify-center ${
        isFullscreen ? 'bg-background' : 'bg-background/95 backdrop-blur-xl p-4'
      }`}
    >
      <motion.div
        className={`relative w-full ${
          isFullscreen ? 'h-full' : 'max-w-7xl h-[90vh]'
        } bg-gradient-to-br from-card via-card to-card/80 rounded-3xl overflow-hidden shadow-2xl border border-border/50`}
        layout
      >
        <div className="absolute top-0 left-0 right-0 z-20 glass-strong backdrop-blur-2xl border-b border-border/50">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Users size={24} weight="fill" className="text-primary" />
                <div>
                  <h3 className="font-bold text-foreground text-lg">
                    {session.call.title || 'Playdate Video Call'}
                  </h3>
                  <div className="flex items-center gap-2 text-sm">
                    {isActive ? (
                      <>
                        <motion.div
                          animate={{ scale: [1, 1.2, 1], opacity: [1, 0.5, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="w-2 h-2 bg-green-500 rounded-full"
                        />
                        <span className="text-muted-foreground font-medium">
                          {formatCallDuration(duration)}
                        </span>
                      </>
                    ) : (
                      <>
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                          className="w-2 h-2 bg-yellow-500 rounded-full"
                        />
                        <span className="text-muted-foreground">
                          {session.call.status === 'ringing' ? 'Ringing...' : 'Connecting...'}
                        </span>
                      </>
                    )}
                    <span className="text-muted-foreground">•</span>
                    <span className="text-muted-foreground">{totalParticipants} participants</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  session.call.quality === 'excellent' ? 'bg-green-500' :
                  session.call.quality === 'good' ? 'bg-blue-500' :
                  session.call.quality === 'fair' ? 'bg-yellow-500' : 'bg-red-500'
                }`} />
                <span className="capitalize">{session.call.quality}</span>
              </Badge>

              {isVideoCall && (
                <Button
                  onClick={handleToggleLayout}
                  size="icon"
                  variant="ghost"
                  className="rounded-full"
                >
                  {session.layout === 'grid' ? (
                    <GridFour size={20} weight="fill" />
                  ) : session.layout === 'spotlight' ? (
                    <UserFocus size={20} weight="fill" />
                  ) : (
                    <Sidebar size={20} weight="fill" />
                  )}
                </Button>
              )}

              <Button
                onClick={() => setShowParticipants(!showParticipants)}
                size="icon"
                variant="ghost"
                className="rounded-full"
              >
                <Users size={20} weight="fill" />
              </Button>

              <Button
                onClick={handleToggleFullscreen}
                size="icon"
                variant="ghost"
                className="rounded-full"
              >
                {isFullscreen ? <ArrowsIn size={20} /> : <ArrowsOut size={20} />}
              </Button>
            </div>
          </div>
        </div>

        <div className="absolute top-20 bottom-24 left-0 right-0 p-6 overflow-hidden">
          <div className={cn(
            'grid gap-4 h-full',
            session.layout === 'grid' ? getGridLayout() : '',
            session.layout === 'spotlight' ? 'grid-cols-1' : '',
            session.layout === 'sidebar' ? 'grid-cols-[1fr_300px]' : ''
          )}>
            {session.layout !== 'sidebar' && (
              <motion.div
                layout
                className={cn(
                  'relative rounded-2xl overflow-hidden bg-gradient-to-br from-primary/10 to-accent/10',
                  session.layout === 'spotlight' ? 'row-span-1' : ''
                )}
              >
                {isVideoCall && session.localParticipant.isVideoEnabled ? (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover mirror"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Avatar className="w-24 h-24 ring-4 ring-primary/50">
                      <AvatarImage
                        src={session.localParticipant.avatar}
                        alt={session.localParticipant.name}
                      />
                      <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white text-3xl font-bold">
                        {session.localParticipant.name[0]}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 pointer-events-none" />

                <div className="absolute top-3 left-3">
                  <div className="glass-strong backdrop-blur-xl px-3 py-1.5 rounded-full flex items-center gap-2">
                    <p className="text-white font-semibold text-sm">You</p>
                    <Badge variant="secondary" className="text-xs">Host</Badge>
                  </div>
                  {session.localParticipant.petName && (
                    <div className="glass-strong backdrop-blur-xl px-3 py-1 rounded-full mt-2">
                      <p className="text-white/90 text-xs">{session.localParticipant.petName}</p>
                    </div>
                  )}
                </div>

                <div className="absolute bottom-3 right-3 flex items-center gap-2">
                  {session.localParticipant.isMuted && (
                    <div className="glass-strong backdrop-blur-xl p-2 rounded-full">
                      <MicrophoneSlash size={16} weight="fill" className="text-red-400" />
                    </div>
                  )}
                  {!session.localParticipant.isVideoEnabled && isVideoCall && (
                    <div className="glass-strong backdrop-blur-xl p-2 rounded-full">
                      <VideoCameraSlash size={16} weight="fill" className="text-red-400" />
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {participantsArray.map(participant => 
              renderParticipantVideo(participant, participant.id)
            )}
          </div>

          {session.layout === 'sidebar' && (
            <div className="absolute top-0 right-0 bottom-0 w-80 p-4">
              <ScrollArea className="h-full">
                <div className="space-y-3">
                  <motion.div
                    layout
                    className="relative rounded-xl overflow-hidden bg-gradient-to-br from-primary/10 to-accent/10 aspect-video"
                  >
                    {isVideoCall && session.localParticipant.isVideoEnabled ? (
                      <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover mirror"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Avatar className="w-16 h-16">
                          <AvatarImage
                            src={session.localParticipant.avatar}
                            alt={session.localParticipant.name}
                          />
                          <AvatarFallback>
                            {session.localParticipant.name[0]}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    )}
                  </motion.div>
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        <AnimatePresence>
          {showParticipants && (
            <motion.div
              initial={{ x: 400, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 400, opacity: 0 }}
              className="absolute top-20 right-0 bottom-24 w-80 glass-strong backdrop-blur-2xl border-l border-border/50 z-30"
            >
              <div className="p-6 h-full flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-lg">Participants ({totalParticipants})</h3>
                  <Button
                    onClick={onInviteParticipants}
                    size="sm"
                    variant="outline"
                  >
                    <ShareNetwork size={16} weight="fill" className="mr-2" />
                    Invite
                  </Button>
                </div>

                <ScrollArea className="flex-1">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/10">
                      <Avatar className="w-10 h-10">
                        <AvatarImage
                          src={session.localParticipant.avatar}
                          alt={session.localParticipant.name}
                        />
                        <AvatarFallback>{session.localParticipant.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-semibold text-sm">You</p>
                        <p className="text-xs text-muted-foreground">
                          {session.localParticipant.petName}
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-xs">Host</Badge>
                    </div>

                    {participantsArray.map(participant => (
                      <div
                        key={participant.id}
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors"
                      >
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={participant.avatar} alt={participant.name} />
                          <AvatarFallback>{participant.name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-semibold text-sm">{participant.name}</p>
                          {participant.petName && (
                            <p className="text-xs text-muted-foreground">{participant.petName}</p>
                          )}
                        </div>
                        {raisedHands.has(participant.id) && (
                          <Hand size={16} weight="fill" className="text-yellow-500" />
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="absolute bottom-0 left-0 right-0 z-20 glass-strong backdrop-blur-2xl border-t border-border/50">
          <div className="px-6 py-4">
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="flex items-center justify-center gap-3"
            >
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={handleToggleMute}
                  size="icon"
                  className={cn(
                    'w-14 h-14 rounded-full shadow-xl',
                    session.localParticipant.isMuted
                      ? 'bg-red-500 hover:bg-red-600'
                      : 'bg-primary hover:bg-primary/90'
                  )}
                >
                  {session.localParticipant.isMuted ? (
                    <MicrophoneSlash size={24} weight="fill" className="text-white" />
                  ) : (
                    <Microphone size={24} weight="fill" className="text-white" />
                  )}
                </Button>
              </motion.div>

              {isVideoCall && (
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    onClick={handleToggleVideo}
                    size="icon"
                    className={cn(
                      'w-14 h-14 rounded-full shadow-xl',
                      !session.localParticipant.isVideoEnabled
                        ? 'bg-red-500 hover:bg-red-600'
                        : 'bg-primary hover:bg-primary/90'
                    )}
                  >
                    {session.localParticipant.isVideoEnabled ? (
                      <VideoCamera size={24} weight="fill" className="text-white" />
                    ) : (
                      <VideoCameraSlash size={24} weight="fill" className="text-white" />
                    )}
                  </Button>
                </motion.div>
              )}

              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={handleEndCall}
                  size="icon"
                  className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 shadow-2xl"
                >
                  <PhoneDisconnect size={28} weight="fill" className="text-white" />
                </Button>
              </motion.div>

              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={handleRaiseHand}
                  size="icon"
                  variant={raisedHands.has(session.localParticipant.id) ? 'default' : 'outline'}
                  className="w-14 h-14 rounded-full shadow-xl"
                >
                  <Hand
                    size={24}
                    weight="fill"
                    className={raisedHands.has(session.localParticipant.id) ? 'text-white' : ''}
                  />
                </Button>
              </motion.div>

              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  size="icon"
                  variant="outline"
                  className="w-14 h-14 rounded-full shadow-xl"
                >
                  <ChatCircle size={24} weight="fill" />
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      <style>{`
        .mirror {
          transform: scaleX(-1);
        }
      `}</style>
    </motion.div>
  )
}
