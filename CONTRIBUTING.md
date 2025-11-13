# Contributing to PetSpark

Thank you for your interest in contributing to PetSpark! This document provides guidelines and requirements for contributing code.

## Code Style Guidelines

### TypeScript

- **Strict Mode**: All code must pass TypeScript strict mode checks
- **No `any` Types**: Never use `any` - use proper types or `unknown` with type guards
- **No Non-Null Assertions**: Avoid `!` operator - use proper null checks instead
- **Type Safety**: All route params, API responses, and storage data must be validated

### Design Tokens

- **Web**: Use design token utilities from `@/lib/design-token-utils`
  - `getTypographyClasses()` for typography
  - `getSpacingClassesFromConfig()` for spacing
  - `getColorClasses()` for colors
  - `getRadiusClasses()` for border radius
- **Mobile**: Use theme tokens from `@/theme/tokens`
- **Never**: Hardcoded spacing values, hex colors, or magic numbers

### State Management

- **Global State**: Use Zustand stores in `apps/*/src/store/`
- **Server State**: Use TanStack Query for all API data
- **Local State**: Use React `useState` for component-specific state
- **No Ad-Hoc Contexts**: Avoid creating new context providers - use stores instead

### Navigation

- **Mobile**: Use typed `RootTabParamList` and `useValidatedRouteParams` hook
- **Web**: Use typed route helpers (Next.js router)
- **Runtime Validation**: Always validate route params with Zod schemas

## Testing Requirements

### Coverage Thresholds

- **Unit Tests**: ≥80% coverage required
- **Integration Tests**: All critical user flows must be tested
- **E2E Tests**: Auth → Home → Discover → Detail → Match flow

### Test Structure

```typescript
// Unit test example
describe('usePetsStore', () => {
  it('should add a pet', () => {
    const store = usePetsStore.getState()
    store.addPet(mockPet)
    expect(store.availablePets).toContain(mockPet)
  })
})

// Integration test example
describe('DiscoverView', () => {
  it('should handle missing pet data gracefully', () => {
    render(<DiscoverView />, { userPet: null })
    expect(screen.getByText(/create profile/i)).toBeInTheDocument()
  })
})
```

### Edge Cases

Always test:
- Missing data (null/undefined)
- Malformed API responses
- Network errors
- Empty states
- Loading states
- Error states

## Accessibility Requirements

### WCAG 2.1 AA Compliance

- **Semantic HTML**: Use proper HTML elements (`<button>`, `<nav>`, `<main>`, etc.)
- **ARIA Labels**: All interactive elements must have accessible names
- **Keyboard Navigation**: Everything must be keyboard-accessible
- **Focus Management**: Proper focus handling on route changes and modals
- **Screen Readers**: All images have `alt` attributes, use `aria-live` for dynamic content
- **Reduced Motion**: Respect `prefers-reduced-motion` media query

### Checklist

- [ ] Page has exactly one `<main>` with accessible name
- [ ] All buttons are `<button>` elements (not divs with onClick)
- [ ] All interactive elements have visible focus states
- [ ] All images have `alt` attributes
- [ ] Animations respect `prefers-reduced-motion`
- [ ] Keyboard-only navigation works for all features

## Pull Request Process

1. **Create Feature Branch**: `git checkout -b feature/your-feature-name`
2. **Write Tests**: Add tests for new functionality
3. **Update Documentation**: Update relevant docs (architecture.md, README, etc.)
4. **Run Checks**: Ensure all checks pass:
   ```bash
   pnpm typecheck
   pnpm lint
   pnpm test
   ```
5. **Create PR**: Provide clear description of changes
6. **Code Review**: Address review feedback
7. **Merge**: After approval, merge to main

## File Naming Conventions

- **Components**: PascalCase (e.g., `PetCard.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `usePetDiscovery.ts`)
- **Utilities**: camelCase (e.g., `formatDistance.ts`)
- **Types**: PascalCase (e.g., `PetProfile.ts`)
- **Tests**: Same as source file with `.test.` suffix (e.g., `PetCard.test.tsx`)

## Commit Messages

Use conventional commits format:

```
feat: add pet discovery filters
fix: resolve navigation type error
docs: update architecture.md with design tokens
test: add tests for usePetDiscovery hook
refactor: consolidate state management to Zustand
```

## Questions?

If you have questions about contributing, please:
1. Check the `architecture.md` file for detailed patterns
2. Review existing code for examples
3. Open an issue for discussion

Thank you for contributing to PetSpark! 🐾

