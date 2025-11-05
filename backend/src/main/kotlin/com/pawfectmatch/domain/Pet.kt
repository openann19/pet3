package com.pawfectmatch.domain

import kotlinx.serialization.Serializable
import java.time.LocalDate
import java.time.OffsetDateTime

@Serializable
data class HealthData(
    val vaccinationsUpToDate: Boolean,
    val lastVetCheck: String? = null,
    val specialNeeds: List<String> = emptyList(),
    val aggressionFlags: AggressionFlags,
    val biteHistory: Boolean = false,
    val attackHistory: Boolean = false
)

@Serializable
data class AggressionFlags(
    val hasFlag: Boolean,
    val reason: String? = null
)

@Serializable
data class TemperamentData(
    val energyLevel: Int, // 0-5
    val friendliness: Int, // 0-5
    val playfulness: Int, // 0-5
    val calmness: Int, // 0-5
    val independence: Int, // 0-5
    val traits: List<String> = emptyList()
) {
    init {
        require(energyLevel in 0..5) { "energyLevel must be 0-5" }
        require(friendliness in 0..5) { "friendliness must be 0-5" }
        require(playfulness in 0..5) { "playfulness must be 0-5" }
        require(calmness in 0..5) { "calmness must be 0-5" }
        require(independence in 0..5) { "independence must be 0-5" }
    }

    fun toVector(): List<Double> = listOf(
        energyLevel.toDouble(),
        friendliness.toDouble(),
        playfulness.toDouble(),
        calmness.toDouble(),
        independence.toDouble()
    )
}

@Serializable
data class SocializationData(
    val comfortWithDogs: Int, // 0-5
    val comfortWithCats: Int, // 0-5
    val comfortWithKids: Int, // 0-5
    val comfortWithStrangers: Int // 0-5
) {
    init {
        require(comfortWithDogs in 0..5) { "comfortWithDogs must be 0-5" }
        require(comfortWithCats in 0..5) { "comfortWithCats must be 0-5" }
        require(comfortWithKids in 0..5) { "comfortWithKids must be 0-5" }
        require(comfortWithStrangers in 0..5) { "comfortWithStrangers must be 0-5" }
    }
}

@Serializable
data class LocationData(
    val geohash7: String,
    val city: String,
    val country: String,
    val timezone: String,
    val roundedLat: Double, // Private, never exposed in public APIs
    val roundedLng: Double  // Private, never exposed in public APIs
) {
    init {
        require(geohash7.length == 7) { "geohash7 must be exactly 7 characters" }
        require(roundedLat in -90.0..90.0) { "roundedLat must be -90 to 90" }
        require(roundedLng in -180.0..180.0) { "roundedLng must be -180 to 180" }
    }
}

@Serializable
data class Photo(
    val id: String,
    val url: String,
    val moderationStatus: ModerationStatus,
    val moderatedAt: String? = null,
    val moderatedBy: String? = null,
    val rejectionReason: String? = null,
    val uploadedAt: String
)

@Serializable
data class AIHints(
    val breedInference: BreedInference? = null,
    val coatColor: String? = null,
    val sizeEstimate: PetSize? = null,
    val ageEstimateMonths: Int? = null,
    val qualityScore: Double? = null
)

@Serializable
data class BreedInference(
    val code: String,
    val confidence: Double // 0.0-1.0
)

@Serializable
data class Pet(
    val id: String,
    val ownerId: String,
    val species: Species,
    val breedCode: String,
    val breedMix: List<String>? = null,
    val name: String,
    val sex: Sex,
    val neuterStatus: NeuterStatus,
    val dateOfBirth: String? = null, // ISO 8601 date
    val ageMonths: Int, // Derived from dateOfBirth or explicitly set
    val lifeStage: LifeStage, // Derived by species and age
    val size: PetSize,
    val weightKg: Double? = null,
    val health: HealthData,
    val temperament: TemperamentData,
    val socialization: SocializationData,
    val intents: List<Intent>,
    val location: LocationData,
    val media: List<Photo>,
    val aiHints: AIHints? = null,
    val vetVerified: Boolean = false,
    val kycVerified: Boolean = false,
    val bio: String? = null,
    val blocklist: List<String> = emptyList(),
    val isActive: Boolean = true,
    val createdAt: String, // ISO 8601 datetime
    val updatedAt: String // ISO 8601 datetime
) {
    init {
        require(name.isNotBlank()) { "name cannot be blank" }
        require(breedCode.isNotBlank()) { "breedCode cannot be blank" }
        require(ageMonths >= 0) { "ageMonths must be >= 0" }
        require(intents.isNotEmpty()) { "intents cannot be empty" }
        require(media.isNotEmpty()) { "media cannot be empty" }
        require(weightKg == null || weightKg > 0) { "weightKg must be positive" }
    }

    fun hasApprovedMedia(): Boolean = media.any { it.moderationStatus == ModerationStatus.APPROVED }

    fun computeLifeStage(): LifeStage = when (species) {
        Species.DOG -> LifeStage.forDogs(ageMonths)
        Species.CAT -> LifeStage.forCats(ageMonths)
    }

    fun computeSize(): PetSize = when (species) {
        Species.DOG -> PetSize.forDogs(weightKg)
        Species.CAT -> PetSize.forCats(weightKg)
    }
}

@Serializable
data class OwnerPreferences(
    val ownerId: String,
    val maxDistanceKm: Double,
    val speciesAllowed: List<Species> = emptyList(), // Default: same species only
    val sizeCompatible: List<PetSize> = emptyList(),
    val intentsAllowed: List<Intent> = emptyList(),
    val lifeStageWindow: List<LifeStage> = emptyList(),
    val scheduleWindows: List<String> = emptyList(), // e.g., "weekday_evening"
    val globalSearch: Boolean = false,
    val requireVaccinations: Boolean = false,
    val updatedAt: String // ISO 8601 datetime
) {
    init {
        require(maxDistanceKm > 0) { "maxDistanceKm must be > 0" }
        require(maxDistanceKm <= 20000.0) { "maxDistanceKm cannot exceed 20000km (global max)" }
    }
}

