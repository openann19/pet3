# Framer Motion Migration Status

## Overview

This document tracks the migration from React Native Reanimated compatibility layer to pure Framer Motion for the web application.

## Migration Progress

### ✅ Completed Migrations

#### Hooks Migrated to Pure Framer Motion

1. **`useGlowBorder`** (`apps/web/src/effects/reanimated/use-glow-border.ts`)
   - ✅ Migrated from `useSharedValue`, `useAnimatedStyle`, `withRepeat`, `withSequence`, `withTiming`
   - ✅ Now uses `useMotionValue`, `useTransform`, `animate` from `framer-motion`
   - ✅ Returns `MotionValue` objects for direct use in `motion.div` style props
   - ✅ Respects `prefers-reduced-motion` via `useReducedMotion` hook
   - ✅ Uses `useTransform` for reactive style calculations

2. **`useUltraCardReveal`** (`apps/web/src/effects/reanimated/use-ultra-card-reveal.ts`)
   - ✅ Migrated to return `MotionValue` objects directly
   - ✅ Removed `.get()` calls that made values non-reactive
   - ✅ Returns `MotionValue` objects: `opacity`, `scale`, `rotateX`, `rotateY`, `translateZ`
   - ✅ Respects `prefers-reduced-motion` with simplified animations
   - ✅ All values can be used directly in `motion.div` style props

3. **`useParallaxTilt`** (`apps/web/src/effects/reanimated/use-parallax-tilt.ts`)
   - ✅ Already using Framer Motion APIs
   - ✅ Updated to return `MotionValue` objects directly instead of `animatedStyle`
   - ✅ Removed `.get()` calls
   - ✅ Respects `prefers-reduced-motion`

4. **`useWaveAnimation`** (`apps/web/src/effects/reanimated/use-wave-animation.ts`)
   - ✅ Migrated from `useSharedValue`, `useAnimatedStyle`, `withRepeat`, `withTiming`
   - ✅ Now uses `useMotionValue`, `useTransform`, `animate` from `framer-motion`
   - ✅ Returns `MotionValue` objects (`translateX`, `translateY`) for direct use
   - ✅ `useMultiWave` also migrated to return motion values via factory function
   - ✅ Respects `prefers-reduced-motion`

5. **`use3DFlipCard`** (`apps/web/src/effects/reanimated/use-3d-flip-card.ts`)
   - ✅ Migrated from `useSharedValue`, `useAnimatedStyle`, `withSpring`, `interpolate`
   - ✅ Now uses `useMotionValue`, `useTransform`, `animate` from `framer-motion`
   - ✅ Returns `MotionValue` objects: `rotateY`, `frontOpacity`, `backOpacity`, `backRotateY`
   - ✅ Uses `useTransform` for reactive opacity calculations
   - ✅ Respects `prefers-reduced-motion`

6. **`useConfettiBurst`** (`apps/web/src/effects/reanimated/use-confetti-burst.ts`)
   - ✅ Migrated from `useSharedValue`, `useAnimatedStyle`, `withTiming`, `withSequence`
   - ✅ Now uses `motionValue()` (imperative API) for dynamic particle creation
   - ✅ Each particle has its own `MotionValue` objects for all animated properties
   - ✅ Uses `animate()` directly for particle animations
   - ✅ Respects `prefers-reduced-motion` (skips animation if enabled)
   - ✅ Note: Uses `motionValue()` instead of `useMotionValue()` hook for dynamic creation

#### Components Migrated

1. **`UltraCard`** (`apps/web/src/components/enhanced/UltraCard.tsx`)
   - ✅ Migrated from `useAnimatedStyleValue` to direct `MotionValue` usage
   - ✅ Uses `motion.div` with style props accepting `MotionValue` directly
   - ✅ Removed dependency on `useAnimatedStyleValue` hook
   - ✅ All animations now use Framer Motion's reactive system

### 🔄 Migration Pattern

The migration follows this pattern:

**Before (Compatibility Layer):**
```tsx
import { useSharedValue, useAnimatedStyle, withSpring } from '@petspark/motion';

const scale = useSharedValue(1);
const animatedStyle = useAnimatedStyle(() => ({
  transform: [{ scale: scale.value }]
}));

return <Animated.View style={animatedStyle} />;
```

**After (Pure Framer Motion):**
```tsx
import { useMotionValue, animate } from 'framer-motion';
import { motion } from 'framer-motion';

const scale = useMotionValue(1);

return (
  <motion.div
    style={{ scale }}
    whileHover={{ scale: 1.1 }}
  />
);
```

