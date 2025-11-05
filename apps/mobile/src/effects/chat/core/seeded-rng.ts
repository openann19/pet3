/**
 * Seeded Random Number Generator
 * 
 * Provides deterministic random number generation for effects.
 * Replaces Math.random() to ensure reproducible, testable behavior.
 * 
 * Location: apps/mobile/src/effects/chat/core/seeded-rng.ts
 */

/**
 * Simple seeded RNG using Linear Congruential Generator (LCG)
 * Formula: (a * seed + c) % m
 * Using constants from Numerical Recipes
 */
class SeededRNG {
  private seed: number

  constructor(seed: number = Date.now()) {
    this.seed = seed
  }

  /**
   * Generate next random number in range [0, 1)
   */
  next(): number {
    // LCG constants (Numerical Recipes)
    const a = 1664525
    const c = 1013904223
    const m = 2 ** 32
    this.seed = (a * this.seed + c) % m
    return this.seed / m
  }

  /**
   * Generate random number in range [min, max)
   */
  range(min: number, max: number): number {
    return min + this.next() * (max - min)
  }

  /**
   * Generate random integer in range [min, max)
   */
  rangeInt(min: number, max: number): number {
    return Math.floor(this.range(min, max))
  }

  /**
   * Set seed for deterministic behavior
   */
  setSeed(seed: number): void {
    this.seed = seed
  }

  /**
   * Get current seed
   */
  getSeed(): number {
    return this.seed
  }
}

// Global instance seeded with timestamp
let globalRNG: SeededRNG | null = null

/**
 * Get or create global RNG instance
 */
function getGlobalRNG(): SeededRNG {
  if (!globalRNG) {
    globalRNG = new SeededRNG(Date.now())
  }
  return globalRNG
}

/**
 * Generate random number in range [0, 1)
 * Replacement for Math.random()
 */
export function random(): number {
  return getGlobalRNG().next()
}

/**
 * Generate random number in range [min, max)
 */
export function randomRange(min: number, max: number): number {
  return getGlobalRNG().range(min, max)
}

/**
 * Generate random integer in range [min, max)
 */
export function randomInt(min: number, max: number): number {
  return getGlobalRNG().rangeInt(min, max)
}

/**
 * Create a new seeded RNG instance
 */
export function createSeededRNG(seed?: number): SeededRNG {
  return new SeededRNG(seed)
}

/**
 * Set seed for global RNG (useful for testing)
 */
export function setSeed(seed: number): void {
  getGlobalRNG().setSeed(seed)
}

