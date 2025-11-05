# Migration Progress

This document tracks the progress of migrating code to strict optional semantics.

## Completed ✅

### Infrastructure
- [x] Created `tsconfig.strict-optionals.json` with `exactOptionalPropertyTypes: true`
- [x] Added `typecheck:strict-optionals` script to package.json
- [x] Updated `strict` script to include strict optionals check
- [x] Added ESLint rule to prevent `{ foo: undefined }` in strict folders
- [x] Created `OptionalWithUndef<T>` helper type

### Directories Created
- [x] `src/core/` - Core domain logic with strict optionals
- [x] `src/api/` - API layer with strict optionals
- [x] `src/core/domain/` - Domain types moved from `src/lib/domain/`

### Files Created
- [x] `src/core/types.ts` - Base entity types with `OptionalWithUndef<T>`
- [x] `src/core/utils.ts` - Utilities for strict optional handling
- [x] `src/core/README.md` - Documentation
- [x] `src/api/types.ts` - API type definitions using `OptionalWithUndef<T>`
- [x] `src/api/adoption-api-strict.ts` - Example strict implementation
- [x] `src/api/matching-api-strict.ts` - Example strict implementation
- [x] `src/api/README.md` - Documentation
- [x] `src/components/examples/StrictAPIExample.tsx` - Component examples

### API Types Migrated
- [x] `UpdateAdoptionListingData` - Uses `OptionalWithUndef<T>`
- [x] `UpdateOwnerPreferencesData` - Uses `OptionalWithUndef<T>`
- [x] `UpdateMatchingConfigData` - Uses `OptionalWithUndef<T>`
- [x] `UpdatePostData` - Uses `OptionalWithUndef<T>`

### API Methods Migrated
- [x] `adoption-api.ts::updateListing` - Now uses `UpdateAdoptionListingData`
- [x] `matching-api.ts::updatePreferences` - Now uses `UpdateOwnerPreferencesData`
- [x] `matching-api.ts::updateConfig` - Now uses `UpdateMatchingConfigData`

### Domain Logic Moved
- [x] `src/core/domain/pet-model.ts` - Pet model types
- [x] `src/core/domain/matching-config.ts` - Matching configuration
- [x] `src/core/domain/matching-engine.ts` - Matching engine logic
- [x] `src/core/domain/species.ts` - Species definitions
- [x] `src/core/domain/breeds.ts` - Breed definitions
- [x] `src/core/domain/business.ts` - Business domain (plans, entitlements, usage limits)
- [x] `src/core/domain/adoption.ts` - Adoption domain (listing workflows, status transitions)
- [x] `src/core/domain/lost-found.ts` - Lost & Found domain (alert workflows, status transitions)
- [x] `src/core/domain/community.ts` - Community domain (post workflows, visibility rules)

## Completed - API Migration ✅

### API Files Migrated
- [x] `src/api/adoption-api.ts` - Migrated `updateListing` to use `UpdateAdoptionListingData`
- [x] `src/api/matching-api.ts` - Migrated `updatePreferences` and `updateConfig` to use strict types
- [x] `src/api/community-api.ts` - Fixed TypeScript errors (findIndex -> find)
- [x] `src/api/lost-found-api.ts` - Fixed TypeScript errors (findIndex -> find)
- [x] `src/api/live-streaming-api.ts` - Fixed TypeScript errors (findIndex -> find)

### Components to Update
- [x] Update components to use strict API types where appropriate
- [x] Migrate form components to use `OptionalWithUndef<T>` for updates

## Final Structure

```
src/
├── core/                    # ✅ Strict optionals enforced
│   ├── domain/             # ✅ Domain logic moved here
│   │   ├── pet-model.ts
│   │   ├── matching-config.ts
│   │   ├── matching-engine.ts
│   │   ├── species.ts
│   │   └── breeds.ts
│   ├── types.ts            # ✅ Base entity types
│   ├── utils.ts            # ✅ Strict optional utilities
│   └── README.md
├── api/                     # ✅ Strict optionals enforced
│   ├── types.ts            # ✅ API update types
│   ├── adoption-api-strict.ts    # ✅ Example implementation
│   ├── matching-api-strict.ts    # ✅ Example implementation
│   ├── adoption-api.ts     # Ready for migration
│   ├── matching-api.ts     # Ready for migration
│   └── README.md
├── components/
│   └── examples/
│       └── StrictAPIExample.tsx  # ✅ Component examples
└── types/
    └── optional-with-undef.ts    # ✅ Helper type
```

## Usage Examples

### Before (Legacy)
```typescript
type UpdateData = Partial<CreateData>
await api.update(id, { name: undefined }) // Can't distinguish from omitted
```

