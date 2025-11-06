import { describe, it, expect } from 'vitest'
import { setSeed, random, randomInt } from './seeded-rng'

describe('Seeded RNG', () => {
  it('is deterministic per seed', () => {
    setSeed(123)
    const a = [random(), random(), randomInt(0, 10)]

    setSeed(123)
    const b = [random(), random(), randomInt(0, 10)]

    expect(a).toEqual(b)
  })

  it('produces different sequences for different seeds', () => {
    setSeed(123)
    const a = [random(), random(), random()]

    setSeed(456)
    const b = [random(), random(), random()]

    expect(a).not.toEqual(b)
  })

  it('generates integers in correct range', () => {
    setSeed(789)
    for (let i = 0; i < 100; i++) {
      const val = randomInt(5, 10)
      expect(val).toBeGreaterThanOrEqual(5)
      expect(val).toBeLessThanOrEqual(10)
    }
  })

  it('generates floats in correct range', () => {
    setSeed(999)
    for (let i = 0; i < 100; i++) {
      const val = random()
      expect(val).toBeGreaterThanOrEqual(0)
      expect(val).toBeLessThan(1)
    }
  })
})

