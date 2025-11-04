import { motion, type HTMLMotionProps } from 'framer-motion'
import { cn } from '@/lib/utils'
import { haptics } from '@/lib/haptics'

interface PremiumButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost' | 'gradient'
  size?: 'sm' | 'md' | 'lg'
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
  loading?: boolean
  children: React.ReactNode
}

export function PremiumButton({
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  loading = false,
  className,
  children,
  onClick,
  ...props
}: PremiumButtonProps) {
  const variants = {
    primary: 'bg-primary text-primary-foreground hover:opacity-90',
    secondary: 'bg-secondary text-secondary-foreground hover:opacity-90',
    accent: 'bg-accent text-accent-foreground hover:opacity-90',
    ghost: 'bg-transparent hover:bg-muted text-foreground',
    gradient: 'bg-gradient-to-r from-primary via-accent to-secondary text-primary-foreground'
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  }

  return (
    <motion.button
      onClick={(e) => {
        haptics.impact('light')
        onClick?.(e)
      }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      className={cn(
        'relative overflow-hidden rounded-xl font-semibold',
        'shadow-lg transition-all duration-300',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'flex items-center justify-center gap-2',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={loading}
      {...props}
    >
      {loading ? (
        <motion.div
          className="h-5 w-5 rounded-full border-2 border-current border-t-transparent"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      ) : (
        <>
          {icon && iconPosition === 'left' && icon}
          {children}
          {icon && iconPosition === 'right' && icon}
        </>
      )}

      <motion.div
        className="absolute inset-0 bg-white/20"
        initial={{ x: '-100%', skewX: -20 }}
        whileHover={{ x: '100%' }}
        transition={{ duration: 0.6 }}
      />
    </motion.button>
  )
}
