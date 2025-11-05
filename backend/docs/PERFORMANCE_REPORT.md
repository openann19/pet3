# Performance Report: Pet Matching Engine

## Overview
Production-grade pet matching system for dogs and cats with explainable scores, strict safety gates, and admin-tunable weights.

## Performance Targets

### Discovery Endpoint (`POST /api/matching/discover`)
- **Target p50**: < 100ms
- **Target p95**: < 150ms (after warmup)
- **Target p99**: < 200ms

### Score Calculation (`POST /api/matching/score`)
- **Target p50**: < 50ms
- **Target p95**: < 100ms

## Architecture

### Caching Strategy
1. **Redis Cache** (Primary)
   - Key: `candidate:{petId}:{prefsHash}:{cursor}`
   - TTL: 5 minutes
   - Stores: Ranked candidate list with scores
   - Cache hit rate target: > 70% (warm)

2. **Database Cache** (Fallback)
   - Table: `candidate_cache`
   - Used when Redis unavailable
   - Auto-cleanup of expired entries

3. **ETag Validation**
   - All GET endpoints include ETag headers
   - Client sends `If-None-Match` for conditional requests
   - Reduces bandwidth for unchanged resources

### Candidate Generation Pipeline

1. **Pre-filtering** (Hard Gates)
   - SQL query with PostGIS distance filtering
   - Index: `idx_pets_location_point` (GIST)
   - Filtered by: species, size, life stage, distance, blocklist
   - Estimated time: 10-20ms

2. **Scoring** (Post-filter)
   - Batch scoring of pre-filtered candidates
   - Parallel processing: 10-20 candidates per batch
   - Estimated time: 30-50ms per 20 candidates

3. **Ranking & Pagination**
   - Sort by score DESC, recency DESC, id ASC
   - Cursor-based pagination for stable results
   - Estimated time: 5-10ms

### Cold Cache Performance

When cache is cold:
- Pre-filtering: 20-30ms
- Scoring: 50-100ms (for 20 candidates)
- Ranking: 10-15ms
- **Total cold**: 80-145ms

### Warm Cache Performance

When cache is warm:
- Cache lookup: 1-2ms
- Deserialization: 2-5ms
- **Total warm**: 3-7ms

## Metrics

### Expected Performance (p50/p95/p99)
- **Discovery (cold)**: 100ms / 150ms / 200ms
- **Discovery (warm)**: 5ms / 10ms / 20ms
- **Score calculation**: 40ms / 80ms / 120ms

### Cache Hit Rate
- **Target**: > 70% after 1 hour warmup
- **Cold start**: 0% (gradually increases)
- **Peak**: 85-90% during high traffic

### Database Query Performance
- **Pre-filter query**: < 20ms (with indexes)
- **PostGIS distance**: < 10ms (GIST index)
- **Candidate scoring**: < 50ms per batch

## Optimization Strategies

1. **Indexes**
   - `idx_pets_location_point` (GIST) for distance queries
   - `idx_pets_species_life_stage_size` (composite) for filtering
   - `idx_pets_is_active` for active pet filtering

2. **Connection Pooling**
   - HikariCP: min 10, max 50 connections
   - Redis: Pool size 20

3. **Batch Processing**
   - Score 20 candidates per batch
   - Parallel execution where possible

4. **Background Jobs**
   - Nightly candidate pool precomputation
   - Cache warming for popular pets

## Rate Limiting

- **Per token**: 10 req/s
- **Burst**: 30 requests
- **Sliding window**: 60 seconds

## Monitoring

### Key Metrics to Track
- `matching.discover.duration` (histogram)
- `matching.discover.cache_hit` (counter)
- `matching.score.duration` (histogram)
- `matching.hard_gates.rejections` (counter by reason)
- `matching.candidates.generated` (gauge)

### Alerts
- p95 > 200ms for > 5 minutes
- Cache hit rate < 50% for > 10 minutes
- Database query time > 100ms

## Scalability

### Current Capacity
- **Concurrent requests**: 1000 req/s
- **Database**: PostgreSQL 16 (read replicas for scaling)
- **Cache**: Redis 7 (cluster mode for HA)

### Future Optimizations
- ML re-ranker (XGBoost/LightGBM) behind feature flag
- Graph-based candidate generation
- Elasticsearch for advanced filtering

## Notes

- All performance targets assume PostgreSQL 16 with optimized indexes
- Redis cache is critical for meeting p95 targets
- PostGIS GIST indexes are essential for distance queries
- Background precomputation reduces cold cache latency

