# PETSPARK – AI / Copilot Instructions

These rules apply to **all AI-driven edits** (Copilot, Cursor agents, Windsurf AI, etc.) in this repository.

Goal: **production-grade, type-safe, visually premium PETSPARK apps** (web + mobile + native) with **zero red squiggles**, no stubs, and preserved performance.

---

## 0. TL;DR (Golden Rules)

1. **Do not leave broken code.**
   - No red TypeScript errors.
   - No failing lint/tests for the scope you touched.

2. **No stubs or placeholders.**
   - Do **not** add `TODO`, dummy implementations, commented-out blocks, or fake data (except clearly marked tests/fixtures).

3. **Follow existing architecture & docs.**
   - Before editing an area, scan nearby docs in that app: `ARCHITECTURE*.md`, `MIGRATION_*.md`, `*_SUMMARY.md`, `*_REPORT.md`, etc.

4. **Prefer existing utilities and components.**
   - Reuse:
     - Hooks from `apps/**/src/hooks`
     - UI primitives from `apps/web/src/components/ui`
     - Motion façade in `packages/motion` (via `@petspark/motion`)

5. **Keep behavior and UX consistent.**
   - If you change a shared pattern (buttons, modals, transitions, typography, cards), **apply or plan** the same fix across similar screens (Discover, Adoption, Chat, Community, Profile, Auth, etc.).

6. **Never weaken safety/quality.**
   - Do not disable ESLint rules globally, loosen types, or bypass runtime safety helpers.

7. **Respect the requested surface.**
   - If the task is **“web only”**, do not touch `apps/mobile` or `apps/native`.
   - If the task is **“mobile only”**, do not modify `apps/web`.
   - Cross-surface changes must be explicit and documented.

---

## 1. Monorepo Map (What Lives Where)

Understand the structure before generating code.

### Root

- Tooling & policy:
  - `eslint.config.js`, `tsconfig.base.json`, `pnpm-workspace.yaml`
  - Quality / discipline: `TYPE_AND_LINT_DISCIPLINE.md`, `PRODUCTION_READINESS_*.md`, `SECURITY*.md`, `TESTING_*`, etc.
- AI / process docs:
  - `copilot-instructions.md` (this file)
  - `FRAMER_MOTION_MIGRATION.md`
  - `IMPLEMENTATION_SUMMARY.md`, `*_SUMMARY.md`, `*_REPORT.md`, `WHAT_IS_LEFT.md`, etc.

### apps/web – Primary Web App (Vite + React)

- `apps/web/src/components`
  - `ui/` – design system primitives (`button`, `input`, `dialog`, `sheet`, `tabs`, `badge`, `scroll-area`, etc.).
  - `enhanced/` – premium UI (animated cards, premium buttons, enhanced overlays, smart skeletons, notification center, etc.).
  - `views/` – top-level screens:
    - `DiscoverView`, `AdoptionMarketplaceView`, `ChatView`, `CommunityView`,
      `MapView`, `MatchesView`, `ProfileView`, `NotificationsView`, etc.
  - Feature folders:
    - `adoption/`, `stories/`, `community/`, `media-editor/`, `lost-found/`, `playdate/`, `health/`, `verification/`, etc.
- `apps/web/src/effects`
  - Web-only effects, micro-interactions, chat FX, animations.
  - `effects/reanimated/**` – **legacy** Reanimated-style helpers being migrated to Framer Motion façade (see `FRAMER_MOTION_MIGRATION.md`).
- `apps/web/src/hooks`
  - App-level hooks: discovery, adoption, chat, offline, stories, media, navigation, performance, etc.
- `apps/web/src/lib`
  - Domain logic, services and utilities:
    - `adoption-*`, `matching`, `analytics`, `realtime`, `payments-*`, `gdpr-service`, `security`, `offline-*`, `telemetry`, `image-*`, etc.
