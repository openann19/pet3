# Framer Motion Web Migration - Progress Report

## Overview
Systematic migration of all web components from compatibility layers (`@/effects/reanimated` and `@petspark/motion`) to pure Framer Motion implementations.

## Completed Work

### Phase 1: Core Hook Infrastructure ✅

**New Framer Motion Hooks Created:**
- `apps/web/src/effects/framer-motion/hooks/use-bubble-tilt.ts` - 3D tilt effect with mouse tracking
- `apps/web/src/effects/framer-motion/hooks/use-bubble-entry.ts` - Bubble entry animations with stagger
- `apps/web/src/effects/framer-motion/hooks/use-entry-animation.ts` - Generic entry animations
- `apps/web/src/effects/framer-motion/hooks/use-staggered-item.ts` - Staggered list item animations
- `apps/web/src/effects/framer-motion/hooks/use-floating-particle.ts` - Floating particle animations
- `apps/web/src/effects/framer-motion/hooks/use-parallax-tilt.ts` - Parallax tilt effects
- `apps/web/src/effects/framer-motion/hooks/use-modal-animation.ts` - Modal/dialog animations
- `apps/web/src/effects/framer-motion/hooks/use-page-transition.ts` - Page transition animations
- `apps/web/src/effects/framer-motion/hooks/use-nav-bar-animation.ts` - Navigation bar animations
- `apps/web/src/effects/framer-motion/hooks/use-header-button-animation.ts` - Header button animations
- `apps/web/src/effects/framer-motion/hooks/index.ts` - Barrel export for all hooks

**Key Features:**
- All hooks respect `prefers-reduced-motion` via `useReducedMotion()`
- Use centralized variants and timing from `variants.ts`
- Return variants-based API for easy use with `motion` components
- Proper TypeScript types throughout

### Phase 2: Utility Functions ✅

**Style Converter Utility:**
- `apps/web/src/effects/framer-motion/utils/style-converter.ts` - Replacement for `@petspark/motion`'s `convertReanimatedStyleToCSS`
- Handles Reanimated-style transform arrays
- Converts to CSS properties for Framer Motion

**Updated:**
- `apps/web/src/hooks/use-animated-style-value.ts` - Now uses local style converter instead of `@petspark/motion`

### Phase 3: Component Migrations ✅

**Fully Migrated Components:**
1. **WebBubbleWrapper** (`apps/web/src/components/chat/WebBubbleWrapper.tsx`)
   - Migrated from `@/effects/reanimated` hooks to new Framer Motion hooks
   - Uses `useBubbleTilt`, `useBubbleEntry`, `useEntryAnimation`
   - Proper variants-based animation system

2. **MessageItem** (`apps/web/src/components/chat/components/MessageItem.tsx`)
   - Migrated `useEntryAnimation` import
   - Replaced `useHoverAnimation` with Framer Motion's `whileHover`/`whileTap`
   - Uses variants-based entry animations

3. **StickerMessage** (`apps/web/src/components/chat/StickerMessage.tsx`)
   - Migrated from `@petspark/motion`'s `useSharedValue`, `useAnimatedStyle`, `withSpring`
   - Now uses Framer Motion's `useMotionValue` and `animate` directly
   - Proper reduced motion support

**Partially Updated:**
- `apps/web/src/components/navigation/NavButton.tsx` - Added `useReducedMotion` import (hooks already use Framer Motion)

## Migration Pattern

### For Components Using `@/effects/reanimated` Hooks:

**Before:**
```typescript
import { useBubbleEntry } from '@/effects/reanimated/use-bubble-entry';
import { useEntryAnimation } from '@/effects/reanimated/use-entry-animation';

const bubbleEntry = useBubbleEntry({ index, staggerDelay: 40, direction: 'incoming' });
bubbleEntry.trigger(); // Manual trigger needed

const entry = useEntryAnimation({ delay: 100 });
// Use entry.opacity, entry.translateY, entry.scale as MotionValues
```

**After:**
```typescript
import { useBubbleEntry } from '@/effects/framer-motion/hooks/use-bubble-entry';
import { useEntryAnimation } from '@/effects/framer-motion/hooks/use-entry-animation';

const bubbleEntry = useBubbleEntry({ index, staggerDelay: 0.04, direction: 'incoming' });
// No trigger needed - uses variants

const entry = useEntryAnimation({ delay: 100 });

<motion.div
  variants={bubbleEntry.variants}
  initial={bubbleEntry.initial}
  animate={bubbleEntry.animate}
/>
```

### For Components Using `@petspark/motion`:

**Before:**
```typescript
import { motion, useSharedValue, useAnimatedStyle, withSpring } from '@petspark/motion';

const opacity = useSharedValue(0);
const scale = useSharedValue(0.5);

useEffect(() => {
  opacity.value = withSpring(1, springConfigs.smooth);
  scale.value = withSpring(1, springConfigs.bouncy);
}, []);

const style = useAnimatedStyle(() => ({
  opacity: opacity.value,
  transform: [{ scale: scale.value }],
}));
```

