import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  PhoneDisconnect,
  Microphone,
  MicrophoneSlash,
  VideoCamera,
  VideoCameraSlash,
  SpeakerHigh,
  SpeakerSlash,
  ArrowsOut,
  ArrowsIn,
  MonitorPlay
} from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import type { CallSession } from '@/lib/call-types'
import { formatCallDuration } from '@/lib/call-utils'
import { haptics } from '@/lib/haptics'

interface CallInterfaceProps {
  session: CallSession
  onEndCall: () => void
  onToggleMute: () => void
  onToggleVideo: () => void
  onToggleSpeaker?: () => void
  onMinimize?: () => void
}

export default function CallInterface({
  session,
  onEndCall,
  onToggleMute,
  onToggleVideo,
  onToggleSpeaker,
  onMinimize: _onMinimize
}: CallInterfaceProps) {
  const [duration, setDuration] = useState(0)
  const [isSpeakerOn, setIsSpeakerOn] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [audioWaveform, setAudioWaveform] = useState<number[]>(
    Array.from({ length: 30 }, () => 0.5)
  )
  const videoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const animationFrameRef = useRef<number | null>(null)

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
    if (videoRef.current && session.localStream) {
      videoRef.current.srcObject = session.localStream
    }
  }, [session.localStream])

  useEffect(() => {
    if (remoteVideoRef.current && session.remoteStream) {
      remoteVideoRef.current.srcObject = session.remoteStream
    }
  }, [session.remoteStream])

  useEffect(() => {
    if (!session.localParticipant.isMuted && session.call.status === 'active') {
      const updateWaveform = () => {
        setAudioWaveform(prev => 
          prev.map(() => Math.random() * 0.6 + 0.2)
        )
        animationFrameRef.current = requestAnimationFrame(updateWaveform)
      }
      updateWaveform()
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      setAudioWaveform(Array.from({ length: 30 }, () => 0.2))
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [session.localParticipant.isMuted, session.call.status])

  const handleToggleSpeaker = () => {
    haptics.trigger('selection')
    setIsSpeakerOn(!isSpeakerOn)
    onToggleSpeaker?.()
  }

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

  const isVideoCall = session.call.type === 'video'
  const isActive = session.call.status === 'active'

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`fixed inset-0 z-50 flex items-center justify-center ${
        isFullscreen ? 'bg-black' : 'bg-black/90 backdrop-blur-xl p-4'
      }`}
    >
      <motion.div
        className={`relative w-full ${
          isFullscreen ? 'h-full' : 'max-w-2xl h-[80vh]'
        } bg-linear-to-br from-primary/20 via-background/95 to-accent/20 rounded-3xl overflow-hidden shadow-2xl`}
        layout
      >
        {isVideoCall && session.remoteParticipant.isVideoEnabled ? (
          <div className="absolute inset-0">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-linear-to-b from-black/40 via-transparent to-black/60" />
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              animate={{
                scale: [1, 1.05, 1],
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="flex flex-col items-center"
            >
              <Avatar className="w-40 h-40 ring-4 ring-white/30 mb-6">
                <AvatarImage
                  src={session.remoteParticipant.avatar}
                  alt={session.remoteParticipant.name}
                />
                <AvatarFallback className="bg-linear-to-br from-primary to-accent text-white text-5xl font-bold">
                  {session.remoteParticipant.name[0]}
                </AvatarFallback>
              </Avatar>

              {!session.remoteParticipant.isMuted && isActive && (
                <motion.div className="flex items-center gap-1 h-16">
                  {audioWaveform.map((value, idx) => (
                    <motion.div
                      key={idx}
                      className="w-1.5 bg-primary rounded-full"
                      animate={{ height: `${value * 64}px` }}
                      transition={{ duration: 0.15 }}
                    />
                  ))}
                </motion.div>
              )}
            </motion.div>
          </div>
        )}

        {isVideoCall && session.localParticipant.isVideoEnabled && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute top-6 right-6 w-40 h-28 rounded-2xl overflow-hidden shadow-2xl ring-2 ring-white/30"
            drag
            dragConstraints={{ top: 0, left: 0, right: 0, bottom: 0 }}
            dragElastic={0.1}
          >
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover mirror"
            />
          </motion.div>
        )}

        <div className="absolute top-6 left-6 z-10">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-strong rounded-2xl px-4 py-3 backdrop-blur-2xl"
          >
            <h3 className="font-bold text-white text-lg mb-1">
              {session.remoteParticipant.name}
            </h3>
            <div className="flex items-center gap-2">
              {isActive ? (
                <>
                  <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [1, 0.5, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-2 h-2 bg-green-500 rounded-full"
                  />
                  <span className="text-sm text-white/90 font-medium">
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
                  <span className="text-sm text-white/90">
                    {session.call.status === 'ringing' ? 'Ringing...' : 'Connecting...'}
                  </span>
                </>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <div className="flex items-center gap-1">
                <div className={`w-1.5 h-1.5 rounded-full ${
                  session.call.quality === 'excellent' ? 'bg-green-500' :
                  session.call.quality === 'good' ? 'bg-blue-500' :
                  session.call.quality === 'fair' ? 'bg-yellow-500' : 'bg-red-500'
                }`} />
                <span className="text-xs text-white/70 capitalize">{session.call.quality}</span>
              </div>
              {session.call.actualResolution && (
                <>
                  <span className="text-white/40">•</span>
                  <div className="flex items-center gap-1">
                    <MonitorPlay size={14} className="text-white/70" weight="fill" />
                    <span className="text-xs text-white/70 font-semibold">{session.call.actualResolution}</span>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </div>

        <div className="absolute top-6 right-6 z-10">
          {isVideoCall && (
            <Button
              onClick={handleToggleFullscreen}
              size="icon"
              variant="ghost"
              className="glass-strong backdrop-blur-2xl text-white hover:bg-white/20"
            >
              {isFullscreen ? <ArrowsIn size={20} /> : <ArrowsOut size={20} />}
            </Button>
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-8">
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex items-center justify-center gap-4"
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={handleToggleMute}
                size="icon"
                className={`w-14 h-14 rounded-full shadow-xl ${
                  session.localParticipant.isMuted
                    ? 'bg-red-500 hover:bg-red-600'
                    : 'glass-strong backdrop-blur-2xl hover:bg-white/20'
                }`}
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
                  className={`w-14 h-14 rounded-full shadow-xl ${
                    !session.localParticipant.isVideoEnabled
                      ? 'bg-red-500 hover:bg-red-600'
                      : 'glass-strong backdrop-blur-2xl hover:bg-white/20'
                  }`}
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
                onClick={handleToggleSpeaker}
                size="icon"
                className={`w-14 h-14 rounded-full shadow-xl ${
                  !isSpeakerOn
                    ? 'bg-yellow-500 hover:bg-yellow-600'
                    : 'glass-strong backdrop-blur-2xl hover:bg-white/20'
                }`}
              >
                {isSpeakerOn ? (
                  <SpeakerHigh size={24} weight="fill" className="text-white" />
                ) : (
                  <SpeakerSlash size={24} weight="fill" className="text-white" />
                )}
              </Button>
            </motion.div>
          </motion.div>
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
