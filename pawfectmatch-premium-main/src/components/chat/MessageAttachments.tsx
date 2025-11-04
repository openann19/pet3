import { useState } from 'react'
import { motion } from 'framer-motion'
import { Play, Pause, DownloadSimple } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import type { MessageAttachment } from '@/lib/chat-types'

interface MessageAttachmentsProps {
  attachments: MessageAttachment[]
}

export default function MessageAttachments({ attachments }: MessageAttachmentsProps) {
  return (
    <div className="space-y-2">
      {attachments.map((attachment) => {
        if (attachment.type === 'voice') {
          return <VoiceAttachment key={attachment.id} attachment={attachment} />
        }
        if (attachment.type === 'photo') {
          return <PhotoAttachment key={attachment.id} attachment={attachment} />
        }
        if (attachment.type === 'video') {
          return <VideoAttachment key={attachment.id} attachment={attachment} />
        }
        if (attachment.type === 'document') {
          return <DocumentAttachment key={attachment.id} attachment={attachment} />
        }
        return null
      })}
    </div>
  )
}

function VoiceAttachment({ attachment }: { attachment: MessageAttachment }) {
  const [isPlaying, setIsPlaying] = useState(false)

  const formatDuration = (seconds: number = 0) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const togglePlayback = () => {
    setIsPlaying(!isPlaying)
  }

  return (
    <div className="flex items-center gap-3 min-w-[200px]">
      <Button
        size="icon"
        variant="ghost"
        onClick={togglePlayback}
        className="flex-shrink-0 w-8 h-8"
      >
        {isPlaying ? (
          <Pause size={16} weight="fill" />
        ) : (
          <Play size={16} weight="fill" />
        )}
      </Button>

      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-0.5 h-4">
          {Array.from({ length: 30 }, () => 0.5).map((value: number, idx: number) => (
            <div
              key={idx}
              className="flex-1 bg-current opacity-40 rounded-full"
              style={{ height: `${value * 100}%` }}
            />
          ))}
        </div>
        <span className="text-[10px] opacity-70">
          {formatDuration(attachment.duration)}
        </span>
      </div>
    </div>
  )
}

function PhotoAttachment({ attachment }: { attachment: MessageAttachment }) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="relative rounded-lg overflow-hidden max-w-sm"
    >
      <img
        src={attachment.url}
        alt="Photo attachment"
        className="w-full h-auto"
      />
      <Button
        size="icon"
        variant="ghost"
        className="absolute top-2 right-2 bg-black/50 hover:bg-black/70"
      >
        <DownloadSimple size={16} weight="bold" />
      </Button>
    </motion.div>
  )
}

function VideoAttachment({ attachment }: { attachment: MessageAttachment }) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="relative rounded-lg overflow-hidden max-w-sm"
    >
      <video
        src={attachment.url}
        controls
        className="w-full h-auto"
        poster={attachment.thumbnail}
      />
    </motion.div>
  )
}

function DocumentAttachment({ attachment }: { attachment: MessageAttachment }) {
  const formatFileSize = (bytes: number = 0) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="flex items-center gap-3 p-3 glass-effect rounded-lg"
    >
      <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
        <span className="text-xs font-bold">DOC</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{attachment.name || 'Document'}</p>
        <p className="text-xs text-muted-foreground">
          {formatFileSize(attachment.size || 0)}
        </p>
      </div>
      <Button size="icon" variant="ghost">
        <DownloadSimple size={16} weight="bold" />
      </Button>
    </motion.div>
  )
}
