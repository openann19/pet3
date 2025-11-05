import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface GlowingBadgeProps {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'accent' | 'success' | 'warning'
  glow?: boolean
  pulse?: boolean
  className?: string
}

export function GlowingBadge({ 
  children, 
  variant = 'primary', 
  glow = true, 
  pulse = false,
  className 
}: GlowingBadgeProps) {
  const variants = {
    primary: 'bg-primary/10 text-primary border-primary/20',
    secondary: 'bg-secondary/10 text-secondary border-secondary/20',
    accent: 'bg-accent/10 text-accent border-accent/20',
    success: 'bg-green-500/10 text-green-600 border-green-500/20',
    warning: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20'
  }

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{
        scale: 1,
        opacity: 1,
        ...(glow ? {
          boxShadow: [
            '0 0 10px rgba(var(--primary), 0.3)',
            '0 0 20px rgba(var(--primary), 0.5)',
            '0 0 10px rgba(var(--primary), 0.3)',
          ]
        } : {})
      }}
      transition={{
        duration: 0.3,
        ...(glow ? { boxShadow: { duration: 2, repeat: Infinity } } : {})
      }}
      className={cn(
        'inline-flex items-center gap-1 px-3 py-1 rounded-full',
        'text-xs font-semibold border backdrop-blur-sm',
        variants[variant],
        className
      )}
    >
      {pulse && (
        <motion.span
          className="w-2 h-2 rounded-full bg-current"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
      {children}
    </motion.div>
  )
}
