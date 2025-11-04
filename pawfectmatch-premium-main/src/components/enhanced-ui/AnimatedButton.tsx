import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { haptics } from '@/lib/haptics'
import { buttonHover, tapShrink } from '@/lib/animations'
import type { ReactNode } from 'react'

interface AnimatedButtonProps {
  children: ReactNode
  onClick?: () => void
  variant?: 'default' | 'secondary' | 'ghost' | 'outline' | 'destructive' | 'link'
  size?: 'sm' | 'default' | 'lg' | 'icon'
  className?: string
  disabled?: boolean
  shimmer?: boolean
  glow?: boolean
  pulse?: boolean
  type?: 'button' | 'submit' | 'reset'
}

export function AnimatedButton({
  children,
  onClick,
  variant = 'default',
  size = 'default',
  className,
  disabled = false,
  shimmer = false,
  glow = false,
  pulse = false,
  type = 'button'
}: AnimatedButtonProps) {
  const handleClick = () => {
    if (!disabled) {
      haptics.impact('light')
      onClick?.()
    }
  }

  return (
    <motion.div
      whileHover={!disabled ? buttonHover : undefined}
      whileTap={!disabled ? tapShrink : undefined}
      className="inline-block"
    >
      <Button
        variant={variant}
        size={size}
        onClick={handleClick}
        disabled={disabled}
        type={type}
        className={cn(
          'relative overflow-hidden',
          glow && 'shadow-lg shadow-primary/20',
          pulse && 'animate-pulse-glow',
          className
        )}
      >
        {shimmer && !disabled && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            animate={{
              x: ['-100%', '200%']
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 1,
              ease: 'linear'
            }}
          />
        )}
        <span className="relative z-10">{children}</span>
      </Button>
    </motion.div>
  )
}
