package com.pawfectmatch.domain

import kotlinx.serialization.Serializable

@Serializable
enum class Species(val en: String, val bg: String) {
    DOG("Dog", "Куче"),
    CAT("Cat", "Котка");

    companion object {
        fun fromString(value: String): Species? = entries.find { it.name.equals(value, ignoreCase = true) }
    }
}

@Serializable
enum class LifeStage(val en: String, val bg: String, val minMonths: Int, val maxMonths: Int?) {
    PUPPY("Puppy", "Кученце", 0, 12),
    KITTEN("Kitten", "Котенце", 0, 12),
    YOUNG("Young", "Млад", 12, 24),
    ADULT("Adult", "Възрастен", 24, null),
    SENIOR("Senior", "Възрастен", -1, -1); // Special handling

    companion object {
        fun forDogs(ageMonths: Int): LifeStage = when {
            ageMonths < 12 -> PUPPY
            ageMonths < 24 -> YOUNG
            ageMonths < 84 -> ADULT
            else -> SENIOR
        }

        fun forCats(ageMonths: Int): LifeStage = when {
            ageMonths < 12 -> KITTEN
            ageMonths < 24 -> YOUNG
            ageMonths < 120 -> ADULT
            else -> SENIOR
        }
    }
}

@Serializable
enum class PetSize(val en: String, val bg: String) {
    // Dogs
    TOY("Toy", "Играчка"),
    SMALL("Small", "Малко"),
    MEDIUM("Medium", "Средно"),
    LARGE("Large", "Голямо"),
    GIANT("Giant", "Гигантско"),
    // Cats
    SMALL_CAT("Small", "Малка"),
    MEDIUM_CAT("Medium", "Средна"),
    LARGE_CAT("Large", "Голяма");

    companion object {
        fun forDogs(weightKg: Double?): PetSize = when {
            weightKg == null -> MEDIUM
            weightKg < 5.0 -> TOY
            weightKg < 11.0 -> SMALL
            weightKg < 27.0 -> MEDIUM
            weightKg < 45.0 -> LARGE
            else -> GIANT
        }

        fun forCats(weightKg: Double?): PetSize = when {
            weightKg == null -> MEDIUM_CAT
            weightKg < 4.0 -> SMALL_CAT
            weightKg < 7.0 -> MEDIUM_CAT
            else -> LARGE_CAT
        }

        fun normalize(size: PetSize, species: Species): PetSize = when (species) {
            Species.DOG -> when (size) {
                SMALL_CAT, MEDIUM_CAT, LARGE_CAT -> MEDIUM
                else -> size
            }
            Species.CAT -> when (size) {
                TOY, SMALL, MEDIUM, LARGE, GIANT -> MEDIUM_CAT
                else -> size
            }
        }
    }
}

@Serializable
enum class Sex(val en: String, val bg: String) {
    MALE("Male", "Мъжко"),
    FEMALE("Female", "Женско");
}

@Serializable
enum class NeuterStatus(val en: String, val bg: String) {
    INTACT("Intact", "Некastreиран"),
    NEUTERED("Neutered", "Кастриран"),
    UNKNOWN("Unknown", "Неизвестно");
}

@Serializable
enum class Intent(val en: String, val bg: String) {
    PLAYDATE("Playdate", "Игрище"),
    COMPANIONSHIP("Companionship", "Дружба"),
    ADOPTION("Adoption", "Осиновяване"),
    BREEDING("Breeding", "Развъждане");
}

@Serializable
enum class ModerationStatus(val en: String, val bg: String) {
    PENDING("Pending", "Изчакващ"),
    APPROVED("Approved", "Одобрен"),
    HELD_FOR_KYC("Held for KYC", "Задържан за KYC"),
    REJECTED("Rejected", "Отхвърлен");
}