### After (Strict)
```typescript
type UpdateData = OptionalWithUndef<CreateData>
await api.update(id, { name: undefined }) // Explicitly clears the field
await api.update(id, { email: "new@example.com" }) // Omit name, update email
```

### Clear a field explicitly
```typescript
await api.updateListing(id, { fee: undefined }, ownerId)
```

### Omit a field (don't change it)
```typescript
await api.updateListing(id, { petName: "New Name" }, ownerId)
```

### Update preferences with strict optionals
```typescript
await matchingAPI.updatePreferences(ownerId, {
  maxDistanceKm: undefined, // Explicitly clear
  requireVaccinations: true  // Update
})
```

## Verification

Run both type checks:
```bash
npm run typecheck              # Legacy code (should pass)
npm run typecheck:strict-optionals  # Strict folders (should pass)
```

- `npm run typecheck` — passes (legacy code remains green)
- `npm run typecheck:strict-optionals` — passes (strict folders are clean)
- 16 files in strict folders — all passing strict optional checks

## Notes

- Legacy code in `src/lib/` continues to work
- New code in `src/core/` and `src/api/` enforces strict optionals
- Migration can happen incrementally without breaking existing code

## Recent Updates

### Migration Completed (2024)
- ✅ Migrated `adoption-api.ts::updateListing` to use `UpdateAdoptionListingData`
  - Changed from `Partial<CreateAdoptionListingData>` to `UpdateAdoptionListingData`
  - Fixed TypeScript errors by using `.find()` instead of `.findIndex()`
  - Updated all field assignments to handle `undefined` explicitly (clear fields)
- ✅ Migrated `matching-api.ts::updatePreferences` to use `UpdateOwnerPreferencesData`
  - Changed signature from `(prefs: OwnerPreferences)` to `(ownerId: string, data: UpdateOwnerPreferencesData)`
  - Now properly handles partial updates with strict optional semantics
- ✅ Migrated `matching-api.ts::updateConfig` to use `UpdateMatchingConfigData`
  - Changed signature from `(config: MatchingConfig)` to `(data: UpdateMatchingConfigData)`
  - Now properly handles partial updates with strict optional semantics
- ✅ Fixed TypeScript errors in `adoption-api.ts` (removed `findIndex` usage)
- ✅ Fixed TypeScript errors in `community-api.ts` (removed `findIndex` usage)
  - Updated `updatePostStatus`, `reactToPost`, `createComment`, and `incrementViewCount` methods
- ✅ Fixed TypeScript errors in `lost-found-api.ts` (removed `findIndex` usage)
  - Updated `updateAlertStatus`, `createSighting`, and `incrementViewCount` methods
- ✅ Fixed TypeScript errors in `live-streaming-api.ts` (removed `findIndex` usage)
  - Updated `endRoom`, `joinRoom`, `leaveRoom`, and `reactToStream` methods
- ✅ Fixed issues in `matching-api-strict.ts` example

### Verification
- ✅ `npm run typecheck:strict-optionals` — passes (strict folders are clean)
- ✅ All migrated API methods use `OptionalWithUndef<T>` for update operations
- ✅ All API files use absolute paths (`@/api/types`, `@/core/domain/*`, `@/lib/*`)
- ✅ No remaining relative imports in `src/api/` files (except `index.ts` re-exports and `README.md`)

## Recent Updates - Component Migration

### Components Migrated (2024)
- ✅ **MatchingConfigPanel** - Updated to use `UpdateMatchingConfigData` strict type
  - Changed from passing full `MatchingConfig` to using `UpdateMatchingConfigData`
  - Updated imports to use `@/core/domain/matching-config` instead of `@/lib/domain/matching-config`
  - Updated API import to use `@/api/matching-api` instead of `@/lib/api/matching-api`
  - Component now properly uses strict optional semantics for updates
- ✅ **matching-api.ts** - Updated imports to use `@/core/domain/*` instead of relative imports
  - Changed all domain imports to use absolute paths with `@/core/domain/`
  - Ensures consistent use of strict domain types across the codebase
- ✅ **MatchingConfigPanel.test.tsx** - Created comprehensive test suite
  - Tests component rendering, loading, saving with strict types
  - Verifies proper use of `UpdateMatchingConfigData` type
  - Tests error handling and validation

### API Import Consistency Updates (2024)
- ✅ **community-api.ts** - Updated imports to use absolute paths
  - Changed relative imports (`../community-types`, `../contracts`, `../utils`) to `@/lib/` paths                                                               
  - Improves consistency and maintainability
- ✅ **lost-found-api.ts** - Updated imports to use absolute paths
  - Changed relative imports (`../lost-found-types`, `../utils`) to `@/lib/` paths                                                                              
- ✅ **live-streaming-api.ts** - Updated imports to use absolute paths
  - Changed relative imports (`../live-streaming-types`, `../utils`) to `@/lib/` paths                                                                          
