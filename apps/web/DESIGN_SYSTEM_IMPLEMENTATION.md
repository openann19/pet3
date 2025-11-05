# Design System Implementation Plan

## Status: IN PROGRESS
**Created**: $(date)
**Target Completion**: 14 days
**Current Phase**: Foundation (Day 1-2)

## Overview

Unified, studio-quality UI system with:
- Zero visual debt
- Zero TypeScript/ESLint errors  
- Dark/light themes + BG/EN i18n
- Flawless responsiveness
- 60fps performance
- Premium motion & micro-interactions

---

## ✅ Phase 1: Foundation (Day 1-2)

### Completed
- [x] Design tokens (`design-system/tokens.json`)
  - 4/8pt spacing grid
  - Semantic colors (light/dark modes)
  - Typography scale
  - Motion timings
  - Shadows & radii
  - Z-index layers
  
- [x] Theme system (`design-system/themes.ts`)
  - Type-safe token access
  - Theme mode switching
  - CSS variable mapping

- [x] ThemeProvider (`design-system/ThemeProvider.tsx`)
  - React context for theme state
  - Persisted via useKV
  - Auto-applies theme on mount

### In Progress
- [ ] Fix existing TypeScript errors (40+ errors)
- [ ] Audit & enhance i18n (BG/EN complete coverage)
- [ ] Icon set audit & standardization

---

## 🔄 Phase 2: Core Components (Day 3-6)

### Elite Component Library

All components will include:
- Hover/press/focus/disabled states
- 44x44px minimum hit areas
- Keyboard navigation
- Screen reader labels
- Dark/light theme support
- RTL-safe layouts

#### Priority 1: Foundations
- [ ] Button (6 variants, 4 sizes)
  - Primary, Secondary, Outline, Ghost, Destructive, Link
  - Icon support, loading states
  - Magnetic hover (web)
  
- [ ] Input
  - Text, email, password, number, search
  - Label, helper text, error states
  - Character count, validation

- [ ] Card
  - Default, elevated, interactive
  - Header, content, footer slots
  - Hover lift animations

#### Priority 2: Interactive
- [ ] Select/Dropdown
  - Native + custom styled
  - Multi-select, searchable
  - Keyboard navigation

- [ ] Modal/Sheet
  - Backdrop blur, elevation
  - Focus trap, escape handling
  - Bottom sheet (mobile)

- [ ] Stepper
  - Horizontal/vertical
  - Progress indicator
  - Validation per step

- [ ] Tabs
  - Animated indicator
  - Scrollable on overflow
  - Keyboard navigation

#### Priority 3: Feedback
- [ ] Toast/Banner
  - Success, error, warning, info
  - Action buttons
  - Auto-dismiss timers

- [ ] Skeleton
  - Card, text, avatar, image
  - Shimmer animation
  - Configurable shapes

- [ ] Empty State
  - Illustration + message
  - CTA button
  - Context-aware copy

#### Priority 4: Display
- [ ] Badge/Chip
  - Status indicators
  - Removable, clickable
  - Color variants

- [ ] Avatar
  - Image with fallback
  - Status dot
  - Size variants

- [ ] Image
  - Blur-up placeholder
  - Lazy loading
  - Responsive sizes

- [ ] Toggle/Switch
  - Smooth transitions
  - Label support
  - Disabled state

- [ ] Pagination
  - Page numbers, prev/next
  - Jump to page
  - Results per page

- [ ] Carousel
  - Swipe/drag navigation
  - Snap points
  - Dots indicator

---

## 🎭 Phase 3: Motion & Gestures (Day 5-7)

### Motion Primitives

- [ ] `FadeIn` - Opacity 0→1, configurable duration
- [ ] `SlideUp` - TranslateY with spring
- [ ] `ScaleIn` - Scale 0.95→1, elastic easing
- [ ] `StaggerList` - Sequential child animations
- [ ] `ParallaxScroll` - Scroll-linked animations

### Gesture Utilities

