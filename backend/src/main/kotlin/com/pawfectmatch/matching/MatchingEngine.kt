package com.pawfectmatch.matching

import com.pawfectmatch.domain.*
import kotlin.math.*
import kotlinx.serialization.Serializable

data class HardGateResult(
    val passed: Boolean,
    val failureReasons: List<HardGateReason>
)

data class HardGateReason(
    val code: String,
    val messageEn: String,
    val messageBg: String
)

enum class HardGateCode {
    SPECIES_POLICY,
    SAFETY_POLICY,
    VACCINATION_REQUIRED,
    DISTANCE_LIMIT,
    BREEDING_POLICY,
    MEDIA_REQUIRED,
    BLOCKED
}

data class MatchScore(
    val totalScore: Int, // 0-100
    val factorScores: FactorScores,
    val explanation: MatchExplanation
)

data class FactorScores(
    val temperamentFit: Double,
    val energyLevelFit: Double,
    val lifeStageProximity: Double,
    val sizeCompatibility: Double,
    val breedFamilyCompatibility: Double,
    val socializationCompatibility: Double,
    val intentMatch: Double,
    val distanceFit: Double,
    val healthActivityBonus: Double
)

data class MatchExplanation(
    val positive: List<ExplanationBullet>,
    val negative: List<ExplanationBullet>
)

@Serializable
data class ExplanationBullet(
    val en: String,
    val bg: String
)

data class MatchingWeights(
    val temperamentFit: Double = 20.0,
    val energyLevelFit: Double = 10.0,
    val lifeStageProximity: Double = 10.0,
    val sizeCompatibility: Double = 10.0,
    val breedFamilyCompatibility: Double = 15.0,
    val socializationCompatibility: Double = 10.0,
    val intentMatch: Double = 10.0,
    val distanceFit: Double = 10.0,
    val healthActivityBonus: Double = 5.0
) {
    init {
        val total = temperamentFit + energyLevelFit + lifeStageProximity + sizeCompatibility +
                breedFamilyCompatibility + socializationCompatibility + intentMatch + distanceFit +
                healthActivityBonus
        require(abs(total - 100.0) < 0.01) { "Weights must sum to 100.0" }
    }
}

data class HardGatesConfig(
    val allowCrossSpecies: Boolean = false,
    val requireVaccinations: Boolean = false,
    val blockAggressionConflicts: Boolean = true,
    val requireApprovedMedia: Boolean = true,
    val enforceNeuterPolicy: Boolean = true,
    val maxDistanceKm: Double = 20000.0
)