- Key docs:
  - `ARCHITECTURE.md`, `ENHANCED_ANIMATIONS.md`, `UI_AUDIT_*`, `WEB_RUNTIME_AUDIT_REPORT.md`,
    `BUTTON_STATE_MATRIX.md`, `STYLE_CONSISTENCY_REPORT.md`, `PERFORMANCE_AUDIT.md`,
    `MIGRATION_*`, `NAVIGATION_ERROR_*`, etc.

### apps/mobile – Expo React Native Mobile App

- `apps/mobile/src/components`, `src/screens`, `src/hooks`, `src/lib`, `src/theme`, `src/navigation`, etc.
- Uses **React Native**, **Reanimated**, Expo and mobile-specific UX.
- Key docs:
  - `ARCHITECTURE.md`, `MOBILE_*`, `PERFORMANCE_VALIDATION_GUIDE.md`,
    `ULTRA_CHATFX_CI_GATES.md`, `RUNBOOK.md`, `PRODUCTION_READINESS.md`, `MOBILE_RUNTIME_AUDIT_REPORT.md`.

### apps/native – Secondary RN / Native Variant

- `apps/native/src/components`, `src/screens`, `src/lib`, etc.
- Used for experiments / native variants; for core flows prefer `apps/mobile`.

### apps/backend

- Backend / API integration apps and scripts.
- Treat as backend code (no UI hacks in here).

### packages

- `packages/motion`
  - Motion façade for all platforms.
  - `src/primitives/` – `MotionView`, `MotionText`, `MotionScrollView` with `.native` / `.web` variants.
  - `src/framer-api/` – Framer-style APIs used internally on web.
  - **Rule:** web code consumes **only** via `@petspark/motion`.
- `packages/shared`
  - Common types, guards, storage, logging and utilities shared across web/mobile.
- `packages/core`
  - Core API client, HTTP glue, schemas, backend integration.
- `packages/chat-core`
  - Shared chat logic / hooks.

### docs/

- Cross-cutting:
  - Architecture, audits, production readiness, mobile/web comparison, bundle plans, testing stack, keyboard shortcuts, etc.
- When unsure: **mirror the closest existing pattern in the same folder** instead of inventing your own.

---

## 2. General Coding Standards

### 2.1 TypeScript & ESLint

- Must compile under **strict TypeScript**.
  - Avoid `any` / `unknown`. If unavoidable, tightly scope and wrap with proper type guards.
- Respect existing ESLint configuration.
  - Do **not** add broad `// eslint-disable` comments.
  - If absolutely required, disable only a single rule on a single line, with a short justification.
- File complexity & size:
  - The web app enforces constraints (e.g. **max ~300 lines per component file**) via ESLint.
  - If a file is growing too large:
    - Extract subcomponents (`Header`, `*BasicTab`, `*MediaTab`, `*AdvancedTab`, etc.).
    - Extract hooks into `apps/**/src/hooks`.
    - Do **not** weaken lint rules.

### 2.2 Promises & Async

- No unhandled promises:
  - In async flows: `await` or `void someAsync().catch(...)`.
  - Event handlers must surface errors via toast/logging or be contained in an error boundary.
- Prefer typed API clients:
  - Use `apps/web/src/lib/api-*`, `packages/core`, or other existing service helpers instead of raw `fetch`.

### 2.3 UI & Design System (Web)

- Use `apps/web/src/components/ui` primitives:
  - `Button`, `Input`, `Dialog`, `Sheet`, `Tabs`, `Card`, `Badge`, `ScrollArea`, `Switch`, `Slider`, etc.
- Avoid brand-new raw HTML styles:
  - If you need a new visual treatment, prefer:
    - Extending existing variants (e.g. `Button` variant/size)  
    - Adding a reusable prop/variant rather than one-off CSS.
- Design tokens:
  - Use Tailwind utility classes + existing token helpers.
  - Avoid custom hex colors, arbitrary font sizes, or spacing when a token or existing class combination is available.

