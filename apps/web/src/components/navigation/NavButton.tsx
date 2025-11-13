'use client'
import { motion } from 'framer-motion';

import { type ReactNode } from 'react'
import { AnimatedView } from '@/hooks/use-animated-style-value'
import { useNavButtonAnimation } from '@/hooks/use-nav-button-animation'
import { useBounceOnTap } from '@/effects/reanimated/use-bounce-on-tap'
import type { AnimatedStyle } from '@/hooks/use-animated-style-value'
import { getSpacing } from '@/lib/design-tokens'
import { getTypographyClasses } from '@/lib/typography'
import { cn } from '@/lib/utils'

export interface NavButtonProps {
  isActive: boolean
  onClick: () => void
  icon: ReactNode
  label: string
  className?: string
  enablePulse?: boolean
  enableIconAnimation?: boolean
  showIndicator?: boolean
}

export function NavButton({
  isActive,
  onClick,
  icon,
  label,
  className = '',
  enablePulse = true,
  enableIconAnimation = true,
  showIndicator = true,
}: NavButtonProps): React.ReactElement {
  const animation = useNavButtonAnimation({
    isActive,
    enablePulse,
    enableRotation: false,
    hapticFeedback: true,
  })

  const bounceAnimation = useBounceOnTap({
    onPress: onClick,
    hapticFeedback: true,
  })

  const handleMouseEnter = (): void => {
    animation.handleHover()
  }

  const handleMouseLeave = (): void => {
    animation.handleLeave()
  }

  const activeClasses = isActive
    ? 'bg-blue-100 text-blue-700 rounded-lg px-3 py-2 font-semibold'
    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'

  const animationTransforms = (animation.buttonStyle as { transform?: Record<string, unknown>[] })?.transform ?? []
  const bounceTransforms = (bounceAnimation.animatedStyle as { transform?: Record<string, unknown>[] })?.transform ?? []

  const combinedStyle: AnimatedStyle = {
    ...(animation.buttonStyle as Record<string, unknown>),
    transform: [...animationTransforms, ...bounceTransforms],
  }

  // Use spacing tokens for min-width: 60px (spacing 15) and 70px (spacing 17.5, use 18 as closest)
  const minWidthStyle = { minWidth: getSpacing('15') }
  const smMinWidthStyle = { minWidth: getSpacing('18') }

  return (
    <motion.div
      style={{ ...combinedStyle, ...minWidthStyle, [`@media (min-width: 640px)`]: smMinWidthStyle } as React.CSSProperties}
      className={cn('flex flex-col items-center gap-0.5 sm:gap-1 px-2 sm:px-3 py-2 rounded-xl transition-all duration-300 relative', activeClasses, className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={bounceAnimation.handlePress}
      role="button"
      tabIndex={0}
      onKeyDown={(e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          bounceAnimation.handlePress()
        }
      }}
    >
      <motion.div
        style={enableIconAnimation ? animation.iconStyle : undefined}
        className="relative"
      >
        {icon}
      </motion.div>
      <span className={cn(getTypographyClasses('caption'), 'sm:text-xs font-semibold leading-tight')}>{label}</span>
      {isActive && showIndicator && (
        <motion.div
          style={animation.indicatorStyle}
          className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-8 h-1 bg-linear-to-r from-primary via-accent to-secondary rounded-full shadow-lg shadow-primary/50"
        >
          <div />
        </motion.div>
      )}
    </motion.div>
  )
}