class MatchingEngine(
    private val weights: MatchingWeights = MatchingWeights(),
    private val gates: HardGatesConfig = HardGatesConfig()
) {
    fun evaluateHardGates(
        pet1: Pet,
        pet2: Pet,
        prefs1: OwnerPreferences
    ): HardGateResult {
        val failures = mutableListOf<HardGateReason>()

        // Species policy
        if (!gates.allowCrossSpecies && pet1.species != pet2.species) {
            failures.add(
                HardGateReason(
                    code = HardGateCode.SPECIES_POLICY.name,
                    messageEn = "Cross-species matching is not currently enabled",
                    messageBg = "Съвпадението между различни видове не е активирано"
                )
            )
        }

        // Safety: aggression flags
        if (gates.blockAggressionConflicts) {
            if (pet1.health.aggressionFlags.hasFlag && pet2.socialization.comfortWithKids >= 3) {
                failures.add(
                    HardGateReason(
                        code = HardGateCode.SAFETY_POLICY.name,
                        messageEn = "Safety concerns prevent this match",
                        messageBg = "Проблеми със сигурността предотвратяват това съвпадение"
                    )
                )
            }
            if (pet2.health.aggressionFlags.hasFlag && pet1.socialization.comfortWithKids >= 3) {
                failures.add(
                    HardGateReason(
                        code = HardGateCode.SAFETY_POLICY.name,
                        messageEn = "Safety concerns prevent this match",
                        messageBg = "Проблеми със сигурността предотвратяват това съвпадение"
                    )
                )
            }
            if (pet1.health.biteHistory || pet1.health.attackHistory ||
                pet2.health.biteHistory || pet2.health.attackHistory
            ) {
                failures.add(
                    HardGateReason(
                        code = HardGateCode.SAFETY_POLICY.name,
                        messageEn = "Safety history prevents this match",
                        messageBg = "Историята на сигурността предотвратява това съвпадение"
                    )
                )
            }
        }

        // Vaccinations
        if (gates.requireVaccinations || prefs1.requireVaccinations) {
            if (!pet1.health.vaccinationsUpToDate || !pet2.health.vaccinationsUpToDate) {
                failures.add(
                    HardGateReason(
                        code = HardGateCode.VACCINATION_REQUIRED.name,
                        messageEn = "Both pets must have up-to-date vaccinations",
                        messageBg = "И двете домашни любимци трябва да имат актуални ваксинации"
                    )
                )
            }
        }

        // Distance
        val distanceKm = calculateDistanceKm(pet1.location, pet2.location)
        if (!prefs1.globalSearch && distanceKm > prefs1.maxDistanceKm) {
            failures.add(
                HardGateReason(
                    code = HardGateCode.DISTANCE_LIMIT.name,
                    messageEn = "Distance exceeds maximum preference (${prefs1.maxDistanceKm}km)",
                    messageBg = "Разстоянието надвишава максималната преференция (${prefs1.maxDistanceKm}км)"
                )
            )
        }

        // Neuter/breeding conflicts
        if (gates.enforceNeuterPolicy) {
            val hasBreedingIntent = pet1.intents.contains(Intent.BREEDING) || pet2.intents.contains(Intent.BREEDING)
            if (hasBreedingIntent) {
                if (pet1.neuterStatus == NeuterStatus.NEUTERED || pet2.neuterStatus == NeuterStatus.NEUTERED) {
                    failures.add(
                        HardGateReason(
                            code = HardGateCode.BREEDING_POLICY.name,
                            messageEn = "Breeding intent requires compatible neuter status",
                            messageBg = "Намерението за развъждане изисква съвместим статус на кастрация"
                        )
                    )
                }
            }
        }

        // Media requirement
        if (gates.requireApprovedMedia) {
            if (!pet1.hasApprovedMedia() || !pet2.hasApprovedMedia()) {
                failures.add(
                    HardGateReason(
                        code = HardGateCode.MEDIA_REQUIRED.name,
                        messageEn = "Both pets must have at least one approved photo",
                        messageBg = "И двете домашни любимци трябва да имат поне една одобрена снимка"
                    )
                )
            }
        }

        // Blocklist
        if (pet1.blocklist.contains(pet2.id) || pet2.blocklist.contains(pet1.id)) {
            failures.add(
                HardGateReason(
                    code = HardGateCode.BLOCKED.name,
                    messageEn = "One pet has blocked the other",
                    messageBg = "Един домашен любимец е блокирал другия"
                )
            )
        }

        return HardGateResult(
            passed = failures.isEmpty(),
            failureReasons = failures
        )
    }

    fun calculateMatchScore(
        pet1: Pet,
        pet2: Pet,
        prefs1: OwnerPreferences
    ): MatchScore {
        val factors = FactorScores(
            temperamentFit = calculateTemperamentFit(pet1.temperament, pet2.temperament),
            energyLevelFit = calculateEnergyLevelFit(pet1.temperament.energyLevel, pet2.temperament.energyLevel),
            lifeStageProximity = calculateLifeStageProximity(pet1.lifeStage, pet2.lifeStage),
            sizeCompatibility = calculateSizeCompatibility(pet1.species, pet1.size, pet2.size),
            breedFamilyCompatibility = calculateBreedFamilyCompatibility(pet1, pet2),
            socializationCompatibility = calculateSocializationCompatibility(pet1.socialization, pet2.socialization),
            intentMatch = calculateIntentMatch(pet1.intents, pet2.intents),
            distanceFit = calculateDistanceFit(
                calculateDistanceKm(pet1.location, pet2.location),
                prefs1.maxDistanceKm
            ),
            healthActivityBonus = calculateHealthActivityBonus(pet1, pet2)
        )

        val totalScore = round(
            factors.temperamentFit * weights.temperamentFit +
                    factors.energyLevelFit * weights.energyLevelFit +
                    factors.lifeStageProximity * weights.lifeStageProximity +
                    factors.sizeCompatibility * weights.sizeCompatibility +
                    factors.breedFamilyCompatibility * weights.breedFamilyCompatibility +
                    factors.socializationCompatibility * weights.socializationCompatibility +
                    factors.intentMatch * weights.intentMatch +
                    factors.distanceFit * weights.distanceFit +
                    factors.healthActivityBonus * weights.healthActivityBonus
        ).toInt().coerceIn(0, 100)

        val explanation = buildExplanation(pet1, pet2, factors, prefs1)

        return MatchScore(
            totalScore = totalScore,
            factorScores = factors,
            explanation = explanation
        )
    }

    private fun calculateTemperamentFit(t1: TemperamentData, t2: TemperamentData): Double {
        val v1 = t1.toVector()
        val v2 = t2.toVector()
        return 1.0 - cosineDistance(v1, v2)
    }

    private fun cosineDistance(v1: List<Double>, v2: List<Double>): Double {
        require(v1.size == v2.size) { "Vectors must have same size" }
        val dotProduct = v1.zip(v2).sumOf { (a, b) -> a * b }
        val norm1 = sqrt(v1.sumOf { it * it })
        val norm2 = sqrt(v2.sumOf { it * it })
        return if (norm1 == 0.0 || norm2 == 0.0) 1.0 else 1.0 - (dotProduct / (norm1 * norm2))
    }

    private fun calculateEnergyLevelFit(e1: Int, e2: Int): Double {
        return 1.0 - (min(abs(e1 - e2), 5) / 5.0)
    }

    private fun calculateLifeStageProximity(s1: LifeStage, s2: LifeStage): Double {
        if (s1 == s2) return 1.0
        val stages = listOf(LifeStage.PUPPY, LifeStage.KITTEN, LifeStage.YOUNG, LifeStage.ADULT, LifeStage.SENIOR)
        val idx1 = stages.indexOf(s1)
        val idx2 = stages.indexOf(s2)
        if (idx1 == -1 || idx2 == -1) return 0.3
        val distance = abs(idx1 - idx2)
        return when (distance) {
            1 -> 0.7
            2 -> 0.4
            else -> 0.3
        }
    }

    private fun calculateSizeCompatibility(species: Species, size1: PetSize, size2: PetSize): Double {
        val normalized1 = PetSize.normalize(size1, species)
        val normalized2 = PetSize.normalize(size2, species)
        return SizeCompatibilityMatrix.getCompatibility(species, normalized1, normalized2)
    }

    private fun calculateBreedFamilyCompatibility(pet1: Pet, pet2: Pet): Double {
        // Breed family compatibility (0.0-1.0)
        // Neutral for cats if unavailable, use breed code similarity for dogs
        if (pet1.species == Species.CAT) return 0.7 // Default neutral-good for cats
        // For dogs, use breed family data if available, otherwise neutral
        return 0.7 // Placeholder - would use breed taxonomy data
    }

    private fun calculateSocializationCompatibility(s1: SocializationData, s2: SocializationData): Double {
        val compatDogs = 1.0 - (abs(s1.comfortWithDogs - s2.comfortWithDogs) / 5.0)
        val compatCats = 1.0 - (abs(s1.comfortWithCats - s2.comfortWithCats) / 5.0)
        val compatKids = 1.0 - (abs(s1.comfortWithKids - s2.comfortWithKids) / 5.0)
        val compatStrangers = 1.0 - (abs(s1.comfortWithStrangers - s2.comfortWithStrangers) / 5.0)
        return (compatDogs + compatCats + compatKids + compatStrangers) / 4.0
    }

    private fun calculateIntentMatch(intents1: List<Intent>, intents2: List<Intent>): Double {
        if (intents1.isEmpty() || intents2.isEmpty()) return 0.0
        val intersection = intents1.intersect(intents2.toSet()).size
        val union = intents1.union(intents2.toSet()).size
        return if (union == 0) 0.0 else intersection.toDouble() / union.toDouble()
    }

    private fun calculateDistanceFit(distanceKm: Double, maxDistanceKm: Double): Double {
        val gamma = 0.6
        val normalized = (distanceKm / maxDistanceKm).pow(gamma)
        return (1.0 - normalized).coerceIn(0.0, 1.0)
    }

    private fun calculateHealthActivityBonus(pet1: Pet, pet2: Pet): Double {
        val vaccBonus = if (pet1.health.vaccinationsUpToDate && pet2.health.vaccinationsUpToDate) 1.0 else 0.0
        val recencyBoost = calculateRecencyBoost(pet1, pet2)
        return (vaccBonus * 0.6) + (recencyBoost * 0.4)
    }

    private fun calculateRecencyBoost(pet1: Pet, pet2: Pet): Double {
        // Recent activity boost based on updatedAt timestamps
        // Simplified: assume recent updates = higher activity
        return 0.7 // Placeholder - would parse timestamps and calculate recency
    }

    private fun calculateDistanceKm(loc1: LocationData, loc2: LocationData): Double {
        val lat1 = loc1.roundedLat
        val lon1 = loc1.roundedLng
        val lat2 = loc2.roundedLat
        val lon2 = loc2.roundedLng

        val earthRadiusKm = 6371.0
        val dLat = Math.toRadians(lat2 - lat1)
        val dLon = Math.toRadians(lon2 - lon1)

        val a = sin(dLat / 2) * sin(dLat / 2) +
                cos(Math.toRadians(lat1)) * cos(Math.toRadians(lat2)) *
                sin(dLon / 2) * sin(dLon / 2)

        val c = 2 * atan2(sqrt(a), sqrt(1 - a))
        return earthRadiusKm * c
    }

    private fun buildExplanation(
        pet1: Pet,
        pet2: Pet,
        factors: FactorScores,
        prefs1: OwnerPreferences
    ): MatchExplanation {
        val positive = mutableListOf<ExplanationBullet>()
        val negative = mutableListOf<ExplanationBullet>()

        if (factors.temperamentFit > 0.7) {
            positive.add(
                ExplanationBullet(
                    en = "Great temperament compatibility",
                    bg = "Отлична съвместимост на темперамента"
                )
            )
        } else if (factors.temperamentFit < 0.4) {
            negative.add(
                ExplanationBullet(
                    en = "Different temperament profiles",
                    bg = "Различни профили на темперамент"
                )
            )
        }

        if (factors.energyLevelFit > 0.8) {
            positive.add(
                ExplanationBullet(
                    en = "Matching energy levels",
                    bg = "Съвпадащи енергийни нива"
                )
            )
        }

        if (factors.sizeCompatibility > 0.8) {
            positive.add(
                ExplanationBullet(
                    en = "Good size compatibility",
                    bg = "Добра съвместимост по размер"
                )
            )
        }

        if (factors.intentMatch > 0.7) {
            positive.add(
                ExplanationBullet(
                    en = "Shared interests and intentions",
                    bg = "Споделени интереси и намерения"
                )
            )
        }

        if (factors.distanceFit < 0.3) {
            negative.add(
                ExplanationBullet(
                    en = "Greater distance than preferred",
                    bg = "По-голямо разстояние от предпочитаното"
                )
            )
        }

        if (factors.healthActivityBonus < 0.5) {
            negative.add(
                ExplanationBullet(
                    en = "Health records may need updating",
                    bg = "Здравните записи може да се нуждаят от актуализация"
                )
            )
        }

        return MatchExplanation(positive = positive, negative = negative)
    }
}