### 📋 Remaining Work

#### Hooks Still Using Compatibility Layer

The following hooks still use `@petspark/motion` compatibility APIs and need migration:

1. `use-liquid-swipe.ts` - Uses `useSharedValue`, `useAnimatedStyle`
2. `use-kinetic-scroll.ts` - Uses compatibility APIs
3. `use-morph-shape.ts` - Uses compatibility APIs
4. `use-parallax-scroll.ts` - Uses compatibility APIs
5. `use-reaction-sparkles.ts` - Uses compatibility APIs
6. `use-bubble-gesture.ts` - Uses compatibility APIs
7. `use-spring-carousel.ts` - Uses compatibility APIs
8. `use-bubble-theme.ts` - Uses compatibility APIs
9. `particle-engine.ts` - Uses compatibility APIs

#### Components Still Using Compatibility Layer

1. Components using `AnimatedView` wrapper
2. Components using `useAnimatedStyleValue` hook
3. Components importing from `@petspark/motion` for compatibility APIs

### 🎯 Migration Guidelines

When migrating hooks and components:

1. **Replace `useSharedValue` with `useMotionValue`**
   ```tsx
   // Before
   const scale = useSharedValue(1);
   scale.value = 2;
   
   // After
   const scale = useMotionValue(1);
   scale.set(2);
   ```

2. **Replace `useAnimatedStyle` with direct `MotionValue` usage**
   ```tsx
   // Before
   const animatedStyle = useAnimatedStyle(() => ({
     opacity: opacity.value,
     transform: [{ scale: scale.value }]
   }));
   
   // After - return MotionValues directly
   return {
     opacity,
     scale
   };
   ```

3. **Use `motion.div` with style props directly**
   ```tsx
   // Before
   <Animated.View style={animatedStyle} />
   
   // After
   <motion.div style={{ opacity, scale }} />
   ```

4. **Replace `withSpring`/`withTiming` with `animate`**
   ```tsx
   // Before
   scale.value = withSpring(1.2, { damping: 20, stiffness: 200 });
   
   // After
   animate(scale, 1.2, {
     type: 'spring',
     damping: 20,
     stiffness: 200
   });
   ```

5. **Always respect `prefers-reduced-motion`**
   ```tsx
   import { useReducedMotion } from '@/hooks/useReducedMotion';
   
   const prefersReducedMotion = useReducedMotion();
   
   useEffect(() => {
     if (!prefersReducedMotion) {
       // Animate
     } else {
       // Set directly without animation
     }
   }, [prefersReducedMotion]);
   ```

6. **Use `useTransform` for derived values**
   ```tsx
   // Before
   const opacity = useDerivedValue(() => {
     return interpolate(progress.value, [0, 1], [0, 1]);
   });
   
   // After
   const opacity = useTransform(progress, [0, 1], [0, 1]);
   ```

### 🔍 Benefits of Migration

1. **Better Performance**: Direct Framer Motion usage is optimized for web
2. **Smaller Bundle**: No React Native polyfills needed
3. **Better TypeScript Support**: Full type inference for animations
4. **Simpler API**: Declarative animations with JSX props
5. **Better Accessibility**: Built-in `prefers-reduced-motion` support
6. **Reactive Updates**: MotionValues update components automatically

### 📝 Notes

- The `@petspark/motion` package still provides compatibility APIs for gradual migration
- Mobile components continue to use React Native Reanimated
- The compatibility layer will be deprecated once all web components are migrated
- All new animations should use Framer Motion directly

### 🚀 Next Steps

1. Continue migrating remaining hooks to pure Framer Motion
2. Update components to use `motion.div` directly instead of `AnimatedView`
3. Remove `useAnimatedStyleValue` usage where possible
4. Add tests for migrated components
5. Update documentation with new patterns

## Migration Checklist

- [x] Migrate `useGlowBorder` to pure Framer Motion
- [x] Migrate `useUltraCardReveal` to pure Framer Motion
- [x] Migrate `useParallaxTilt` to pure Framer Motion
- [x] Migrate `useWaveAnimation` to pure Framer Motion
- [x] Migrate `use3DFlipCard` to pure Framer Motion
- [x] Migrate `useConfettiBurst` to pure Framer Motion
- [x] Update `UltraCard` component to use MotionValues directly
- [ ] Migrate remaining hooks in `effects/reanimated/`
- [ ] Update components using `AnimatedView`
- [ ] Remove `useAnimatedStyleValue` where possible
- [ ] Add comprehensive tests
- [ ] Update documentation

