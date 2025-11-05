package com.pawfectmatch.matching

import com.pawfectmatch.domain.*
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertTrue

class MatchingEngineTest {
    private val engine = MatchingEngine()

    @Test
    fun `test hard gates - species mismatch`() {
        val pet1 = createTestPet(species = Species.DOG)
        val pet2 = createTestPet(species = Species.CAT)
        val prefs = createTestPreferences()

        val result = engine.evaluateHardGates(pet1, pet2, prefs)

        assertFalse(result.passed)
        assertTrue(result.failureReasons.any { it.code == "SPECIES_POLICY" })
    }

    @Test
    fun `test hard gates - vaccination required`() {
        val pet1 = createTestPet(
            health = HealthData(
                vaccinationsUpToDate = false,
                aggressionFlags = AggressionFlags(hasFlag = false)
            )
        )
        val pet2 = createTestPet(
            health = HealthData(
                vaccinationsUpToDate = true,
                aggressionFlags = AggressionFlags(hasFlag = false)
            )
        )
        val gates = HardGatesConfig(requireVaccinations = true)
        val engineWithGates = MatchingEngine(gates = gates)
        val prefs = createTestPreferences()

        val result = engineWithGates.evaluateHardGates(pet1, pet2, prefs)

        assertFalse(result.passed)
        assertTrue(result.failureReasons.any { it.code == "VACCINATION_REQUIRED" })
    }

    @Test
    fun `test hard gates - aggression conflict`() {
        val pet1 = createTestPet(
            health = HealthData(
                vaccinationsUpToDate = true,
                aggressionFlags = AggressionFlags(hasFlag = true, reason = "Previous incident")
            )
        )
        val pet2 = createTestPet(
            health = HealthData(
                vaccinationsUpToDate = true,
                aggressionFlags = AggressionFlags(hasFlag = false)
            ),
            socialization = SocializationData(
                comfortWithDogs = 3,
                comfortWithCats = 3,
                comfortWithKids = 4, // >= 3 triggers conflict
                comfortWithStrangers = 3
            )
        )
        val prefs = createTestPreferences()

        val result = engine.evaluateHardGates(pet1, pet2, prefs)

        assertFalse(result.passed)
        assertTrue(result.failureReasons.any { it.code == "SAFETY_POLICY" })
    }

    @Test
    fun `test hard gates - distance exceeded`() {
        val pet1 = createTestPet(
            location = LocationData(
                geohash7 = "u09tvqx",
                city = "Sofia",
                country = "BG",
                timezone = "Europe/Sofia",
                roundedLat = 42.7,
                roundedLng = 23.3
            )
        )
        val pet2 = createTestPet(
            location = LocationData(
                geohash7 = "u0j4hfx",
                city = "Plovdiv",
                country = "BG",
                timezone = "Europe/Sofia",
                roundedLat = 42.15,
                roundedLng = 24.75
            )
        )
        val prefs = OwnerPreferences(
            ownerId = "owner1",
            maxDistanceKm = 50.0,
            globalSearch = false
        )

        val result = engine.evaluateHardGates(pet1, pet2, prefs)

        assertFalse(result.passed)
        assertTrue(result.failureReasons.any { it.code == "DISTANCE_LIMIT" })
    }

    @Test
    fun `test hard gates - all passed`() {
        val pet1 = createTestPet()
        val pet2 = createTestPet()
        val prefs = createTestPreferences()

        val result = engine.evaluateHardGates(pet1, pet2, prefs)

        assertTrue(result.passed)
        assertTrue(result.failureReasons.isEmpty())
    }

    @Test
    fun `test match score - perfect match`() {
        val pet1 = createTestPet(
            temperament = TemperamentData(
                energyLevel = 4,
                friendliness = 5,
                playfulness = 4,
                calmness = 3,
                independence = 2
            ),
            size = PetSize.MEDIUM,
            lifeStage = LifeStage.ADULT
        )
        val pet2 = createTestPet(
            temperament = TemperamentData(
                energyLevel = 4,
                friendliness = 5,
                playfulness = 4,
                calmness = 3,
                independence = 2
            ),
            size = PetSize.MEDIUM,
            lifeStage = LifeStage.ADULT
        )
        val prefs = createTestPreferences()

        val score = engine.calculateMatchScore(pet1, pet2, prefs)

        assertTrue(score.totalScore >= 80)
        assertTrue(score.totalScore <= 100)
    }

