-- Flyway migration V1__create_pets_schema.sql
-- PostgreSQL 16 with PostGIS 3 extension

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Species enum
CREATE TYPE species_type AS ENUM ('DOG', 'CAT');
CREATE TYPE life_stage_type AS ENUM ('PUPPY', 'KITTEN', 'YOUNG', 'ADULT', 'SENIOR');
CREATE TYPE pet_size_type AS ENUM ('TOY', 'SMALL', 'MEDIUM', 'LARGE', 'GIANT', 'SMALL_CAT', 'MEDIUM_CAT', 'LARGE_CAT');
CREATE TYPE sex_type AS ENUM ('MALE', 'FEMALE');
CREATE TYPE neuter_status_type AS ENUM ('INTACT', 'NEUTERED', 'UNKNOWN');
CREATE TYPE intent_type AS ENUM ('PLAYDATE', 'COMPANIONSHIP', 'ADOPTION', 'BREEDING');
CREATE TYPE moderation_status_type AS ENUM ('PENDING', 'APPROVED', 'HELD_FOR_KYC', 'REJECTED');

-- Pets table
CREATE TABLE pets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL,
    species species_type NOT NULL,
    breed_code VARCHAR(100) NOT NULL,
    breed_mix JSONB,
    name VARCHAR(255) NOT NULL,
    sex sex_type NOT NULL,
    neuter_status neuter_status_type NOT NULL,
    date_of_birth DATE,
    age_months INTEGER NOT NULL CHECK (age_months >= 0),
    life_stage life_stage_type NOT NULL,
    size pet_size_type NOT NULL,
    weight_kg DOUBLE PRECISION CHECK (weight_kg > 0),
    
    -- Health data (JSONB for flexibility)
    health_data JSONB NOT NULL,
    
    -- Temperament data (JSONB)
    temperament_data JSONB NOT NULL,
    
    -- Socialization data (JSONB)
    socialization_data JSONB NOT NULL,
    
    -- Intents array
    intents intent_type[] NOT NULL DEFAULT '{}',
    
    -- Location data
    geohash7 CHAR(7) NOT NULL,
    city VARCHAR(255) NOT NULL,
    country VARCHAR(100) NOT NULL,
    timezone VARCHAR(100) NOT NULL,
    rounded_lat DOUBLE PRECISION NOT NULL CHECK (rounded_lat BETWEEN -90 AND 90),
    rounded_lng DOUBLE PRECISION NOT NULL CHECK (rounded_lng BETWEEN -180 AND 180),
    location_point GEOGRAPHY(POINT, 4326), -- PostGIS point for distance queries
    
    -- AI hints (optional JSONB)
    ai_hints JSONB,
    
    -- Verification flags
    vet_verified BOOLEAN NOT NULL DEFAULT FALSE,
    kyc_verified BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Bio
    bio TEXT,
    
    -- Blocklist (array of pet IDs)
    blocklist UUID[] DEFAULT '{}',
    
    -- Status
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_health_data CHECK (
        health_data ? 'vaccinationsUpToDate' AND
        health_data ? 'aggressionFlags'
    ),
    CONSTRAINT valid_temperament_data CHECK (
        temperament_data ? 'energyLevel' AND
        temperament_data ? 'friendliness' AND
        temperament_data ? 'playfulness' AND
        temperament_data ? 'calmness' AND
        temperament_data ? 'independence'
    ),
    CONSTRAINT valid_socialization_data CHECK (
        socialization_data ? 'comfortWithDogs' AND
        socialization_data ? 'comfortWithCats' AND
        socialization_data ? 'comfortWithKids' AND
        socialization_data ? 'comfortWithStrangers'
    ),
    CONSTRAINT valid_intents CHECK (array_length(intents, 1) > 0)
);

-- Photos table
CREATE TABLE photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    moderation_status moderation_status_type NOT NULL DEFAULT 'PENDING',
    moderated_at TIMESTAMPTZ,
    moderated_by UUID,
    rejection_reason TEXT,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    display_order INTEGER DEFAULT 0
);

