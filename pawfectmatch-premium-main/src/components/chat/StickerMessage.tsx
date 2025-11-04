import { useState } from 'react'
import { motion } from 'framer-motion'
import { getAnimationClass, type Sticker } from '@/lib/sticker-library'
import { cn } from '@/lib/utils'

interface StickerMessageProps {
  sticker: Sticker
  isOwn?: boolean
  onHover?: () => void
}

export function StickerMessage({ sticker, isOwn = false, onHover }: StickerMessageProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 500, damping: 25 }}
      className={cn(
        "flex items-center",
        isOwn ? "justify-end" : "justify-start"
      )}
    >
      <motion.div
        onHoverStart={() => {
          setIsHovered(true)
          onHover?.()
        }}
        onHoverEnd={() => setIsHovered(false)}
        className={cn(
          "relative cursor-default select-none sticker-message p-2 rounded-2xl",
          isHovered && "bg-muted/30"
        )}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <motion.span
          className={cn(
            "block",
            isHovered && sticker.animation && getAnimationClass(sticker.animation)
          )}
        >
          {sticker.emoji}
        </motion.span>
      </motion.div>
    </motion.div>
  )
}
