'use client'

import type { ComponentProps, MouseEvent } from 'react'
import { forwardRef, useRef, useCallback } from 'react'
import type { buttonVariants } from '@/components/ui/button'
import { Button } from '@/components/ui/button'
import type { VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { createLogger } from '@/lib/logger'
import { AnimatedView } from '@/effects/reanimated/animated-view'
import { haptics } from '@/lib/haptics'
import { useSharedValue, useAnimatedStyle, withTiming, withSequence, withSpring, useCallback } from 'react-native-reanimated'
import { useEffect } from 'react'
import type { AnimatedStyle } from '@/effects/reanimated/animated-view'
import { springConfigs } from '@/effects/reanimated/transitions'
import { isTruthy } from '@petspark/shared'

const logger = createLogger('EnhancedButton')

function usePressBounce(scaleOnPress = 0.95) {
  const scale = useSharedValue(1)

  const onPressIn = useCallback(() => {
    scale.value = withSpring(scaleOnPress, springConfigs.smooth)
  }, [scale, scaleOnPress])

  const onPressOut = useCallback(() => {
    scale.value = withSpring(1, springConfigs.smooth)
  }, [scale])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  })) as AnimatedStyle

  return { onPressIn, onPressOut, animatedStyle }
}

export interface EnhancedButtonProps extends ComponentProps<'button'>, VariantProps<typeof buttonVariants> {
  ripple?: boolean
  hapticFeedback?: boolean
  successAnimation?: boolean
  asChild?: boolean
}

export const EnhancedButton = forwardRef<HTMLButtonElement, EnhancedButtonProps>(
  ({ 
    ripple = true, 
    hapticFeedback = true,
    successAnimation = false,
    onClick,
    className,
    children,
    ...props 
  }, ref) => {
    const buttonRef = useRef<HTMLButtonElement>(null)
    const bounceAnimation = usePressBounce(0.95)
    const successScale = useSharedValue(1)
    const errorShake = useSharedValue(0)

    const isPromise = useCallback((value: unknown): value is Promise<unknown> => {
      return value != null && 
             typeof value === 'object' && 
             'then' in value && 
             typeof (value as Promise<unknown>).then === 'function'
    }, [])

    const successAnimatedStyle = useAnimatedStyle(() => {
      return {
        transform: [{ scale: successScale.value }]
      }
    }) as AnimatedStyle

    const errorAnimatedStyle = useAnimatedStyle(() => {
      return {
        transform: [{ translateX: errorShake.value }]
      }
    }) as AnimatedStyle

    useEffect(() => {
      // Reset success scale when component mounts
      successScale.value = 1
    }, [successScale])

    const handleClick = useCallback(async (e: MouseEvent<HTMLButtonElement>): Promise<void> => {
      try {
        if (isTruthy(hapticFeedback)) {
          haptics.impact('light')
        }

        bounceAnimation.onPressIn()

        if (isTruthy(onClick)) {
          const result = onClick(e)
          
          if (isPromise(result)) {
            await result
            
            if (isTruthy(successAnimation)) {
              successScale.value = withSequence(
                withSpring(1.1, springConfigs.bouncy),
                withSpring(1, springConfigs.smooth)
              )
              if (isTruthy(hapticFeedback)) {
                haptics.impact('medium')
              }
              logger.info('Button action succeeded', { successAnimation: true })
            }
          }
        }
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        errorShake.value = withSequence(
          withTiming(-5, { duration: 50 }),
          withTiming(5, { duration: 50 }),
          withTiming(-5, { duration: 50 }),
          withTiming(5, { duration: 50 }),
          withTiming(0, { duration: 50 })
        )
        if (isTruthy(hapticFeedback)) {
          haptics.impact('heavy')
        }
        logger.error('Button action failed', err)
      } finally {
        bounceAnimation.onPressOut()
      }
    }, [
      hapticFeedback,
      successAnimation,
      onClick,
      bounceAnimation,
      successScale,
      errorShake,
      isPromise
    ])

    return (
      <AnimatedView
        style={successAnimatedStyle}
        className="relative"
      >
        <AnimatedView
          style={errorAnimatedStyle}
          className="relative"
        >
          <AnimatedView
            style={bounceAnimation.animatedStyle}
            className="relative"
          >
            <div className="relative overflow-hidden">
              <Button
                ref={ref || buttonRef}
                onClick={handleClick}
                className={cn(
                  'relative overflow-hidden transition-all duration-300',
                  'hover:shadow-lg hover:-translate-y-0.5',
                  'active:translate-y-0 active:shadow-md',
                  className
                )}
                {...props}
              >
                {children}
              </Button>
            </div>
          </AnimatedView>
        </AnimatedView>
      </AnimatedView>
    )
  }
)

EnhancedButton.displayName = 'EnhancedButton'
