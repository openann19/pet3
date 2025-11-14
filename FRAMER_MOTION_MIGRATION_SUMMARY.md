# Framer Motion Migration Summary

## Overview

This document summarizes the migration of the codebase to use Framer Motion as the primary animation library, replacing CSS transitions and the React Native Reanimated compatibility layer.

## Migration Status

### ✅ Completed Components

#### UI Components Migrated
1. **Alert** (`apps/web/src/components/ui/alert.tsx`)
   - Migrated from CSS transitions to Framer Motion variants
   - Uses `alertVariants` for entrance/exit animations
   - Respects `prefers-reduced-motion`

2. **Accordion** (`apps/web/src/components/ui/accordion.tsx`)
   - Migrated content expand/collapse animations
   - Migrated icon rotation animation
   - Uses `accordionContentVariants` and `accordionIconVariants`
   - Properly tracks state via MutationObserver

3. **Sheet** (`apps/web/src/components/ui/sheet.tsx`)
   - Migrated overlay fade animations
   - Migrated slide-in/out animations for all sides (top, right, bottom, left)
   - Uses `sheetOverlayVariants` and `createSheetContentVariants`
   - Replaced CSS `animate-in`/`animate-out` classes

4. **Checkbox** (`apps/web/src/components/ui/checkbox.tsx`)
   - Migrated indicator scale/opacity animations
   - Uses Framer Motion variants for checked/unchecked states
   - Smooth transitions for state changes

5. **Select** (`apps/web/src/components/ui/select.tsx`)
   - Migrated dropdown content animations (fade + zoom + slide)
   - Migrated chevron icon rotation
   - Uses `createSelectContentVariants` and `selectIconVariants`
   - Supports all positioning sides (top, right, bottom, left)
   - Properly tracks state and side via MutationObserver

6. **Navigation Menu** (`apps/web/src/components/ui/navigation-menu.tsx`)
   - Migrated trigger chevron rotation
   - Migrated content slide animations (from-start/from-end)
   - Migrated viewport zoom/fade animations
   - Uses `navMenuIconVariants`, `createNavMenuContentVariants`, and `navMenuViewportVariants`
   - Properly tracks state and direction via MutationObserver

#### Previously Migrated Components
- **Card** - Already using Framer Motion
- **Dialog** - Already using Framer Motion
- **Button** - Already using Framer Motion
- **Badge** - Already using Framer Motion
- **Progress** - Already using Framer Motion
- **Spinner** - Already using Framer Motion
- **Slider** - Already using Framer Motion

### 📋 New Variants Added

Added to `apps/web/src/effects/framer-motion/variants.ts`:

1. **`alertVariants`** - Entrance/exit animations for alerts
2. **`accordionContentVariants`** - Height and opacity transitions for accordion content
3. **`accordionIconVariants`** - Rotation animation for accordion chevron
4. **`sheetOverlayVariants`** - Backdrop fade and blur animations
5. **`createSheetContentVariants(side)`** - Slide animations for sheet content from all sides
6. **`createSelectContentVariants(side)`** - Fade + zoom + slide animations for select dropdown
7. **`selectIconVariants`** - Rotation animation for select chevron
8. **`navMenuIconVariants`** - Rotation animation for navigation menu chevron
9. **`createNavMenuContentVariants(direction)`** - Fade + zoom + slide animations for nav menu content
10. **`navMenuViewportVariants`** - Zoom + fade animations for navigation menu viewport

### 🔄 Migration Pattern

All migrated components follow this pattern:

1. **Import Framer Motion**:
   ```tsx
   import { motion } from 'framer-motion';
   import { useReducedMotion } from '@/hooks/useReducedMotion';
   import { [component]Variants } from '@/effects/framer-motion/variants';
   ```

2. **Respect Reduced Motion**:
   ```tsx
   const prefersReducedMotion = useReducedMotion();
   const shouldAnimate = enableAnimations && !prefersReducedMotion;
   ```

3. **Use Motion Components**:
   ```tsx
   <motion.div
     variants={shouldAnimate ? componentVariants : undefined}
     initial="hidden"
     animate="visible"
     exit="exit"
   />
   ```

