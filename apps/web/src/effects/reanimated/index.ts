'use client';

// Core components
export { AnimatedView, useAnimatedStyleValue, type AnimatedStyle } from './animated-view';
export { AnimatePresence } from './animate-presence';

// Animation hooks
export { useFadeAnimation, type UseFadeAnimationOptions, type UseFadeAnimationReturn } from './use-fade-animation';
export { useSlideAnimation, type UseSlideAnimationOptions, type UseSlideAnimationReturn, type SlideDirection } from './use-slide-animation';
export { useScaleAnimation, type UseScaleAnimationOptions, type UseScaleAnimationReturn } from './use-scale-animation';
export { useEntryAnimation, type UseEntryAnimationOptions, type UseEntryAnimationReturn } from './use-entry-animation';
export { useHoverAnimation, type UseHoverAnimationOptions, type UseHoverAnimationReturn } from './use-hover-animation';
export { useBounceOnTap, type UseBounceOnTapOptions, type UseBounceOnTapReturn } from './use-bounce-on-tap';
export { useHoverLift, type UseHoverLiftOptions, type UseHoverLiftReturn } from './use-hover-lift';
export { useHoverTap, type UseHoverTapOptions, type UseHoverTapReturn } from './use-hover-tap';
export { useMotionVariants, type UseMotionVariantsOptions, type UseMotionVariantsReturn } from './use-motion-variants';
export { useGlowPulse, type UseGlowPulseOptions, type UseGlowPulseReturn } from './use-glow-pulse';
export { useGlowBorder, type UseGlowBorderOptions, type UseGlowBorderReturn } from './use-glow-border';
export {
  useBreathingAnimation,
  type UseBreathingAnimationOptions,
  type UseBreathingAnimationReturn,
} from './use-breathing-animation';
export { useElasticScale, type UseElasticScaleOptions, type UseElasticScaleReturn } from './use-elastic-scale';
export { useMagneticHover, type UseMagneticHoverOptions, type UseMagneticHoverReturn } from './use-magnetic-hover';
export {
  useUltraCardReveal,
  type UseUltraCardRevealOptions,
  type UseUltraCardRevealReturn,
} from './use-ultra-card-reveal';
export { useHeaderAnimation, type UseHeaderAnimationOptions, type UseHeaderAnimationReturn } from './use-header-animation';
export { useHeaderButtonAnimation, type UseHeaderButtonAnimationOptions, type UseHeaderButtonAnimationReturn } from './use-header-button-animation';
export { useIconRotation, type UseIconRotationOptions, type UseIconRotationReturn } from './use-icon-rotation';
export { useLogoAnimation, type UseLogoAnimationReturn } from './use-logo-animation';
export { useLogoGlow, type UseLogoGlowReturn } from './use-logo-animation';
export { useModalAnimation, type UseModalAnimationOptions, type UseModalAnimationReturn } from './use-modal-animation';
export { useNavBarAnimation, type UseNavBarAnimationOptions, type UseNavBarAnimationReturn } from './use-nav-bar-animation';
export { usePageTransition, type UsePageTransitionOptions, type UsePageTransitionReturn } from './use-page-transition';
export { useStaggeredContainer, type UseStaggeredContainerOptions, type UseStaggeredContainerReturn } from './use-staggered-container';

// Transitions
export { springConfigs, timingConfigs, fadeIn, fadeOut, slideUp, slideDown, scaleIn, scaleOut } from './transitions';

// Re-export commonly used Reanimated primitives
export {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  useAnimatedReaction,
  useDerivedValue,
  useAnimatedRef,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  withDecay,
  cancelAnimation,
  runOnJS,
  runOnUI,
  Easing,
  interpolate,
  Extrapolation,
  type SharedValue,
} from 'react-native-reanimated';