- ✅ **api/index.ts** - Updated type re-exports to use absolute paths
  - Changed all relative imports (`../adoption-marketplace-types`, etc.) to `@/lib/` paths                                                                      
  - Ensures consistent import paths across all API files
- ✅ **matching-api.ts** - Updated type imports to use absolute paths
  - Changed `from './types'` to `from '@/api/types'` for strict type imports
  - All domain imports already use `@/core/domain/*` paths
- ✅ **adoption-api.ts** - Updated type imports to use absolute paths
  - Changed `from './types'` to `from '@/api/types'` for strict type imports
- ✅ **matching-api-strict.ts** - Updated type imports to use absolute paths
  - Changed `from './types'` to `from '@/api/types'` for strict type imports
- ✅ **adoption-api-strict.ts** - Updated type imports to use absolute paths
  - Changed `from './types'` to `from '@/api/types'` for strict type imports

### Infrastructure Updates (2024)
- ✅ **entitlements-engine.ts** - Updated to use domain functions
  - Now imports `Plan`, `Entitlements`, `UsageCounter` from `@/core/domain/business`                                                                            
  - Uses `getEntitlementsForPlan()` from domain instead of local implementation
  - Uses `checkUsageWithinLimits()` from domain for usage validation
  - Uses `isFeatureEnabled()` from domain for feature checks
  - Infrastructure layer now delegates to domain layer for pure calculations
  - Maintains backward compatibility - all exports still work

### API Updates - Domain Validation (2024)
- ✅ **lost-found-api.ts** - Updated to use domain validation functions
  - Now imports `LostAlertStatus` from `@/core/domain/lost-found`
  - Uses `isValidLostAlertStatusTransition()` in `updateAlertStatus()` to validate status transitions
  - Uses `canReceiveSightings()` in `createSighting()` to validate alert state
  - API layer now enforces domain business rules
- ✅ **community-api.ts** - Updated to use domain validation functions
  - Now imports `PostStatus`, `CommentStatus` from `@/core/domain/community`
  - Uses `isValidPostStatusTransition()` in `updatePostStatus()` to validate status transitions
  - Uses `canReceiveComments()` in `createComment()` to validate post state
  - API layer now enforces domain business rules
- ✅ **api/index.ts** - Updated to export domain types
  - Now exports `LostAlertStatus` from `@/core/domain/lost-found`
  - Now exports `PostStatus`, `CommentStatus` from `@/core/domain/community`
  - Provides centralized access to domain types

### Additional Domain Logic Migration (2024)
- ✅ **lost-found.ts** - Migrated lost & found domain logic to `src/core/domain/`
  - Moved lost alert status types and workflows
  - Added `isValidLostAlertStatusTransition()` - Status transition validation
  - Added `canReceiveSightings()`, `canEditAlert()`, `canMarkAsFound()` - Business rules
  - Created comprehensive tests (`lost-found.test.ts`)
- ✅ **community.ts** - Migrated community domain logic to `src/core/domain/`
  - Moved post status types and workflows
  - Moved comment status types and workflows
  - Added `isValidPostStatusTransition()` - Post status transition validation
  - Added `isValidCommentStatusTransition()` - Comment status transition validation
  - Added `canEditPost()`, `canReceiveComments()`, `canReceiveReactions()` - Post business rules
  - Added `canEditComment()`, `canCommentReceiveReactions()` - Comment business rules
  - Added `canViewPost()` - Post visibility rules
  - Created comprehensive tests (`community.test.ts`)

### Component Updates (2024)
- ✅ **ContentModerationQueue.tsx** - Updated to use domain types
  - Now imports `LostAlertStatus` from `@/core/domain/lost-found` instead of `@/lib/lost-found-types`
  - Now imports `PostStatus` from `@/core/domain/community` instead of `@/lib/community-types`
  - Components now use strict domain types for status values

## Next Steps

1. **Move more domain logic** — identify additional critical logic in `src/lib/` to move to `src/core/`                                                         
2. **Add update methods** — if `community-api.ts` or `lost-found-api.ts` need content update methods (not just status), add them with strict optional semantics 
3. **Gradual migration** — continue incrementally without breaking existing code
4. **Update remaining components** — migrate other components to use domain types where appropriate

## Notes on Status Update Methods

The following methods don't require strict optional migration since they only update status fields, not partial content:
- `community-api.ts::updatePostStatus` - Only updates status field
- `lost-found-api.ts::updateAlertStatus` - Only updates status field

These methods were improved for TypeScript safety (using `.find()` instead of `.findIndex()`), but don't need `OptionalWithUndef<T>` since they're not partial updates.

The strict optionals setup is complete and ready for incremental migration. Legacy code remains unaffected, and new code in strict folders enforces exact optional semantics.
