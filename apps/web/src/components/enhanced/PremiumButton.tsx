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
    primary: 'bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)] hover:bg-[var(--btn-primary-hover-bg)] hover:text-[var(--btn-primary-hover-fg)] active:bg-[var(--btn-primary-press-bg)] active:text-[var(--btn-primary-press-fg)] disabled:bg-[var(--btn-primary-disabled-bg)] disabled:text-[var(--btn-primary-disabled-fg)] focus-visible:ring-2 focus-visible:ring-[var(--btn-primary-focus-ring)]',
    secondary: 'bg-[var(--btn-secondary-bg)] text-[var(--btn-secondary-fg)] hover:bg-[var(--btn-secondary-hover-bg)] hover:text-[var(--btn-secondary-hover-fg)] active:bg-[var(--btn-secondary-press-bg)] active:text-[var(--btn-secondary-press-fg)] disabled:bg-[var(--btn-secondary-disabled-bg)] disabled:text-[var(--btn-secondary-disabled-fg)] focus-visible:ring-2 focus-visible:ring-[var(--btn-secondary-focus-ring)]',
    accent: 'bg-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)] hover:bg-[var(--btn-primary-hover-bg)] hover:text-[var(--btn-primary-hover-fg)] active:bg-[var(--btn-primary-press-bg)] active:text-[var(--btn-primary-press-fg)] disabled:bg-[var(--btn-primary-disabled-bg)] disabled:text-[var(--btn-primary-disabled-fg)] focus-visible:ring-2 focus-visible:ring-[var(--btn-primary-focus-ring)]',
    ghost: 'bg-[var(--btn-ghost-bg)] text-[var(--btn-ghost-fg)] hover:bg-[var(--btn-ghost-hover-bg)] hover:text-[var(--btn-ghost-hover-fg)] active:bg-[var(--btn-ghost-press-bg)] active:text-[var(--btn-ghost-press-fg)] disabled:bg-[var(--btn-ghost-disabled-bg)] disabled:text-[var(--btn-ghost-disabled-fg)] focus-visible:ring-2 focus-visible:ring-[var(--btn-ghost-focus-ring)]',
    gradient: 'bg-gradient-to-r from-[var(--btn-primary-bg)] via-[var(--btn-secondary-bg)] to-[var(--btn-primary-bg)] text-[var(--btn-primary-fg)] hover:from-[var(--btn-primary-hover-bg)] hover:via-[var(--btn-secondary-hover-bg)] hover:to-[var(--btn-primary-hover-bg)] active:from-[var(--btn-primary-press-bg)] active:via-[var(--btn-secondary-press-bg)] active:to-[var(--btn-primary-press-bg)] disabled:from-[var(--btn-primary-disabled-bg)] disabled:via-[var(--btn-secondary-disabled-bg)] disabled:to-[var(--btn-primary-disabled-bg)] disabled:text-[var(--btn-primary-disabled-fg)] focus-visible:ring-2 focus-visible:ring-[var(--btn-primary-focus-ring)]'                                                                   
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-sm min-h-[44px] min-w-[44px]',
    md: 'px-4 py-2 text-base min-h-[44px] min-w-[44px]',
    lg: 'px-6 py-3 text-lg min-h-[44px] min-w-[44px]'
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
        'disabled:cursor-not-allowed',
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


    </motion.button>
  )
}
