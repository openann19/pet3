/**
 * Matching API with strict optional handling
 * 
 * This is an example of how to use OptionalWithUndef<T> in API layer
 * for update/patch operations where undefined explicitly means "clear this field".
 * 
 * @example
 * ```ts
 * // Clear a field explicitly
 * await api.updatePreferences({ maxDistanceKm: undefined, ownerId: 'user123' })
 * 
 * // Omit a field (don't change it)
 * await api.updatePreferences({ maxDistanceKm: 100, ownerId: 'user123' })
 * ```
 */

import type { UpdateOwnerPreferencesData, UpdateMatchingConfigData } from '@/api/types'
import type { OwnerPreferences } from '@/core/domain/pet-model'
import type { MatchingConfig } from '@/core/domain/matching-config'
import { DEFAULT_MATCHING_WEIGHTS, DEFAULT_HARD_GATES } from '@/core/domain/matching-config'

/**
 * Matching API with strict optional semantics
 * 
 * Uses OptionalWithUndef<T> to distinguish between:
 * - Omitted property: field is not updated
 * - Undefined value: field is explicitly cleared
 */
export class MatchingAPIStrict {
  private configCache: MatchingConfig | null = null

  /**
   * Update owner preferences with strict optional handling
   * 
   * @param ownerId - Owner ID
   * @param data - Update data (undefined values explicitly clear fields)
   */
  async updatePreferences(
    ownerId: string,
    data: UpdateOwnerPreferencesData
  ): Promise<OwnerPreferences> {
    const existing = await this.getPreferences(ownerId)

    // Update fields - undefined explicitly means "clear this field"
    const updated: OwnerPreferences = {
      ...existing,
      maxDistanceKm: data.maxDistanceKm !== undefined ? (data.maxDistanceKm ?? existing.maxDistanceKm) : existing.maxDistanceKm,
      speciesAllowed: data.speciesAllowed !== undefined ? (data.speciesAllowed ?? existing.speciesAllowed) : existing.speciesAllowed,
      allowCrossSpecies: data.allowCrossSpecies !== undefined ? (data.allowCrossSpecies ?? existing.allowCrossSpecies) : existing.allowCrossSpecies,
      sizesCompatible: data.sizesCompatible !== undefined ? (data.sizesCompatible ?? existing.sizesCompatible) : existing.sizesCompatible,
      intentsAllowed: data.intentsAllowed !== undefined ? (data.intentsAllowed ?? existing.intentsAllowed) : existing.intentsAllowed,
      requireVaccinations: data.requireVaccinations !== undefined ? (data.requireVaccinations ?? existing.requireVaccinations) : existing.requireVaccinations,
      globalSearch: data.globalSearch !== undefined ? (data.globalSearch ?? existing.globalSearch) : existing.globalSearch,
      updatedAt: new Date().toISOString()
    }

    await window.spark.kv.set(`prefs:${ownerId}`, updated)
    return updated
  }

  /**
   * Update matching configuration with strict optional handling
   * 
   * @param data - Update data (undefined values explicitly clear fields)
   */
  async updateConfig(
    data: UpdateMatchingConfigData
  ): Promise<MatchingConfig> {
    const existing = await this.getConfig()

    // Update fields - undefined explicitly means "clear this field"
    const updated: MatchingConfig = {
      ...existing,
      weights: data.weights !== undefined ? (data.weights ?? existing.weights) : existing.weights,
      hardGates: data.hardGates !== undefined ? (data.hardGates ?? existing.hardGates) : existing.hardGates,
      featureFlags: data.featureFlags !== undefined ? (data.featureFlags ?? existing.featureFlags) : existing.featureFlags,
      updatedAt: new Date().toISOString(),
      updatedBy: existing.updatedBy
    }

    await window.spark.kv.set('matching-config', updated)
    this.configCache = updated
    return updated
  }

  private async getPreferences(ownerId: string): Promise<OwnerPreferences> {
    const stored = await window.spark.kv.get<OwnerPreferences>(`prefs:${ownerId}`)
    if (stored) return stored

    const defaultPrefs: OwnerPreferences = {
      ownerId,
      maxDistanceKm: 50,
      speciesAllowed: ['dog', 'cat'],
      allowCrossSpecies: false,
      sizesCompatible: [],
      intentsAllowed: ['playdate', 'companionship'],
      requireVaccinations: true,
      globalSearch: false,
      updatedAt: new Date().toISOString()
    }

    await window.spark.kv.set(`prefs:${ownerId}`, defaultPrefs)
    return defaultPrefs
  }

  private async getConfig(): Promise<MatchingConfig> {
    if (this.configCache) return this.configCache

    const stored = await window.spark.kv.get<MatchingConfig>('matching-config')
    if (stored) {
      this.configCache = stored
      return stored
    }

    const defaultConfig: MatchingConfig = {
      id: 'default',
      weights: DEFAULT_MATCHING_WEIGHTS,
      hardGates: DEFAULT_HARD_GATES,
      featureFlags: {
        MATCH_ALLOW_CROSS_SPECIES: false,
        MATCH_REQUIRE_VACCINATION: true,
        MATCH_DISTANCE_MAX_KM: 50,
        MATCH_AB_TEST_KEYS: [],
        MATCH_AI_HINTS_ENABLED: true
      },
      updatedAt: new Date().toISOString(),
      updatedBy: 'system'
    }

    await window.spark.kv.set('matching-config', defaultConfig)
    this.configCache = defaultConfig
    return defaultConfig
  }
}

