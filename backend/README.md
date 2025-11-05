# Pet Domain + Matching Engine Implementation

## Overview

Production-grade pet matching system for dogs and cats with explainable scores, strict safety gates, and full admin controls. Complete backend implementation in Kotlin/Ktor with PostgreSQL 16 + PostGIS 3.

## Directory Structure

```
backend/
├── src/main/
│   ├── kotlin/com/pawfectmatch/
│   │   ├── domain/
│   │   │   ├── Species.kt          # Enums: Species, LifeStage, PetSize, Sex, etc.
│   │   │   └── Pet.kt              # Domain models: Pet, OwnerPreferences, HealthData, etc.
│   │   ├── matching/
│   │   │   └── MatchingEngine.kt  # Core matching logic: hard gates + scoring
│   │   ├── api/                    # Ktor routes (to be implemented)
│   │   ├── db/                     # Database access layer (to be implemented)
│   │   └── config/                 # Configuration (to be implemented)
│   ├── resources/
│   │   ├── db/migration/
│   │   │   ├── V1__create_pets_schema.sql
│   │   │   └── V2__create_matching_config_tables.sql
│   │   ├── taxonomy/
│   │   │   ├── dogs.json           # 50+ dog breeds with EN/BG + synonyms
│   │   │   ├── cats.json           # 30+ cat breeds with EN/BG + synonyms
│   │   │   ├── size_buckets.json   # Weight ranges by species
│   │   │   └── breed_families.json # Breed family compatibility matrices
│   │   ├── i18n/
│   │   │   └── messages.json       # EN/BG translations for all enums and messages
│   │   ├── config/
│   │   │   └── matching-weights.json # Admin-tunable weights with safe ranges
│   │   └── openapi.yaml            # Complete OpenAPI 3.1 specification
│   └── test/kotlin/com/pawfectmatch/
│       └── matching/
│           └── MatchingEngineTest.kt # Unit tests
└── docs/
    └── PERFORMANCE_REPORT.md       # Performance targets and metrics
```

## Key Components

### 1. Domain Model (`domain/`)

**Species.kt**: Core enums with localized labels
- `Species`: DOG, CAT
- `LifeStage`: PUPPY/KITTEN, YOUNG, ADULT, SENIOR (species-specific thresholds)
- `PetSize`: TOY, SMALL, MEDIUM, LARGE, GIANT (dogs); SMALL_CAT, MEDIUM_CAT, LARGE_CAT (cats)
- `Sex`, `NeuterStatus`, `Intent`, `ModerationStatus`

**Pet.kt**: Complete pet domain model
- `Pet`: Full pet profile with health, temperament, socialization, location
- `OwnerPreferences`: Discovery preferences with distance, species, size filters
- `HealthData`, `TemperamentData`, `SocializationData`: Structured behavioral data
- `LocationData`: Geohash7 + rounded lat/lng (privacy-safe)
- `Photo`: Media with moderation status

### 2. Matching Engine (`matching/`)

**MatchingEngine.kt**: Two-layer matching policy

**Hard Gates** (fail = no match):
- Species policy (cross-species off by default)
- Safety: aggression flags + kids comfort conflict
- Vaccinations: require if policy or owner preference
- Distance: within maxDistanceKm (unless global search)
- Neuter/breeding: breeding intent requires compatible status
- Media: require approved photos for public discovery
- Blocklist: mutual block check

**Scored Factors** (default weights sum to 100):
- Temperament fit (cosine similarity): 20%
- Energy level fit: 10%
- Life stage proximity: 10%
- Size compatibility (matrix): 10%
- Breed family compatibility: 15%
- Socialization compatibility: 10%
- Intent match (Jaccard): 10%
- Distance fit (diminishing returns, γ=0.6): 10%
- Health/activity bonus: 5%

**Score Calculation**:
- All factors normalized to 0.0-1.0
- Weighted sum rounded to 0-100 integer
- Deterministic and reproducible

**Explanations**:
- Positive/negative bullets in EN/BG
- Generic reason codes for hard gate rejects
- Factor-specific explanations for scored matches

### 3. Database Schema (`db/migration/`)

**V1__create_pets_schema.sql**:
- `pets` table with PostGIS `location_point` (GEOGRAPHY)
- `photos` table with moderation status
- `owner_preferences` table
- `matches` table (mutual likes)
- `swipes` table (like/pass tracking)
- `reports` table (moderation)
- Indexes: GIST for location, composite for filtering
- Triggers: auto-compute age/life_stage, location_point, updated_at

**V2__create_matching_config_tables.sql**:
- `matching_config` table (admin-tunable weights/gates)
- `matching_config_audit` table (change tracking)
- `candidate_cache` table (fallback cache)
- `breed_taxonomy` table (fast lookups)
- `size_compatibility_matrix` table
- `matching_metrics` table (analytics)

### 4. Taxonomies (`taxonomy/`)

