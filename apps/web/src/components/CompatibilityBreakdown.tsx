import { AnimatedView } from '@/effects/reanimated/animated-view'
import { useEntryAnimation } from '@/effects/reanimated/use-entry-animation'
import { useHoverLift } from '@/effects/reanimated/use-hover-lift'
import { timingConfigs } from '@/effects/reanimated/transitions'
import { useSharedValue, useAnimatedStyle, withTiming, withRepeat, withSequence, withDelay, Easing } from 'react-native-reanimated'
import type { CompatibilityFactors } from '@/lib/types'
import { useEffect, useState } from 'react'

interface CompatibilityBreakdownProps {
  factors: CompatibilityFactors
  className?: string
}

const factorLabels = {
  personalityMatch: 'Personality',
  interestMatch: 'Shared Interests',
  sizeMatch: 'Size Compatibility',
  ageCompatibility: 'Age Match',
  locationProximity: 'Location',
}

const factorIcons = {
  personalityMatch: '🎭',
  interestMatch: '🎾',
  sizeMatch: '📏',
  ageCompatibility: '🎂',
  locationProximity: '📍',
}

const factorColors = {
  personalityMatch: 'from-primary to-primary/60',
  interestMatch: 'from-accent to-accent/60',
  sizeMatch: 'from-secondary to-secondary/60',
  ageCompatibility: 'from-lavender to-lavender/60',
  locationProximity: 'from-primary to-accent',
}

// Factor item component with animations
function FactorItem({ 
  index, 
  label, 
  icon, 
  percentage, 
  colorClass 
}: { 
  index: number
  label: string
  icon: string
  percentage: number
  colorClass: string
}) {
  const entryOpacity = useSharedValue(0)
  const entryX = useSharedValue(-20)
  useEffect(() => {
    entryOpacity.value = withDelay(
      index * 100,
      withTiming(1, { duration: 300 })
    )
    entryX.value = withDelay(
      index * 100,
      withTiming(0, { duration: 300 })
    )
  }, [index, entryOpacity, entryX])
  const entryStyle = useAnimatedStyle(() => ({
    opacity: entryOpacity.value,
    transform: [{ translateX: entryX.value }]
  }))
  const hover = useHoverLift({ scale: 1.02, translateY: 0 })
  
  // Icon hover animation
  const iconHover = useSharedValue(1)
  const iconRotation = useSharedValue(0)
  const iconHoverStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: iconHover.value },
      { rotate: `${iconRotation.value}deg` }
    ]
  }))
  
  const handleIconMouseEnter = (): void => {
    iconHover.value = withTiming(1.3, { duration: 250 })
    iconRotation.value = withTiming(360, { duration: 500 })
  }
  
  const handleIconMouseLeave = (): void => {
    iconHover.value = withTiming(1, { duration: 250 })
    iconRotation.value = withTiming(0, { duration: 250 })
  }
  
  // Percentage animation
  const percentageOpacity = useSharedValue(0)
  const percentageScale = useSharedValue(0)
  useEffect(() => {
    percentageOpacity.value = withDelay(
      index * 100 + 300,
      withTiming(1, { duration: 300 })
    )
    percentageScale.value = withDelay(
      index * 100 + 300,
      withTiming(1, { duration: 300 })
    )
  }, [index, percentageOpacity, percentageScale])
  const percentageEntry = useAnimatedStyle(() => ({
    opacity: percentageOpacity.value,
    transform: [{ scale: percentageScale.value }]
  }))
  
  // Progress bar width animation
  const progressWidth = useSharedValue(0)
  useEffect(() => {
    progressWidth.value = withDelay(
      index * 100 + 200,
      withTiming(percentage, { 
        duration: 800,
        easing: timingConfigs.smooth.easing ?? ((v: number) => v)
      })
    )
  }, [percentage, index, progressWidth])
  
  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`
  }))
  
  // Shimmer animation
  const shimmerX = useSharedValue(-100)
  useEffect(() => {
    shimmerX.value = withDelay(
      index * 100 + 500,
      withRepeat(
        withSequence(
          withTiming(200, { duration: 1500, easing: (value: number) => Easing.linear(value) }),
          withTiming(-100, { duration: 0 })
        ),
        -1,
        false
      )
    )
  }, [index, shimmerX])
  
  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: `${shimmerX.value}%` }]
  }))
  
  return (
    <AnimatedView
      style={[entryStyle, hover.animatedStyle]}
      onMouseEnter={hover.handleEnter}
      onMouseLeave={hover.handleLeave}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium flex items-center gap-2">
          <AnimatedView
            style={iconHoverStyle}
            onMouseEnter={handleIconMouseEnter}
            onMouseLeave={handleIconMouseLeave}
            className="inline-block cursor-pointer"
          >
            {icon}
          </AnimatedView>
          {label}
        </span>
        <AnimatedView 
          style={percentageEntry}
          className="text-sm font-bold text-muted-foreground tabular-nums"
        >
          {percentage}%
        </AnimatedView>
      </div>
      <div className="relative">
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <AnimatedView
            style={progressStyle}
            className={`h-full bg-linear-to-r ${String(colorClass ?? '')} rounded-full relative overflow-hidden`}
          >
            <AnimatedView
              style={shimmerStyle}
              className="absolute inset-0 bg-white/30"
            />
          </AnimatedView>
        </div>
      </div>
    </AnimatedView>
  )
}

export default function CompatibilityBreakdown({ factors, className }: CompatibilityBreakdownProps) {
  const [animatedValues, setAnimatedValues] = useState<Record<string, number>>({})
  const headerEntry = useEntryAnimation({ initialY: -10, initialOpacity: 0 })
  
  // Rotating emoji animation
  const emojiRotation = useSharedValue(0)
  useEffect(() => {
    emojiRotation.value = withRepeat(
      withSequence(
        withTiming(10, { duration: 500 }),
        withTiming(-10, { duration: 500 }),
        withTiming(0, { duration: 500 })
      ),
      -1,
      true
    )
  }, [emojiRotation])
  const emojiStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${emojiRotation.value}deg` }]
  }))

  useEffect(() => {
    const timer = setTimeout(() => {
      const values: Record<string, number> = {
        personalityMatch: factors.personalityMatch,
        interestMatch: factors.interestMatch,
        sizeMatch: factors.sizeMatch,
        ageCompatibility: factors.ageCompatibility,
        locationProximity: factors.locationProximity,
      }
      setAnimatedValues(values)
    }, 100)
    return () => { clearTimeout(timer); }
  }, [factors])

  return (
    <div className={`rounded-3xl glass-strong premium-shadow backdrop-blur-2xl border border-white/20 ${String(className ?? '')}`}>
      <div className="p-6 bg-linear-to-br from-white/20 to-white/10">
        <AnimatedView 
          style={headerEntry.animatedStyle}
          className="text-lg font-bold mb-4 flex items-center gap-2 bg-linear-to-r from-primary via-accent to-secondary bg-clip-text text-transparent"
        >
          <AnimatedView style={emojiStyle} className="inline-block">
            📊
          </AnimatedView>
          Compatibility Breakdown
        </AnimatedView>
        <div className="space-y-4">
          {Object.entries(factors).map(([key, _value], idx) => {
            const animatedPercentage = Math.round((animatedValues[key] ?? 0) * 100)
            const label = factorLabels[key as keyof typeof factorLabels]
            const icon = factorIcons[key as keyof typeof factorIcons]
            const colorClass = factorColors[key as keyof typeof factorColors]
            
            return (
              <FactorItem
                key={key}
                index={idx}
                label={label}
                icon={icon}
                percentage={animatedPercentage}
                colorClass={colorClass}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}
