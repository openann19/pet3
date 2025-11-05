# Quick Start Guide

## Prerequisites

- Java 17+
- PostgreSQL 16 with PostGIS 3 extension
- Redis 7 (for caching)
- Gradle 8.0+

## Setup

1. **Database Setup**
```bash
# Create database
createdb pawfectmatch

# Enable PostGIS
psql pawfectmatch -c "CREATE EXTENSION IF NOT EXISTS postgis;"

# Run migrations
./gradlew flywayMigrate
```

2. **Configuration**
```bash
# Set environment variables
export DATABASE_URL=jdbc:postgresql://localhost:5432/pawfectmatch
export REDIS_HOST=localhost
export REDIS_PORT=6379
```

3. **Load Taxonomies**
```bash
# Seed breed taxonomies from JSON files
# (Implement seed script using taxonomy/*.json files)
```

4. **Run Tests**
```bash
./gradlew test
```

## Project Structure

```
backend/
├── src/main/kotlin/com/pawfectmatch/
│   ├── domain/              # Domain models
│   ├── matching/           # Matching engine
│   ├── api/                # Ktor routes (TODO)
│   ├── db/                 # Database layer (TODO)
│   └── config/             # Configuration (TODO)
├── src/main/resources/
│   ├── db/migration/        # Flyway migrations
│   ├── taxonomy/           # Breed taxonomies (JSON)
│   ├── i18n/              # Translations (EN/BG)
│   ├── config/             # Admin configs
│   └── openapi.yaml        # API specification
└── src/test/               # Tests
```

## Key Files

- **Domain Models**: `domain/Species.kt`, `domain/Pet.kt`
- **Matching Engine**: `matching/MatchingEngine.kt`
- **Migrations**: `resources/db/migration/V1__*.sql`, `V2__*.sql`
- **Taxonomies**: `resources/taxonomy/dogs.json` (50+ breeds), `cats.json` (30+ breeds)
- **API Spec**: `resources/openapi.yaml`
- **Config**: `resources/config/matching-weights.json`

## Next Steps

1. Implement Ktor routes (`api/` package)
2. Implement database DAOs (`db/` package)
3. Add Redis caching
4. Add authentication (PASETO/JWT)
5. Add rate limiting
6. Implement background jobs

## Testing

```bash
# Run all tests
./gradlew test

# Run specific test
./gradlew test --tests MatchingEngineTest
```

## API Documentation

See `src/main/resources/openapi.yaml` for complete API specification.

## Performance Targets

- Discovery p95: < 150ms (after warmup)
- Score calculation p95: < 100ms
- Cache hit rate: > 70% (warm)

See `docs/PERFORMANCE_REPORT.md` for details.

