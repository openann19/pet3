# Strict Optionals Migration Guide

This document describes the migration to strict optional property types for critical code paths.

## Overview

We've implemented a gradual migration strategy for strict optional semantics:

1. **Legacy code** (`src/lib/**`, `src/components/**`) continues to use loose optionals
2. **Strict code** (`src/core/**`, `src/api/**`, `design-system/**`) enforces exact optional semantics

## Directory Structure

### `src/core/` - Core Domain Logic
Contains core domain types and utilities with strict optional handling:
- `types.ts` - Base entity types with `OptionalWithUndef<T>` support
- `utils.ts` - Utilities for working with strict optionals
- `README.md` - Documentation for core directory

### `src/api/` - API Layer
Contains API implementations with strict optional handling for update/patch operations:
- `adoption-api.ts` - Adoption API (copied from lib, ready for migration)
- `community-api.ts` - Community API
- `matching-api.ts` - Matching API
- `lost-found-api.ts` - Lost/Found API
- `live-streaming-api.ts` - Live Streaming API
- `types.ts` - API type definitions using `OptionalWithUndef<T>`
- `adoption-api-strict.ts` - Example implementation
- `README.md` - Documentation for API directory

## Using OptionalWithUndef<T>

The `OptionalWithUndef<T>` helper type allows explicit `undefined` values:

```typescript
import type { OptionalWithUndef } from '@/types/optional-with-undef'

// Allows { name: undefined } to explicitly clear a field
type UpdateUser = OptionalWithUndef<User>
```

### Example: Update Operation

```typescript
// Clear a field explicitly
await api.updateUser(id, { name: undefined })

// Omit a field (don't change it)
await api.updateUser(id, { email: "new@example.com" })
```

## Migration Steps

### Step 1: Identify Update/Patch Types
Look for types using `Partial<T>` in update operations:
```typescript
// Before
type UpdateData = Partial<CreateData>
```

### Step 2: Replace with OptionalWithUndef
Use `OptionalWithUndef<T>` where you need to distinguish undefined:
```typescript
// After
import type { OptionalWithUndef } from '@/types/optional-with-undef'
type UpdateData = OptionalWithUndef<CreateData>
```

### Step 3: Update Handler Logic
Handle undefined explicitly in your update logic:
```typescript
if (data.field !== undefined) {
  entity.field = data.field ?? undefined // Allows explicit clearing
}
```

## Type Checking

Run both type checks:

```bash
# Legacy code (loose optionals)
npm run typecheck

# Strict code (exact optionals)
npm run typecheck:strict-optionals
```

## ESLint Rules

The ESLint configuration automatically enforces:
- No `{ foo: undefined }` in strict folders unless type explicitly allows it
- Use `OptionalWithUndef<T>` when undefined is intentional

## Benefits

1. **Type Safety**: Prevents accidental `{ key: undefined }` bugs
2. **Explicit Intent**: Clear distinction between omitted and undefined
3. **Gradual Migration**: Legacy code continues to work
4. **Future-Proof**: New code enforces best practices

## Next Steps

1. Migrate API update methods to use `OptionalWithUndef<T>`
2. Move critical domain logic to `src/core/`
3. Update components to use strict API types where appropriate
4. Gradually migrate other code paths to strict folders

## Files Created

- `tsconfig.strict-optionals.json` - Strict optional TypeScript config
- `src/types/optional-with-undef.ts` - Helper type definition
- `src/core/` - Core domain types and utilities
- `src/api/` - API layer with strict optionals
- Updated `package.json` - Added `typecheck:strict-optionals` script
- Updated `eslint.config.js` - Added rule for strict folders