object SizeCompatibilityMatrix {
    private val dogMatrix = mapOf(
        PetSize.TOY to mapOf(
            PetSize.TOY to 1.0,
            PetSize.SMALL to 0.9,
            PetSize.MEDIUM to 0.6,
            PetSize.LARGE to 0.3,
            PetSize.GIANT to 0.2
        ),
        PetSize.SMALL to mapOf(
            PetSize.TOY to 0.9,
            PetSize.SMALL to 1.0,
            PetSize.MEDIUM to 0.7,
            PetSize.LARGE to 0.4,
            PetSize.GIANT to 0.3
        ),
        PetSize.MEDIUM to mapOf(
            PetSize.TOY to 0.6,
            PetSize.SMALL to 0.7,
            PetSize.MEDIUM to 1.0,
            PetSize.LARGE to 0.8,
            PetSize.GIANT to 0.6
        ),
        PetSize.LARGE to mapOf(
            PetSize.TOY to 0.3,
            PetSize.SMALL to 0.4,
            PetSize.MEDIUM to 0.8,
            PetSize.LARGE to 1.0,
            PetSize.GIANT to 0.9
        ),
        PetSize.GIANT to mapOf(
            PetSize.TOY to 0.2,
            PetSize.SMALL to 0.3,
            PetSize.MEDIUM to 0.6,
            PetSize.LARGE to 0.9,
            PetSize.GIANT to 1.0
        )
    )

    private val catMatrix = mapOf(
        PetSize.SMALL_CAT to mapOf(
            PetSize.SMALL_CAT to 1.0,
            PetSize.MEDIUM_CAT to 0.8,
            PetSize.LARGE_CAT to 0.6
        ),
        PetSize.MEDIUM_CAT to mapOf(
            PetSize.SMALL_CAT to 0.8,
            PetSize.MEDIUM_CAT to 1.0,
            PetSize.LARGE_CAT to 0.8
        ),
        PetSize.LARGE_CAT to mapOf(
            PetSize.SMALL_CAT to 0.6,
            PetSize.MEDIUM_CAT to 0.8,
            PetSize.LARGE_CAT to 1.0
        )
    )

    fun getCompatibility(species: Species, size1: PetSize, size2: PetSize): Double {
        val matrix = when (species) {
            Species.DOG -> dogMatrix
            Species.CAT -> catMatrix
        }
        return matrix[size1]?.get(size2) ?: 0.5
    }
}

