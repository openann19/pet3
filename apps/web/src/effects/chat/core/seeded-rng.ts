/**
 * Seeded RNG for deterministic particle effects
 * 
 * Ensures consistent visual output across renders when seed is set
 */

let seed = Date.now()

export function setSeed(newSeed: number): void {
  seed = newSeed
}

export function getSeed(): number {
  return seed
}

export function random(): number {
  seed = (seed * 9301 + 49297) % 233280
  return seed / 233280
}

export function randomInt(min: number, max: number): number {
  return Math.floor(random() * (max - min + 1)) + min
}

export function randomFloat(min: number, max: number): number {
  return random() * (max - min) + min
}

export function randomChoice<T>(array: T[]): T {
  return array[randomInt(0, array.length - 1)]
}

export function randomGaussian(mean: number, stdDev: number): number {
  let u = 0
  let v = 0
  while (u === 0) u = random()
  while (v === 0) v = random()
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)
  return z * stdDev + mean
}
