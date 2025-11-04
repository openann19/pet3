import { motion, AnimatePresence } from 'framer-motion'
import { Plus } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { haptics } from '@/lib/haptics'

interface FloatingActionButtonProps {
  icon?: React.ReactNode
  onClick?: () => void
  className?: string
  expanded?: boolean
  label?: string
}

export function FloatingActionButton({ 
  icon = <Plus size={24} weight="bold" />, 
  onClick, 
  className,
  expanded = false,
  label
}: FloatingActionButtonProps) {
  return (
    <motion.button
      onClick={() => {
        haptics.impact('medium')
        onClick?.()
      }}
      className={cn(
        'fixed bottom-24 right-6 z-50 flex items-center gap-3 rounded-full',
        'bg-gradient-to-br from-primary via-accent to-secondary',
        'text-primary-foreground shadow-2xl',
        'overflow-hidden',
        className
      )}
      initial={{ scale: 0, rotate: -180 }}
      animate={{ 
        scale: 1, 
        rotate: 0,
        width: expanded ? 'auto' : '56px',
        paddingLeft: expanded ? '20px' : '0',
        paddingRight: expanded ? '20px' : '0'
      }}
      exit={{ scale: 0, rotate: 180 }}
      whileHover={{ scale: 1.1, rotate: 5 }}
      whileTap={{ scale: 0.95 }}
      transition={{ 
        type: 'spring', 
        stiffness: 400, 
        damping: 20 
      }}
    >
      <motion.div
        className="flex items-center justify-center"
        style={{ width: '56px', height: '56px' }}
        animate={{ rotate: expanded ? 45 : 0 }}
      >
        {icon}
      </motion.div>
      <AnimatePresence>
        {expanded && label && (
          <motion.span
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            className="font-semibold text-sm whitespace-nowrap"
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
      
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0"
        animate={{
          x: ['-100%', '100%']
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          repeatDelay: 3,
          ease: 'linear'
        }}
      />
    </motion.button>
  )
}
