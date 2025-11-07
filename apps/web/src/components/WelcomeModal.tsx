import { useState, useEffect } from 'react'
import { useStorage } from '@/hooks/useStorage'
import { Heart, Sparkle, PawPrint, X } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { useApp } from '@/contexts/AppContext'
import { AnimatedView } from '@/effects/reanimated/animated-view'
import { useEntryAnimation } from '@/effects/reanimated/use-entry-animation'
import { useHoverLift } from '@/effects/reanimated/use-hover-lift'
import { useBounceOnTap } from '@/effects/reanimated/use-bounce-on-tap'
import { useSharedValue, useAnimatedStyle, withSpring, withTiming, withRepeat, withSequence } from 'react-native-reanimated'
import { isTruthy } from '@petspark/shared';

export default function WelcomeModal() {
  const { t } = useApp()
  const [hasSeenWelcome, setHasSeenWelcome] = useStorage<boolean>('has-seen-welcome', false)
  const [open, setOpen] = useState(false)
  const [_step, _setStep] = useState(0)

  // Animation hooks
  const containerEntry = useEntryAnimation({ initialOpacity: 0 })
  const titleEntry = useEntryAnimation({ initialY: 20, delay: 300 })
  const subtitleEntry = useEntryAnimation({ initialY: 20, delay: 400 })
  const buttonEntry = useEntryAnimation({ initialY: 20, delay: 1000 })
  const closeButtonHover = useHoverLift({ scale: 1.1 })
  const closeButtonRotate = useSharedValue(0)
  const closeButtonRotateStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${closeButtonRotate.value}deg` }],
  }))
  const closeButtonTap = useBounceOnTap({ scale: 0.9 })
  const buttonHover = useHoverLift({ scale: 1.05 })
  const buttonTap = useBounceOnTap({ scale: 0.95 })

  // Background gradient animation
  const bgScale = useSharedValue(1)
  const bgRotate = useSharedValue(0)
  const bgStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: bgScale.value },
      { rotate: `${bgRotate.value}deg` },
    ],
  }))

  // Heart icon animations
  const heartScale = useSharedValue(1)
  const heartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }))

  // Heart pulse animation
  const heartPulseScale = useSharedValue(1)
  const heartPulseOpacity = useSharedValue(0.5)
  const heartPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartPulseScale.value }],
    opacity: heartPulseOpacity.value,
  }))

  // Arrow animation
  const arrowX = useSharedValue(0)
  const arrowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: arrowX.value }],
  }))

  // Logo entry animation
  const logoScale = useSharedValue(0)
  const logoRotate = useSharedValue(-180)
  const logoStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: logoScale.value },
      { rotate: `${logoRotate.value}deg` },
    ],
  }))

  useEffect(() => {
    if (!hasSeenWelcome) {
      const timer = setTimeout(() => {
        setOpen(true)
      }, 500)
      return () => { clearTimeout(timer); }
    }
    return undefined
  }, [hasSeenWelcome])

  useEffect(() => {
    if (open) {
      // Background gradient animation
      bgScale.value = withRepeat(
        withSequence(
          withTiming(1.2, { duration: 4000 }),
          withTiming(1, { duration: 4000 })
        ),
        -1,
        true
      )
      bgRotate.value = withRepeat(
        withSequence(
          withTiming(5, { duration: 4000 }),
          withTiming(0, { duration: 4000 })
        ),
        -1,
        true
      )

      // Heart icon pulse
      heartScale.value = withRepeat(
        withSequence(
          withTiming(1.2, { duration: 750 }),
          withTiming(1, { duration: 750 })
        ),
        -1,
        true
      )

      // Heart pulse ring
      heartPulseScale.value = withRepeat(
        withSequence(
          withTiming(1.5, { duration: 2000 }),
          withTiming(1, { duration: 0 })
        ),
        -1,
        false
      )
      heartPulseOpacity.value = withRepeat(
        withSequence(
          withTiming(0, { duration: 2000 }),
          withTiming(0.5, { duration: 0 })
        ),
        -1,
        false
      )

      // Logo entry
      logoScale.value = withSpring(1, { stiffness: 200, damping: 15 })
      logoRotate.value = withSpring(0, { stiffness: 200, damping: 15 })

      // Arrow animation
      arrowX.value = withRepeat(
        withSequence(
          withTiming(5, { duration: 750 }),
          withTiming(0, { duration: 750 })
        ),
        -1,
        true
      )
    }
  }, [open, bgScale, bgRotate, heartScale, heartPulseScale, heartPulseOpacity, logoScale, logoRotate, arrowX])

  const handleClose = () => {
    setHasSeenWelcome(true)
    setOpen(false)
  }

  const features = [
    {
      icon: PawPrint,
      title: t.welcome.proof1,
      description: 'AI-powered matching algorithm finds perfect companions for your pet',
      color: 'from-primary/20 to-primary/5',
      iconColor: 'text-primary',
    },
    {
      icon: Sparkle,
      title: t.welcome.proof2,
      description: 'Secure messaging platform to connect with other pet owners',
      color: 'from-accent/20 to-accent/5',
      iconColor: 'text-accent',
    },
    {
      icon: Heart,
      title: t.welcome.proof3,
      description: 'Join thousands of verified pet owners in our community',
      color: 'from-secondary/20 to-secondary/5',
      iconColor: 'text-secondary',
    },
  ]

  if (isTruthy(hasSeenWelcome)) return null

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden border-0">
        <AnimatedView 
          className="relative bg-gradient-to-br from-primary/10 via-accent/10 to-secondary/10 p-8 md:p-12 overflow-hidden"
          style={containerEntry.animatedStyle}
        >
          <AnimatedView
            className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-accent/20"
            style={bgStyle}
          />
          
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors z-10 shadow-md"
            onMouseEnter={() => {
              closeButtonHover.handleEnter()
              closeButtonRotate.value = withSpring(90)
            }}
            onMouseLeave={() => {
              closeButtonHover.handleLeave()
              closeButtonRotate.value = withSpring(0)
            }}
            onMouseDown={closeButtonTap.handlePress}
          >
            <AnimatedView style={closeButtonRotateStyle}>
              <X size={16} />
            </AnimatedView>
          </button>

          <AnimatedView
            className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-6 shadow-2xl relative z-10"
            style={logoStyle}
          >
            <AnimatedView style={heartStyle}>
              <Heart size={40} className="text-white" weight="fill" />
            </AnimatedView>
            <AnimatedView
              className="absolute inset-0 rounded-full bg-gradient-to-br from-primary to-accent"
              style={heartPulseStyle}
            />
          </AnimatedView>

          <AnimatedView
            className="text-3xl md:text-4xl font-bold text-center mb-4 relative z-10"
            style={titleEntry.animatedStyle}
          >
            {t.welcome.title} 🐾
          </AnimatedView>

          <AnimatedView
            className="text-center text-muted-foreground text-lg mb-8 max-w-xl mx-auto relative z-10"
            style={subtitleEntry.animatedStyle}
          >
            {t.welcome.subtitle}
          </AnimatedView>

          <div className="grid md:grid-cols-3 gap-6 mb-8 relative z-10">
            {features.map((feature, idx) => {
              const featureEntry = useEntryAnimation({ 
                initialY: 30, 
                initialScale: 0.8, 
                delay: 500 + idx * 150
              })
              const featureHover = useHoverLift({ scale: 1.05, translateY: -5 })
              const iconRotate = useSharedValue(0)
              const iconStyle = useAnimatedStyle(() => ({
                transform: [{ rotate: `${iconRotate.value}deg` }],
              }))

              return (
                <AnimatedView
                  key={feature.title}
                  className="text-center"
                  style={[featureEntry.animatedStyle, featureHover.animatedStyle]}
                  onMouseEnter={featureHover.handleEnter}
                  onMouseLeave={featureHover.handleLeave}
                >
                  <AnimatedView 
                    className={`w-16 h-16 rounded-full bg-gradient-to-br ${String(feature.color ?? '')} flex items-center justify-center mx-auto mb-3 shadow-lg`}
                    style={iconStyle}
                    onMouseEnter={() => {
                      iconRotate.value = withSequence(
                        withTiming(-10, { duration: 125 }),
                        withTiming(10, { duration: 125 }),
                        withTiming(0, { duration: 125 })
                      )
                    }}
                  >
                    <feature.icon size={32} className={feature.iconColor} weight="fill" />
                  </AnimatedView>
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </AnimatedView>
              )
            })}
          </div>

          <AnimatedView
            className="flex justify-center relative z-10"
            style={buttonEntry.animatedStyle}
          >
            <AnimatedView 
              style={[buttonHover.animatedStyle, buttonTap.animatedStyle]}
              onMouseEnter={buttonHover.handleEnter}
              onMouseLeave={buttonHover.handleLeave}
              onMouseDown={buttonTap.handlePress}
            >
              <Button 
                size="lg" 
                onClick={handleClose} 
                className="px-8 shadow-xl bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
              >
                {t.welcome.getStarted}
                <AnimatedView
                  className="ml-2 inline-block"
                  style={arrowStyle}
                >
                  →
                </AnimatedView>
              </Button>
            </AnimatedView>
          </AnimatedView>
        </AnimatedView>
      </DialogContent>
    </Dialog>
  )
}