**After:**
```typescript
import { motion, useMotionValue, animate } from 'framer-motion';
import { springConfigs } from '@/effects/framer-motion/variants';
import { useReducedMotion } from '@/hooks/useReducedMotion';

const prefersReducedMotion = useReducedMotion();
const opacity = useMotionValue(0);
const scale = useMotionValue(0.5);

useEffect(() => {
  if (!prefersReducedMotion) {
    void animate(opacity, 1, springConfigs.smooth);
    void animate(scale, 1, springConfigs.bouncy);
  } else {
    opacity.set(1);
    scale.set(1);
  }
}, [opacity, scale, prefersReducedMotion]);

// Or use variants:
<motion.div
  initial={{ opacity: 0, scale: 0.5 }}
  animate={{ opacity: 1, scale: 1 }}
  transition={prefersReducedMotion ? { duration: 0 } : springConfigs.bouncy}
/>
```

### For `convertReanimatedStyleToCSS`:

**Before:**
```typescript
import { convertReanimatedStyleToCSS } from '@petspark/motion';
```

**After:**
```typescript
import { convertReanimatedStyleToCSS } from '@/effects/framer-motion/utils/style-converter';
```

## Remaining Work

### High Priority Components (89 files with `@/effects/reanimated` imports):

**Chat Components:**
- `MessageBubble.tsx`
- `ChatWindowNew.tsx`
- `AdvancedChatWindow.tsx`
- `MessageList.tsx`
- `VirtualMessageList.tsx`
- `ChatInputBar.tsx`
- `TemplatePanel.tsx`
- `TypingIndicator.tsx`
- All bubble wrapper god-tier effects

**Admin Components:**
- `AdminLayout.tsx`
- `SettingsView.tsx`
- `ChatModerationPanel.tsx`
- All admin view components

**Adoption Flow:**
- `AdoptionDetailDialog.tsx`
- `AdoptionListingCard.tsx`
- `AdoptionCard.tsx`
- `CreateAdoptionListingWizard.tsx`
- `AdoptionApplicationDialog.tsx`

**Stories & Highlights:**
- `StoriesBar.tsx`
- `StoryViewer.tsx`
- `CreateStoryDialog.tsx`
- `HighlightViewer.tsx`

**Verification & Compliance:**
- `VerificationDialog.tsx`
- `AgeGateModal.tsx`

**Maps & Location:**
- `DiscoverMapMode.tsx`
- `LocationPicker.tsx`
- `PlaydateMap.tsx`
- `LostFoundMap.tsx`

**Playdate & Streaming:**
- `PlaydateScheduler.tsx`
- `LiveStreamRoom.tsx`
- `GroupCallInterface.tsx`

**Enhanced Components:**
- `UltraCard.tsx`
- `PremiumCard.tsx`
- `AdvancedFilterPanel.tsx`
- `SmartSkeleton.tsx` (partially migrated)

**Navigation & Layout:**
- `TopNavBar.tsx`
- `BottomNavBar.tsx`

**Other Components:**
- `WelcomeScreen.tsx`
- `WelcomeModal.tsx`
- `AnimatedBackground.tsx`
- All remaining components

### Medium Priority (37 files with `@petspark/motion` imports):

**Components using `motion`, `Presence`, `MotionView`:**
- Replace `motion` from `@petspark/motion` → `framer-motion`
- Replace `Presence` → `AnimatePresence` from `framer-motion`
- Replace `MotionView` → `motion.div` from `framer-motion`

**Components using compatibility APIs:**
- `useSharedValue` → `useMotionValue` from `framer-motion`
- `useAnimatedStyle` → Use variants or motion values directly
- `withSpring`, `withTiming` → `animate` from `framer-motion`

## Next Steps

1. **Continue Component Migrations:**
   - Migrate chat components systematically
   - Migrate admin components
   - Migrate adoption flow components
   - Continue with remaining categories

2. **Update Remaining Hooks:**
   - Migrate medium-priority hooks (use-staggered-container, use-icon-rotation, etc.)
   - Migrate low-priority/complex hooks (use-gradient-animation, chat-specific hooks)

3. **Add Missing Variants:**
   - Bubble entry/stagger variants (already in hooks, may need to add to variants.ts)
   - Page transition variants (already in hooks)
   - Chat-specific variants
   - Map interaction variants
   - Wizard step variants

4. **Cleanup:**
   - Remove `@petspark/motion` from `apps/web/package.json` dependencies
   - Archive or remove `apps/web/src/effects/reanimated/` folder (after all migrations)
   - Update all import paths

5. **Testing:**
   - Test all page transitions
   - Verify no crashes on navigation
   - Test with `prefers-reduced-motion` enabled
   - Visual testing of animations
   - Performance testing

## Success Metrics

- ✅ Zero imports from `@/effects/reanimated` in web code (Currently: 89 files remaining)
- ✅ Zero imports from `@petspark/motion` in web code (Currently: 37 files remaining)
- ✅ All animations use centralized variants
- ✅ All animations respect `prefers-reduced-motion`
- ✅ All animations follow global timing rules
- ✅ TypeScript compiles with no errors
- ✅ No runtime errors on navigation
- ✅ All tests pass
- ✅ Performance maintained or improved

## Notes

- All new hooks follow the established pattern:
  - Return `variants`, `initial`, `animate` for easy use with `motion` components
  - Respect `prefers-reduced-motion` via `useReducedMotion()`
  - Use centralized timing from `variants.ts`
  - Proper TypeScript types

- The migration maintains backward compatibility where possible, but components should be updated to use the new variants-based API for better performance and consistency.

- Some hooks in `@/effects/reanimated` already use Framer Motion under the hood - these just need import path updates.