    @Test
    fun `test match score - score in range`() {
        val pet1 = createTestPet()
        val pet2 = createTestPet()
        val prefs = createTestPreferences()

        val score = engine.calculateMatchScore(pet1, pet2, prefs)

        assertTrue(score.totalScore >= 0)
        assertTrue(score.totalScore <= 100)
    }

    @Test
    fun `test match score - factors normalized`() {
        val pet1 = createTestPet()
        val pet2 = createTestPet()
        val prefs = createTestPreferences()

        val score = engine.calculateMatchScore(pet1, pet2, prefs)

        assertTrue(score.factorScores.temperamentFit >= 0.0)
        assertTrue(score.factorScores.temperamentFit <= 1.0)
        assertTrue(score.factorScores.energyLevelFit >= 0.0)
        assertTrue(score.factorScores.energyLevelFit <= 1.0)
        assertTrue(score.factorScores.distanceFit >= 0.0)
        assertTrue(score.factorScores.distanceFit <= 1.0)
    }

    @Test
    fun `test matching weights - sum to 100`() {
        val weights = MatchingWeights()
        val total = weights.temperamentFit + weights.energyLevelFit + weights.lifeStageProximity +
                weights.sizeCompatibility + weights.breedFamilyCompatibility +
                weights.socializationCompatibility + weights.intentMatch +
                weights.distanceFit + weights.healthActivityBonus

        assertEquals(100.0, total, 0.01)
    }

    @Test
    fun `test matching weights - invalid sum throws`() {
        assertThrows<IllegalArgumentException> {
            MatchingWeights(
                temperamentFit = 50.0,
                energyLevelFit = 50.0,
                lifeStageProximity = 10.0,
                sizeCompatibility = 10.0,
                breedFamilyCompatibility = 15.0,
                socializationCompatibility = 10.0,
                intentMatch = 10.0,
                distanceFit = 10.0,
                healthActivityBonus = 5.0
            )
        }
    }

    private fun createTestPet(
        species: Species = Species.DOG,
        health: HealthData = HealthData(
            vaccinationsUpToDate = true,
            aggressionFlags = AggressionFlags(hasFlag = false)
        ),
        temperament: TemperamentData = TemperamentData(
            energyLevel = 3,
            friendliness = 4,
            playfulness = 3,
            calmness = 3,
            independence = 2
        ),
        socialization: SocializationData = SocializationData(
            comfortWithDogs = 4,
            comfortWithCats = 3,
            comfortWithKids = 4,
            comfortWithStrangers = 3
        ),
        size: PetSize = PetSize.MEDIUM,
        lifeStage: LifeStage = LifeStage.ADULT,
        location: LocationData = LocationData(
            geohash7 = "u09tvqx",
            city = "Sofia",
            country = "BG",
            timezone = "Europe/Sofia",
            roundedLat = 42.7,
            roundedLng = 23.3
        )
    ): Pet {
        return Pet(
            id = "pet1",
            ownerId = "owner1",
            species = species,
            breedCode = "dog_golden_retriever",
            name = "Test Pet",
            sex = Sex.MALE,
            neuterStatus = NeuterStatus.NEUTERED,
            ageMonths = 24,
            lifeStage = lifeStage,
            size = size,
            weightKg = 25.0,
            health = health,
            temperament = temperament,
            socialization = socialization,
            intents = listOf(Intent.PLAYDATE, Intent.COMPANIONSHIP),
            location = location,
            media = listOf(
                Photo(
                    id = "photo1",
                    url = "https://example.com/photo1.jpg",
                    moderationStatus = ModerationStatus.APPROVED,
                    uploadedAt = "2024-01-01T00:00:00Z"
                )
            ),
            createdAt = "2024-01-01T00:00:00Z",
            updatedAt = "2024-01-01T00:00:00Z"
        )
    }

    private fun createTestPreferences(): OwnerPreferences {
        return OwnerPreferences(
            ownerId = "owner1",
            maxDistanceKm = 50.0,
            globalSearch = false
        )
    }
}

