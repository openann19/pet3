# PetSpark Web & Mobile Audit – November 2025

## 1. Executive Summary

- **Web**: Major JSX/TypeScript errors in key screens (e.g., `DiscoverView.tsx`), broken component structure, missing/incorrect imports, and incomplete migration to Framer Motion.
- **Mobile**: Similar issues likely: unsafe types, magic numbers, inconsistent design token usage, and possible runtime crashes due to unguarded navigation/data.

## 2. Key Issues Identified

### Web
- **JSX Syntax Errors**: Unmatched tags, missing parent elements, corrupted lines, and invalid JSX structure.
- **Migration Incomplete**: `AnimatedView` replaced with Framer Motion, but not all props/logic adapted; some animation logic lost.
- **Design Token Usage**: Some components use outdated or incorrect spacing/typography keys.
- **TypeScript Violations**: Type errors due to missing/incorrect imports, undefined variables, and unsafe data access.
- **Accessibility Gaps**: Some interactive elements lack ARIA roles/labels or keyboard handlers.
- **Performance**: Potential for unnecessary re-renders due to missing memoization.

### Mobile
- **Unsafe Types**: Use of `any`, missing strict null checks, and untyped navigation/data.
- **Design Token Fragmentation**: Magic numbers and inconsistent use of shared tokens.
- **State Management**: Unstandardized stores, possible ad-hoc context usage.
- **Security**: Sensitive data may be stored unsafely; missing runtime protections.
- **Testing**: Coverage gaps, especially for edge cases and error states.

## 3. Remediation Plan

### Web
1. **JSX/TypeScript Cleanup**
   - Review all screens/components for unmatched tags and ensure each JSX block has a single parent.
   - Remove corrupted lines and fix all syntax errors.
   - Validate imports and remove unused/incorrect ones.
2. **Framer Motion Migration**
   - For each replaced `AnimatedView`, ensure correct usage of Framer Motion props (`initial`, `animate`, `exit`, `variants`).
   - Restore lost animation logic and adapt event handlers.
3. **Design System Enforcement**
   - Refactor all spacing/typography usages to use the latest shared tokens.
   - Remove magic numbers and hardcoded colors.
4. **TypeScript Hardening**
   - Fix all type errors, add missing types, and validate all external data (API, storage, navigation).
   - Remove all unsafe casts and non-null assertions.
5. **Accessibility**
   - Ensure all interactive elements have proper ARIA roles, labels, and keyboard handlers.
   - Validate semantic structure (one `<main>`, hierarchical headings, etc.).
6. **Testing**
   - Add/restore unit and integration tests for all screens/components.
   - Cover edge cases, error states, and navigation flows.

### Mobile
1. **Type Safety**
   - Refactor all service, util, and store files to use strict types.
   - Remove all `any` and unsafe casts.
2. **Design Token Unification**
   - Migrate all style usages to shared design tokens.
   - Remove magic numbers and hardcoded colors.
3. **State Management Standardization**
   - Audit all stores and contexts; consolidate into typed Zustand stores.
   - Use TanStack Query for server state.
4. **Security Hardening**
   - Ensure sensitive data uses secure storage (Keychain/Keystore).
   - Add runtime protections (jailbreak/root detection, certificate pinning).
5. **Testing & Coverage**
   - Add/fix unit and integration tests for all critical flows.
   - Ensure ≥80% coverage and test error/empty/loading states.

## 4. Professional Action Checklist

- [ ] Fix all JSX/TypeScript errors in web screens/components.
- [ ] Complete Framer Motion migration with correct animation logic.
- [ ] Refactor all design token usages (web & mobile).
- [ ] Harden all TypeScript types and runtime data validation.
- [ ] Ensure accessibility compliance across all interactive elements.
- [ ] Standardize state management and remove ad-hoc contexts.
- [ ] Secure all sensitive data and add runtime protections (mobile).
- [ ] Add/restore tests for all screens/components and critical flows.
- [ ] Document all changes and update architecture/README/CONTRIBUTING.

## 5. Next Steps

- Prioritize fixing compilation errors and restoring app runtime.
- Run `pnpm lint` and `pnpm type-check` after each batch of fixes.
- Validate with `pnpm test` and ensure coverage thresholds.
- Document all refactors and update developer guides.

---

**Deliverables:**  
- Clean, error-free codebase (web & mobile)  
- Unified design system usage  
- Strict TypeScript compliance  
- Accessibility and security best practices  
- Comprehensive test coverage  
- Updated documentation

---

If you want a file-by-file checklist or want to start with a specific area, let me know!