- [ ] `useSwipeCard` - Pan gesture with physics
  - Velocity thresholds
  - Rubber-band at edges
  - Spring-back animation
  
- [ ] `useSnapCarousel` - Horizontal scroll with snap
  - Momentum scrolling
  - Snap to closest item
  - Pagination dots

- [ ] `useMagneticHover` - Cursor-following effect (web)
  - Smooth interpolation
  - Configurable strength
  - Reset on leave

### Micro-Interactions

- [ ] Shimmer loading (skeletons)
- [ ] Blur-up image loading
- [ ] Haptic feedback (mobile)
  - Light, medium, heavy
  - Success/error patterns
  
- [ ] Confetti animation (match celebration)
- [ ] Like button heart burst
- [ ] Pull-to-refresh indicator

### Performance Targets

- 60fps scroll & interactions
- Input latency < 50ms (mobile)
- LCP < 2.0s (web, mid-tier device)
- No layout shifts (CLS = 0)

---

## 🖼️ Phase 4: Screen Refactors (Day 7-12)

### Pet Add Flow
- [ ] Real stepper with progress (1/5 • Pet Type)
- [ ] Category chips (dog/cat/bird/rabbit/fish/other)
  - Large hit areas (44x44)
  - Selected state: border + glow
- [ ] Pinned CTA button
- [ ] Form validation & error states
- [ ] 8pt spacing adherence

### Discover/Matches
- [ ] Card stack with physics
  - Swipe left/right gestures
  - Denial/like/super-like affordances
- [ ] Gradient halos on hover/press
- [ ] Match celebration modal
  - Confetti animation
  - Pet photos with heart burst
- [ ] Empty state (no more pets)

### Community Feed
- [ ] Sticky composer bar
- [ ] Rich media cards (image/video)
- [ ] Skeleton loaders while fetching
- [ ] Optimistic like/comment updates
- [ ] Media lightbox (fullscreen view)
- [ ] Virtualized scrolling (performance)

### Chat
- [ ] Message bubbles (sent/received)
- [ ] Typing indicators
- [ ] Read receipts
- [ ] Sticker picker (already implemented)
- [ ] Image/file upload
- [ ] Scroll to bottom FAB

### Profile
- [ ] Pet cards grid
- [ ] Edit pet dialog
- [ ] Health records section
- [ ] Settings panel
- [ ] Theme toggle UI
- [ ] Language selector

### Adoption
- [ ] Filter panel
- [ ] Pet grid with filters
- [ ] Detail modal
- [ ] Contact shelter CTA
- [ ] Save/favorite

### Onboarding
- [ ] Welcome carousel (3-4 slides)
- [ ] Value proposition
- [ ] Permission requests (location, notifications)
- [ ] Skip vs. complete flow

---

## 🎨 Phase 5: Polish & Gates (Day 12-14)

### Accessibility Sweep

- [ ] All interactive elements keyboard-navigable
- [ ] Focus indicators visible (ring, outline)
- [ ] Skip links for major sections
- [ ] ARIA labels on icon buttons
- [ ] Color contrast ≥ 4.5:1 (WCAG AA)
- [ ] Screen reader announcements for dynamic content
- [ ] Focus trap in modals
- [ ] Return focus on modal close

### Performance Pass

- [ ] Image pipeline optimization
  - Responsive sizes
  - WebP/AVIF formats
  - Lazy loading
  - Caching strategy
  
- [ ] Bundle analysis
  - Main bundle ≤ 500KB gzip
  - Code splitting by route
  - Tree-shaking unused code
  
- [ ] Layout optimization
  - Eliminate layout thrash
  - Pre-measure list items
  - Virtualize long lists
  - Debounce expensive computations

### Visual Regression

- [ ] Storybook stories (95% coverage)
- [ ] Chromatic/Playwright snapshots
- [ ] Key screens tested:
  - Light + dark mode
  - Mobile + desktop
  - EN + BG languages
  - Empty + loaded + error states