### 2.4 Accessibility & ARIA

- Follow `apps/web/src/lib/accessibility.ts` and a11y docs:
  - Icon-only buttons must have `aria-label` or nearby label text.
  - Preserve focus outlines and keyboard navigation.
  - Use semantic roles (`button`, `link`, `dialog`, `list`, etc.) through the UI primitives.
- Dialogs / overlays:
  - Keep focus trap, ESC-to-close, screen reader labels and aria attributes intact.
  - Do not break tabbable order.

---

## 3. Animation & Motion Rules

### 3.1 Web (apps/web)

**Imports:**

- **Do NOT import** `react-native-reanimated` in `apps/web`.
- **Do NOT import** `framer-motion` directly in `apps/web`.

All web animation flows through:

- `@petspark/motion` (facade for motion primitives and hooks), and/or
- Existing helpers in `apps/web/src/effects/**` that already wrap this façade.

**Migration context:**

- `FRAMER_MOTION_MIGRATION.md` describes gradual migration from legacy Reanimated utilities.
- `apps/web/src/effects/reanimated/**` is the **legacy interface**:
  - No new Reanimated-specific helpers in this folder.
  - When modifying, incrementally move them toward the motion façade.

**New / updated web animation should:**

- Prefer `MotionView` (from `@petspark/motion`) instead of hand-rolled animated `div`s.
- Use façade hooks exported from `@petspark/motion` (motion values, animated styles, transitions), rather than direct Framer imports.
- When helpers like `useEntryAnimation`, `useHoverTap`, `useAnimatePresence` exist:
  - Update the helper to use the façade.
  - Reuse the helper across components instead of duplicating inline animation logic.

### 3.2 Mobile / Native (apps/mobile, apps/native)

- Mobile & native continue to use **React Native Reanimated**.
- Performance:
  - Target 60fps; avoid heavy synchronous work in render/layout.
  - Offload heavy logic to background helpers, not gesture handlers.
- Respect mobile docs:
  - `MOBILE_ANIMATION_PARITY_COMPLETE.md`
  - `PERFORMANCE_VALIDATION_GUIDE.md`
  - `ULTRA_CHATFX_CI_GATES.md`
- Do not blindly port web animation patterns to mobile; follow existing RN/Reanimated idioms.

---

## 4. Feature-Level Guidelines (Web)

### 4.1 Views (`apps/web/src/components/views`)

Examples: `DiscoverView`, `AdoptionMarketplaceView`, `ChatView`, `CommunityView`, `ProfileView`, etc.

- Responsibilities:
  - Wire hooks/services to UI components.
  - Compose feature components; keep business logic in hooks/services.
- Keep views compositional:
  - Shared patterns go into:
    - `components/enhanced/` (for premium UIs)
    - `components/ui/` (for primitives)
    - `hooks/**` (for logic)
- File size:
  - If a view grows too big:
    - Extract tabs (`*BasicTab`, `*MediaTab`, `*AdvancedTab`), headers, list items, etc. into separate components.
- Animations:
  - Use `PageTransitionWrapper` for page transitions.
  - Use common list animation hooks (`useEntryAnimation`, `useAnimatePresence` or their migrated equivalents) for repeated patterns.

### 4.2 Adoption Marketplace

Key files (non-exhaustive):

- `apps/web/src/components/views/AdoptionMarketplaceView.tsx`
- `apps/web/src/components/adoption/*`
- `apps/web/src/hooks/adoption/use-adoption-filters.ts`
- `apps/web/src/lib/adoption-marketplace-*`

Rules:

- Data & filtering:
  - Keep data loading and derived state in hooks/services (`useAdoptionMarketplace`, `use-adoption-filters`, `adoption-marketplace-service`).
  - Views handle layout, wiring, interactions and presentation.