-- Owner preferences table
CREATE TABLE owner_preferences (
    owner_id UUID PRIMARY KEY,
    max_distance_km DOUBLE PRECISION NOT NULL CHECK (max_distance_km > 0 AND max_distance_km <= 20000),
    species_allowed species_type[] DEFAULT '{}',
    size_compatible pet_size_type[] DEFAULT '{}',
    intents_allowed intent_type[] DEFAULT '{}',
    life_stage_window life_stage_type[] DEFAULT '{}',
    schedule_windows TEXT[] DEFAULT '{}',
    global_search BOOLEAN NOT NULL DEFAULT FALSE,
    require_vaccinations BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_pets_owner_id ON pets(owner_id);
CREATE INDEX idx_pets_species ON pets(species);
CREATE INDEX idx_pets_breed_code ON pets(breed_code);
CREATE INDEX idx_pets_life_stage ON pets(life_stage);
CREATE INDEX idx_pets_size ON pets(size);
CREATE INDEX idx_pets_is_active ON pets(is_active);
CREATE INDEX idx_pets_location_point ON pets USING GIST(location_point);
CREATE INDEX idx_pets_geohash7 ON pets(geohash7);
CREATE INDEX idx_pets_created_at ON pets(created_at DESC);

CREATE INDEX idx_photos_pet_id ON photos(pet_id);
CREATE INDEX idx_photos_moderation_status ON photos(moderation_status);
CREATE INDEX idx_photos_moderation_status_pet ON photos(moderation_status, pet_id);

CREATE INDEX idx_owner_preferences_owner_id ON owner_preferences(owner_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_pets_updated_at BEFORE UPDATE ON pets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_owner_preferences_updated_at BEFORE UPDATE ON owner_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to compute location_point from lat/lng
CREATE OR REPLACE FUNCTION update_pet_location_point()
RETURNS TRIGGER AS $$
BEGIN
    NEW.location_point = ST_SetSRID(ST_MakePoint(NEW.rounded_lng, NEW.rounded_lat), 4326)::geography;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_pet_location_point BEFORE INSERT OR UPDATE ON pets
    FOR EACH ROW EXECUTE FUNCTION update_pet_location_point();

-- Function to compute age_months and life_stage from date_of_birth
CREATE OR REPLACE FUNCTION compute_pet_age_and_life_stage()
RETURNS TRIGGER AS $$
DECLARE
    computed_age_months INTEGER;
    computed_life_stage life_stage_type;
BEGIN
    IF NEW.date_of_birth IS NOT NULL THEN
        computed_age_months := EXTRACT(YEAR FROM AGE(NEW.date_of_birth)) * 12 + EXTRACT(MONTH FROM AGE(NEW.date_of_birth));
        NEW.age_months := computed_age_months;
    END IF;
    
    IF NEW.species = 'DOG' THEN
        computed_life_stage := CASE
            WHEN NEW.age_months < 12 THEN 'PUPPY'::life_stage_type
            WHEN NEW.age_months < 24 THEN 'YOUNG'::life_stage_type
            WHEN NEW.age_months < 84 THEN 'ADULT'::life_stage_type
            ELSE 'SENIOR'::life_stage_type
        END;
    ELSIF NEW.species = 'CAT' THEN
        computed_life_stage := CASE
            WHEN NEW.age_months < 12 THEN 'KITTEN'::life_stage_type
            WHEN NEW.age_months < 24 THEN 'YOUNG'::life_stage_type
            WHEN NEW.age_months < 120 THEN 'ADULT'::life_stage_type
            ELSE 'SENIOR'::life_stage_type
        END;
    END IF;
    
    NEW.life_stage := computed_life_stage;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER compute_pet_age_and_life_stage_trigger BEFORE INSERT OR UPDATE ON pets
    FOR EACH ROW EXECUTE FUNCTION compute_pet_age_and_life_stage();

-- Matches table (for tracking mutual likes)
CREATE TABLE matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pet1_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
    pet2_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
    match_score INTEGER CHECK (match_score BETWEEN 0 AND 100),
    score_breakdown JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(pet1_id, pet2_id),
    CHECK (pet1_id < pet2_id) -- Ensure consistent ordering
);

CREATE INDEX idx_matches_pet1_id ON matches(pet1_id);
CREATE INDEX idx_matches_pet2_id ON matches(pet2_id);
CREATE INDEX idx_matches_created_at ON matches(created_at DESC);

-- Swipes table (for tracking likes/passes)
CREATE TABLE swipes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    swiper_pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
    swiped_pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
    action VARCHAR(10) NOT NULL CHECK (action IN ('like', 'pass')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(swiper_pet_id, swiped_pet_id)
);

CREATE INDEX idx_swipes_swiper_pet_id ON swipes(swiper_pet_id);
CREATE INDEX idx_swipes_swiped_pet_id ON swipes(swiped_pet_id);
CREATE INDEX idx_swipes_action ON swipes(action);

-- Reports table (for moderation)
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reported_pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
    reporter_user_id UUID NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
    reviewed_by UUID,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reports_reported_pet_id ON reports(reported_pet_id);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_created_at ON reports(created_at DESC);

