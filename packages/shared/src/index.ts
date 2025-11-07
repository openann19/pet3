export * from './device/quality'
export * from './geo/kalman'
export * from './motion'
export * from './rng'
export * from './types/stories-types'
export * from './types/pet-types'
export * from './types/admin'
export * from './utils/stories-utils'
export * from './storage/StorageAdapter'
export * from './guards'

// Export chat types - these are the canonical chat domain types
export * from './chat'

// Re-export motion facade selectively to avoid conflicts
// Note: Motion has its own MessageType and ReactionType for UI purposes
export {
  // Core Reanimated exports
  Animated,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  cancelAnimation,
  Easing,
  type SharedValue,
  // Primitives
  MotionView,
  MotionText,
  MotionScrollView,
  // Hooks/recipes
  usePressBounce,
  useHoverLift,
  useMagnetic,
  useParallax,
  useShimmer,
  useRipple,
  useFloatingParticle,
  useThreadHighlight,
  useBubbleEntry,
  useBubbleTheme,
  useBubbleTilt,
  useMediaBubble,
  useReactionSparkles,
  useWaveAnimation,
  useMultiWave,
  // Types (avoiding conflicts)
  type UseFloatingParticleOptions,
  type UseFloatingParticleReturn,
  type UseThreadHighlightOptions,
  type UseThreadHighlightReturn,
  type UseBubbleEntryOptions,
  type UseBubbleEntryReturn,
  type UseBubbleThemeOptions,
  type UseBubbleThemeReturn,
  type SenderType,
  type ChatTheme,
  type UseBubbleTiltOptions,
  type UseBubbleTiltReturn,
  type UseMediaBubbleOptions,
  type UseMediaBubbleReturn,
  type MediaType,
  type UseReactionSparklesOptions,
  type UseReactionSparklesReturn,
  // Other exports
  haptic,
  usePageTransitions,
  Presence,
  motion,
  usePerfBudget,
  type PerfBudget,
} from '../../motion/src/index'

// Re-export motion-specific types with aliases to avoid conflicts with chat types
export type {
  MessageType as MotionMessageType,
  ReactionType as MotionReactionType,
} from '../../motion/src/index'
