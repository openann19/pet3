-- Flyway migration V2__create_matching_config_tables.sql

-- Matching configuration (admin-tunable weights and gates)
CREATE TABLE matching_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    species species_type,
    region VARCHAR(100),
    weights JSONB NOT NULL,
    hard_gates JSONB NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(species, region)
);

CREATE INDEX idx_matching_config_species ON matching_config(species);
CREATE INDEX idx_matching_config_region ON matching_config(region);
CREATE INDEX idx_matching_config_is_active ON matching_config(is_active);

CREATE TRIGGER update_matching_config_updated_at BEFORE UPDATE ON matching_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Audit log for matching config changes
CREATE TABLE matching_config_audit (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    config_id UUID REFERENCES matching_config(id) ON DELETE SET NULL,
    changed_by UUID NOT NULL,
    change_type VARCHAR(20) NOT NULL CHECK (change_type IN ('create', 'update', 'delete')),
    old_values JSONB,
    new_values JSONB,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_matching_config_audit_config_id ON matching_config_audit(config_id);
CREATE INDEX idx_matching_config_audit_changed_at ON matching_config_audit(changed_at DESC);

-- Candidate cache (Redis-compatible structure, but stored in DB for fallback)
CREATE TABLE candidate_cache (
    cache_key VARCHAR(255) PRIMARY KEY,
    pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
    candidate_pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
    score INTEGER CHECK (score BETWEEN 0 AND 100),
    cached_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_candidate_cache_key ON candidate_cache(cache_key);
CREATE INDEX idx_candidate_cache_pet_id ON candidate_cache(pet_id);
CREATE INDEX idx_candidate_cache_expires_at ON candidate_cache(expires_at);

-- Function to clean expired cache entries
CREATE OR REPLACE FUNCTION clean_expired_candidate_cache()
RETURNS void AS $$
BEGIN
    DELETE FROM candidate_cache WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Breed taxonomy cache (for fast lookups)
CREATE TABLE breed_taxonomy (
    code VARCHAR(100) PRIMARY KEY,
    species species_type NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    name_bg VARCHAR(255) NOT NULL,
    synonyms TEXT[] DEFAULT '{}',
    family VARCHAR(100),
    size_category VARCHAR(50),
    typical_weight_min_kg DOUBLE PRECISION,
    typical_weight_max_kg DOUBLE PRECISION,
    temperament_tags TEXT[] DEFAULT '{}',
    energy_level INTEGER CHECK (energy_level BETWEEN 0 AND 5),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_breed_taxonomy_species ON breed_taxonomy(species);
CREATE INDEX idx_breed_taxonomy_family ON breed_taxonomy(family);
CREATE INDEX idx_breed_taxonomy_code ON breed_taxonomy(code);

CREATE TRIGGER update_breed_taxonomy_updated_at BEFORE UPDATE ON breed_taxonomy
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Size compatibility matrix cache
CREATE TABLE size_compatibility_matrix (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    species species_type NOT NULL,
    size1 pet_size_type NOT NULL,
    size2 pet_size_type NOT NULL,
    compatibility_score DOUBLE PRECISION NOT NULL CHECK (compatibility_score BETWEEN 0 AND 1),
    UNIQUE(species, size1, size2)
);

CREATE INDEX idx_size_compatibility_matrix_species ON size_compatibility_matrix(species);
CREATE INDEX idx_size_compatibility_matrix_size1 ON size_compatibility_matrix(size1);
CREATE INDEX idx_size_compatibility_matrix_size2 ON size_compatibility_matrix(size2);

-- Matching metrics (for analytics)
CREATE TABLE matching_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_date DATE NOT NULL,
    species species_type,
    region VARCHAR(100),
    total_discoveries BIGINT DEFAULT 0,
    total_matches BIGINT DEFAULT 0,
    avg_match_score DOUBLE PRECISION,
    p50_discovery_ms INTEGER,
    p95_discovery_ms INTEGER,
    cache_hit_rate DOUBLE PRECISION,
    hard_gate_rejections JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(metric_date, species, region)
);

CREATE INDEX idx_matching_metrics_date ON matching_metrics(metric_date DESC);
CREATE INDEX idx_matching_metrics_species ON matching_metrics(species);
CREATE INDEX idx_matching_metrics_region ON matching_metrics(region);