- Components:
  - Use existing cards/dialogs:
    - `AdoptionListingCard`, `AdoptionListingDetailDialog`, `AdoptionFiltersSheet`, `CreateAdoptionListingDialog`, `MyAdoptionListings`, `MyAdoptionApplications`.
- Animations:
  - For animated lists, wrap cards in a single animated item (`AdoptionListingItem` or similar) that uses shared motion helpers.
  - Do not copy/paste animation config into each `map` call.
- Filters:
  - When adding new filters:
    - Update filter types in `lib/adoption-marketplace-types.ts`.
    - Update `use-adoption-filters.ts`.
    - Adjust tests in `hooks/__tests__/use-adoption-filters.test.ts`.

### 4.3 Discovery Filters

Key files:

- `apps/web/src/components/DiscoveryFilters.tsx`
- `apps/web/src/components/DiscoveryFiltersBasicTab.tsx`
- `apps/web/src/components/DiscoveryFiltersMediaTab.tsx`
- `apps/web/src/components/DiscoveryFiltersAdvancedTab.tsx`
- `apps/web/src/components/discovery-preferences.ts`
- `apps/web/src/hooks/use-storage.ts`

Rules:

- `DiscoveryFilters.tsx` is an **orchestrator**, not a dumping ground:
  - Owns `DiscoveryPreferences` state and `useStorage` persistence.
  - Manages the Sheet open/close and passes slices down as props to tab components.
- Tab components (`*BasicTab`, `*MediaTab`, `*AdvancedTab`):
  - Receive relevant preference slice and `onChange` callbacks.
  - No direct persistence or global reads.
- Types:
  - `DiscoveryPreferences` and `DEFAULT_PREFERENCES` should live in a single canonical place (`discovery-preferences.ts`).
  - Reuse types between web and mobile where practical.
- Reuse patterns:
  - For repeated UI patterns (e.g. labeled sliders, pill badges, filter cards), extract small components rather than duplicating markup in every tab.

### 4.4 Chat & Community

Key locations:

- Chat: `apps/web/src/components/chat/**`, `components/views/ChatView.tsx`, `packages/chat-core`.
- Community: `apps/web/src/components/community/**`, `CommunityView.tsx`.

Rules:

- Use `packages/chat-core` logic where available instead of re-implementing chat behavior in `apps/web`.
- Community flows (posts, comments, reports, playdates):
  - Use consistent animation and presence patterns with other premium components.
  - Keep sheets/dialogs accessible (correct focus behavior, keyboard shortcuts, aria attributes).

---

## 5. Mobile Guidelines (apps/mobile)

When explicitly asked to modify mobile:

- Read:
  - `apps/mobile/ARCHITECTURE.md`
  - `MOBILE_*` docs
  - `RUNBOOK.md`
  - `PERFORMANCE_VALIDATION_GUIDE.md`
  - `MOBILE_RUNTIME_AUDIT_REPORT.md`
- Keep core flows aligned with web where it makes sense:
  - Auth copy, error messages, labels, and general hierarchy of actions.
  - Button variants and states (primary/secondary/ghost).
- Prefer shared code:
  - Use `packages/shared` and `packages/core` instead of duplicating logic in `apps/mobile`.
- Honour mobile’s animation & performance rules:
  - Use Reanimated idioms and existing shared hooks.
  - Avoid introducing jank in scrolls, swipes, and chat.

---

## 6. Testing & Commands

Always use the **real scripts defined in each `package.json`**. The commands below are examples; adapt them to the actual script names.

### 6.1 Web (`apps/web`)

For any changes under `apps/web`:

1. Run at least:
   - `pnpm -C apps/web lint`  
   - `pnpm -C apps/web test` (or the closest unit test script)
2. If you touched a specific feature (e.g. adoption, discovery, chat) and there are targeted tests:
   - Prefer targeted runs (e.g. a test pattern or a single file) using the existing test runner configuration.