4. **Remove CSS Transitions**: All `transition-*` classes are removed in favor of Framer Motion

## Remaining Work

### Components Still Using CSS Transitions

The following components still use CSS transitions and could be migrated (low priority):

1. **Breadcrumb** (`apps/web/src/components/ui/breadcrumb.tsx`)
   - Link hover states (simple color transition)

2. **Scroll Area** (`apps/web/src/components/ui/scroll-area.tsx`)
   - Scrollbar color transitions (subtle)

### Reanimated Effects Hooks

Many hooks in `apps/web/src/effects/reanimated/` still use the compatibility layer. These should be migrated to pure Framer Motion:

- `use-spring-carousel.ts` - Uses compatibility APIs
- Various animation hooks that could use Framer Motion directly

### Components Using Compatibility Layer

Components importing from `@petspark/motion` that should migrate to direct Framer Motion imports:

- Check `apps/web/src/components/` for any remaining `@petspark/motion` imports
- Migrate to direct `framer-motion` imports where appropriate

## Benefits

1. **Performance**: Native web animations (no React Native polyfills)
2. **Consistency**: Single animation library across the app
3. **Accessibility**: Better support for `prefers-reduced-motion`
4. **Developer Experience**: Better TypeScript support and simpler API
5. **Bundle Size**: Smaller bundle (removing compatibility layer)

## Testing Checklist

- [x] Alert animations work correctly
- [x] Accordion expand/collapse animations
- [x] Sheet slide animations from all sides
- [x] Checkbox state transitions
- [x] Select dropdown animations
- [x] Navigation menu animations
- [x] All animations respect `prefers-reduced-motion`
- [x] No console errors
- [x] TypeScript compilation passes
- [x] No linting errors

## Next Steps

1. ✅ Migrate remaining UI components (Select, Navigation Menu) - **COMPLETED**
2. ✅ Fix import in WebBubbleWrapper - **COMPLETED**
3. Migrate complex chat effects hooks (use-scroll-fab-magnetic, use-reaction-burst) - **IN PROGRESS**
   - These hooks use the compatibility layer extensively
   - Require careful refactoring to maintain functionality
   - Consider keeping compatibility layer for these complex hooks or gradual migration
4. Remove unused compatibility layer code (optional - low priority)
5. Add E2E tests for animations
6. Consider migrating Breadcrumb and Scroll Area (low priority - subtle animations)

## Migration Status Summary

### ✅ Fully Migrated (Pure Framer Motion)
- All UI components (Alert, Accordion, Sheet, Checkbox, Select, Navigation Menu, Card, Dialog, Button, Badge, Progress, Spinner, Slider)
- Most reanimated effects hooks (use-hover-lift, use-bounce-on-tap, use-shimmer, use-glow-pulse, use-magnetic-effect, use-spring-carousel)

### ⚠️ Partially Migrated (Using Compatibility Layer)
- Complex chat effects hooks (use-scroll-fab-magnetic, use-reaction-burst)
- Some components import from `@petspark/motion` for specific utilities
- These work correctly but could be migrated to pure Framer Motion for consistency

### 📝 Notes
- The compatibility layer (`@petspark/motion`) is still functional and provides a bridge for complex animations
- Migration of complex hooks can be done gradually without breaking functionality
- All new code should use Framer Motion directly

## Files Modified

### New Variants
- `apps/web/src/effects/framer-motion/variants.ts` - Added new variants

### Migrated Components
- `apps/web/src/components/ui/alert.tsx`
- `apps/web/src/components/ui/accordion.tsx`
- `apps/web/src/components/ui/sheet.tsx`
- `apps/web/src/components/ui/checkbox.tsx`
- `apps/web/src/components/ui/select.tsx`
- `apps/web/src/components/ui/navigation-menu.tsx`
- `apps/web/src/components/chat/WebBubbleWrapper.tsx` (fixed import)

## Notes

- All animations respect `prefers-reduced-motion` user preference
- Variants are centralized in `variants.ts` for consistency
- Motion durations and easing match the design system
- All components maintain accessibility features (ARIA, keyboard navigation)