### Documentation

- [ ] Component props tables
- [ ] Usage examples
- [ ] Accessibility notes
- [ ] Storybook controls
- [ ] Design tokens reference

---

## 🔒 Quality Gates (CI/CD)

### Pre-Commit
- TypeScript strict mode (zero errors)
- ESLint (project rules, zero warnings)
- Prettier (code formatting)

### Pre-Push
- Unit tests (80%+ coverage)
- Storybook build
- Type check all files

### PR Checks
- Bundle size budget
- Visual regression tests
- Accessibility tests (axe)
- Performance benchmarks
- i18n completeness check

---

## 📊 Acceptance Criteria

- [ ] **Zero TypeScript errors** in strict mode
- [ ] **Zero ESLint warnings** with project rules
- [ ] **Dark/light themes** functional across all screens
- [ ] **BG/EN languages** complete with toggle in top bar
- [ ] **Real swipe gestures** on mobile, pointer-swipe on web
- [ ] **60fps interactions** on representative hardware
- [ ] **LCP < 2.0s** on mid-tier web devices
- [ ] **Bundle ≤ 500KB** gzipped (main chunk)
- [ ] **95% story coverage** for core components
- [ ] **WCAG 2.1 AA** compliance (axe tests pass)
- [ ] **44x44px minimum** hit areas on all interactive elements
- [ ] **Keyboard navigation** for all features
- [ ] **Focus management** in modals/sheets
- [ ] **No layout shifts** (CLS = 0)
- [ ] **Virtualized lists** for feeds (1000+ items)

---

## 🚀 Quick Wins (Immediate)

### Visual Polish
- [x] Increase contrast of unselected pet cards
- [ ] Lighten inner shadows
- [ ] Selected state: clear border + glow
- [ ] Raise modal elevation & backdrop blur

### UX Improvements
- [ ] Stepper labels ("1/5 • Pet Type")
- [ ] Pin "Continue" CTA
- [ ] Respect 8pt spacing grid
- [ ] Enlarge icons and labels (min 14-16px)

### Technical Debt
- [x] Fix i18n duplicate key errors
- [ ] Fix adoption card age display
- [ ] Fix group call TypeScript errors
- [ ] Fix enhanced button onClick type
- [ ] Fix virtual scroll ref type
- [ ] Fix seed data gender types

---

## 🛠️ Tech Stack

### Motion
- **Web**: Framer Motion
- **RN**: Reanimated v3 + Gesture-Handler

### Styling
- Tailwind CSS (4.x)
- CSS custom properties
- oklch color space

### Icons
- Phosphor Icons (2.1.7)
- Consistent weight/size

### Tooling
- TypeScript 5.7 (strict)
- ESLint 9.28
- Storybook 8.x
- Vitest + Testing Library

---

## 📝 Notes

- All new components in `design-system/components/elite/`
- Motion primitives in `design-system/motion/`
- Gesture utils in `design-system/gestures/`
- Shared types in `design-system/types.ts`
- Storybook stories co-located: `Component.tsx` + `Component.stories.tsx`

---

## 🐛 Known Issues to Fix

1. **i18n**: Duplicate `year` keys (FIXED)
2. **AdoptionCard**: Use `year_singular` instead of `year`
3. **GroupCallInterface**: Missing `localStream` property
4. **EnhancedButton**: onClick type issue
5. **useVirtualScroll**: Ref type mismatch
6. **seedData**: Gender type must be `'male' | 'female'`
7. **DiscoverView**: Undefined length error (line 119)

---

## 🎯 Success Metrics

### User Experience
- Buttery smooth 60fps
- Instant feedback < 100ms
- Zero janky animations
- Premium feel across all surfaces

### Developer Experience
- Type-safe components
- Self-documenting via Storybook
- Easy to extend
- Consistent patterns

### Business Impact
- Faster feature velocity
- Fewer bugs
- Better accessibility
- Higher user satisfaction

---

*This document will be updated as we progress through each phase.*
