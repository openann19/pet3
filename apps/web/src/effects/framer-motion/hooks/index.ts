'use client';

/**
 * Framer Motion Hooks
 * 
 * Pure Framer Motion implementations of animation hooks.
 * All hooks respect prefers-reduced-motion and use centralized variants.
 */

// ============================================================================
// CORE INTERACTION HOOKS
// ============================================================================
export { useHoverLift, type UseHoverLiftOptions, type UseHoverLiftReturn } from './use-hover-lift';
export { useBounceOnTap, type UseBounceOnTapOptions, type UseBounceOnTapReturn } from './use-bounce-on-tap';
export { useHoverTap, type UseHoverTapOptions, type UseHoverTapReturn } from './use-hover-tap';

// ============================================================================
// ANIMATION UTILITIES
// ============================================================================
export { useAnimatePresence, type UseAnimatePresenceOptions, type UseAnimatePresenceReturn } from './use-animate-presence';
export { useExpandCollapse, type UseExpandCollapseOptions, type UseExpandCollapseReturn } from './use-expand-collapse';
export { useRotation, type UseRotationOptions, type UseRotationReturn } from './use-rotation';

// ============================================================================
// ADVANCED EFFECTS
// ============================================================================
export { useRippleEffect, type UseRippleEffectOptions, type UseRippleEffectReturn, type RippleState } from './use-ripple-effect';
export { useMagneticHover, type UseMagneticHoverOptions, type UseMagneticHoverReturn } from './use-magnetic-hover';

// ============================================================================
// COMPONENT-SPECIFIC HOOKS
// ============================================================================
export { useBubbleTilt, type UseBubbleTiltOptions, type UseBubbleTiltReturn } from './use-bubble-tilt';
export { useBubbleEntry, type UseBubbleEntryOptions, type UseBubbleEntryReturn, type BubbleDirection } from './use-bubble-entry';
export { useEntryAnimation, type UseEntryAnimationOptions, type UseEntryAnimationReturn } from './use-entry-animation';
export { useStaggeredItem, type UseStaggeredItemOptions, type UseStaggeredItemReturn } from './use-staggered-item';
export { useFloatingParticle, type UseFloatingParticleOptions, type UseFloatingParticleReturn } from './use-floating-particle';
export { useParallaxTilt, type UseParallaxTiltOptions, type UseParallaxTiltReturn } from './use-parallax-tilt';
export { useModalAnimation, type UseModalAnimationOptions, type UseModalAnimationReturn } from './use-modal-animation';
export { usePageTransition, type UsePageTransitionOptions, type UsePageTransitionReturn } from './use-page-transition';
export { useNavBarAnimation, type UseNavBarAnimationOptions, type UseNavBarAnimationReturn } from './use-nav-bar-animation';
export { useHeaderButtonAnimation, type UseHeaderButtonAnimationOptions, type UseHeaderButtonAnimationReturn } from './use-header-button-animation';