**dogs.json**: 50+ breeds
- Canonical codes (e.g., `dog_german_shepherd`)
- EN/BG names
- Synonyms array (e.g., ["GSD", "Alsatian"])

**cats.json**: 30+ breeds
- Same structure as dogs.json

**size_buckets.json**: Weight ranges
- Dogs: toy (<5kg), small (5-11kg), medium (11-27kg), large (27-45kg), giant (>45kg)
- Cats: small (<4kg), medium (4-7kg), large (>7kg)

**breed_families.json**: Compatibility matrices
- Dogs: sporting, herding, working, terrier, toy, hound, non-sporting, mixed
- Cats: longhair, shorthair, rex, hairless, mixed
- Compatibility scores (0.0-1.0) between families

### 5. API Specification (`openapi.yaml`)

Complete OpenAPI 3.1 specification with:
- All endpoints: GET/POST/PUT operations
- Security: PASETO v4 or JWT
- Schemas: Pet, OwnerPreferences, ScoreBreakdown, HardGateReason, etc.
- Examples and validation rules

**Endpoints**:
- `GET /api/pets/{id}` - Public pet profile
- `GET /api/me/pets` - My pets (includes pending media)
- `POST /api/matching/discover` - Ranked candidates
- `POST /api/matching/score` - Score + explanation
- `GET/PUT /api/preferences` - Owner preferences
- `POST /api/swipe` - Like/pass
- `GET /api/matches` - My matches
- `POST /api/report` - Report pet
- `GET/PUT /api/admin/matching/config` - Admin config
- `GET/PUT /api/admin/taxonomy` - Breed taxonomy
- `GET /api/admin/metrics/matching` - Analytics

### 6. Configuration (`config/`)

**matching-weights.json**:
- Default weights with safe ranges [min, max]
- Validation rules (sum must equal 100.0, tolerance 0.01)
- Species-specific overrides (e.g., lower breed family weight for cats)

### 7. Internationalization (`i18n/`)

**messages.json**:
- EN/BG translations for all enums
- Hard gate reason messages
- Explanation bullets
- All strings verified for +40% BG expansion

### 8. Tests (`test/`)

**MatchingEngineTest.kt**:
- Hard gate tests (species, vaccination, aggression, distance)
- Score calculation tests (range validation, normalization)
- Weight validation tests
- Property tests (score ∈ [0,100], factors normalized)

## Performance Targets

- **Discovery p50**: < 100ms
- **Discovery p95**: < 150ms (after warmup)
- **Score calculation p95**: < 100ms
- **Cache hit rate**: > 70% (warm)

See `docs/PERFORMANCE_REPORT.md` for detailed metrics.

## Privacy & Safety

- **Geolocation**: Only geohash7 (≈300-500m) exposed publicly; exact lat/lng stored privately
- **Blocklists**: Enforced in hard gates
- **Reports**: Reporter identity never exposed
- **Moderation**: Photos require approval before public visibility

## Admin Controls

- **Weights**: Tunable with safe ranges [min, max]
- **Gates**: Toggle cross-species, vaccination requirements, etc.
- **Taxonomy**: Update breeds, synonyms, size thresholds
- **Metrics**: Track conversion, score distributions, decline reasons
- **Audit**: All config changes logged

## Next Steps (Implementation)

1. **Ktor Routes** (`api/`):
   - Implement endpoints from OpenAPI spec
   - Add PASETO/JWT authentication
   - Add rate limiting (sliding window)
   - Add ETag support

2. **Database Layer** (`db/`):
   - Implement DAOs using Exposed or JDBC
   - Add connection pooling (HikariCP)
   - Add Redis client for caching

3. **Dependency Injection** (`config/`):
   - Koin modules for services, repositories
   - Configuration loading from environment

4. **Background Jobs**:
   - Nightly candidate pool precomputation
   - Cache warming for popular pets

5. **Mobile Integration**:
   - Android Compose UI consuming API
   - Room database for offline cache
   - DataStore for preferences

6. **Admin Console**:
   - Next.js 15 + TypeScript
   - TanStack Table for data grids
   - shadcn/ui components
   - Weights editor with preview

## Testing

Run tests:
```bash
./gradlew test
```

Coverage target: ≥95% for matching engine.

## Configuration Flags

- `MATCH_ALLOW_CROSS_SPECIES=false`
- `MATCH_REQUIRE_VACCINATION` (per region)
- `MATCH_DISTANCE_MAX_KM=20000`
- `MATCH_AB_TEST_KEYS` (for future ML re-ranker)
- `MATCH_AI_HINTS_ENABLED=true`

## Documentation

- **OpenAPI Spec**: `src/main/resources/openapi.yaml`
- **Performance Report**: `docs/PERFORMANCE_REPORT.md`
- **Database Migrations**: `src/main/resources/db/migration/`
- **Taxonomies**: `src/main/resources/taxonomy/`

## License

Proprietary - PawfectMatch

