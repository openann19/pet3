import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { cardHover, tapShrink, fadeInUp } from '@/lib/animations'
import type { ReactNode } from 'react'

interface AnimatedCardProps {
  children: ReactNode
  className?: string
  onClick?: () => void
  hover?: boolean
  variant?: 'default' | 'glass' | 'gradient' | 'glow'
  delay?: number
}

export function AnimatedCard({
  children,
  className,
  onClick,
  hover = true,
  variant = 'default',
  delay = 0
}: AnimatedCardProps) {
  const variantClasses = {
    default: 'bg-card border border-border',
    glass: 'glass-card',
    gradient: 'gradient-card',
    glow: 'bg-card border border-border animate-glow-ring'
  }

  return (
    <motion.div
      variants={fadeInUp}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ delay }}
      whileHover={hover && onClick ? cardHover : undefined}
      whileTap={onClick ? tapShrink : undefined}
      onClick={onClick}
      className={cn(onClick && 'cursor-pointer')}
    >
      <Card className={cn(
        'transition-all duration-300',
        variantClasses[variant],
        className
      )}>
        {children}
      </Card>
    </motion.div>
  )
}