3. E2E / integration:
   - If you changed critical flows (auth, onboarding, checkout, adoption applications), run configured E2E tests (Playwright or similar) as defined in `apps/web/package.json` / `playwright.config.ts`.
4. Determinism:
   - Use `seeded-rng` and other test utilities for non-deterministic behavior (animations, chat FX, random ordering).

### 6.2 Mobile (`apps/mobile`)

For changes under `apps/mobile`:

- Run the scripts from `apps/mobile/package.json`, typically:
  - `pnpm -C apps/mobile lint`
  - `pnpm -C apps/mobile test`
  - Detox/E2E scripts if you touched navigation or core flows.

### 6.3 Shared Packages (`packages/*`)

For changes in shared packages:

- `pnpm -C packages/motion test`
- `pnpm -C packages/shared test`
- `pnpm -C packages/core test`
- Respect individual package `tsconfig` and lint setup.

---

## 7. Process for AI-Driven Changes

Whenever an AI/agent modifies code, follow this loop:

1. **Locate & read context**
   - Identify the files directly involved (component, hook, service).
   - Read nearby docs: `ARCHITECTURE*.md`, `*_SUMMARY.md`, `*_GUIDE.md`, `*_REPORT.md` in that app/package.
   - Observe existing patterns: naming, structure, motion usage, telemetry, haptics, analytics.

2. **Plan minimal, high-quality changes**
   - Prefer **surgical** edits that:
     - Fix specific issues (types, runtime bugs, visual glitches), or
     - Cleanly extract subcomponents/hooks where size/duplication demands it.
   - Avoid large rewrites unless clearly required by a doc (migration, hardening plan, etc.).

3. **Implement with safety**
   - Keep types strict; don’t introduce `any`/`unknown` without guards.
   - Preserve:
     - Haptics (`haptics` helpers), analytics, telemetry, logging.
     - Existing feature flags and entitlement checks.
     - Existing a11y behavior.
   - Do not break cross-page state (navigation, auth, discovery filters, adoption filters, chat sessions).

4. **Run checks**
   - Run relevant `pnpm` scripts for the app/package touched.
   - Fix all lint, type, and test failures caused by the changes.

5. **Document behavior changes**
   - If you alter a major flow or shared pattern (auth, matching, adoption marketplace, media editor, motion stack, notifications):
     - Update or append a short note to the closest `*_SUMMARY.md` / `*_GUIDE.md` / `MIGRATION_*.md`.
     - Keep the docs truthful; remove outdated claims.

6. **Summarize & capture visuals**
   - Summarize what changed, why, and any follow-ups (e.g. “Apply same button variant to `SavedPostsView` and `UserPostsView`”).
   - For visual/UI changes (buttons, layouts, animations, overlays), capture **after** screenshots of the key affected screens (Auth, Discover, Adoption, Chat, Profile, etc.) and attach them to the PR or implementation summary.

---

## 8. Things You Must Not Do

- Do **not**:
  - Introduce new libraries or heavy dependencies without explicit instruction.
  - Disable or bypass:
    - ESLint
    - TypeScript checks
    - Vitest/Jest
    - Playwright/Detox or other configured CI gates
  - Remove analytics/telemetry/haptics calls silently.
  - Downgrade security, privacy, or compliance:
    - GDPR helpers (`gdpr-service`), `rate-limit`, security headers, `url-safety`, `runtime-safety`, KYC and verification flows, etc.
  - Bypass the motion façade in web code:
    - No direct `framer-motion` or `react-native-reanimated` imports under `apps/web`.

---

Following these instructions, an AI assistant can safely:

- Fix type errors and lint violations without regressions.
- Modularize oversized views (e.g. Discovery/Adoption) while preserving behavior and visuals.
- Gradually migrate web animations onto the motion façade.
- Maintain UX parity and consistency between web and mobile.
- Keep PETSPARK stable, production-ready, and visually premium.
