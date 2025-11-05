import { motion, type HTMLMotionProps } from 'framer-motion'
import { cn } from '@/lib/utils'

interface PremiumCardProps extends HTMLMotionProps<'div'> {
  variant?: 'default' | 'glass' | 'elevated' | 'gradient'
  hover?: boolean
  glow?: boolean
}

export function PremiumCard({ 
  variant = 'default', 
  hover = true, 
  glow = false,
  className, 
  children, 
  ...props 
}: PremiumCardProps) {
  const variants = {
    default: 'bg-card border border-border',
    glass: 'glass-card',
    elevated: 'bg-card border border-border premium-shadow-lg',
    gradient: 'premium-gradient text-primary-foreground border-none'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      {...(hover ? { 
        whileHover: { 
          y: -8, 
          scale: 1.02,
          transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] }
        } 
      } : {})}
      className={cn(
        'rounded-xl p-6 transition-all duration-300',
        variants[variant],
        hover && 'cursor-pointer hover-lift-premium',
        glow && 'animate-glow-ring',
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  )
}
