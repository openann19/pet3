import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

/**
 * Seeded Random Number Generator
 * Xorshift32 algorithm for deterministic random number generation.
 */
function makeRng(seed: number): () => number {
  let s = seed >>> 0
  return (): number => {
    s ^= s << 13
    s ^= s >>> 17
    s ^= s << 5
    return (s >>> 0) / 4294967296
  }
}

interface Particle {
  id: number
  x: number
  y: number
  size: number
  color: string
  duration: number
  delay: number
}

interface ParticleEffectProps {
  count?: number
  colors?: string[]
  triggerKey?: number
}

export function ParticleEffect({ 
  count = 20, 
  colors = ['#F97316', '#F59E0B', '#EF4444', '#EC4899', '#A855F7'],
  triggerKey = 0
}: ParticleEffectProps) {
  const [particles, setParticles] = useState<Particle[]>([])

  useEffect(() => {
    if (triggerKey === 0) return

    const seed = triggerKey * 1000 + Date.now()
    const rng = makeRng(seed)

    const newParticles: Particle[] = Array.from({ length: count }, (_, i) => {
      const colorIndex = Math.floor(rng() * colors.length)
      const selectedColor = colors[colorIndex]
      return {
        id: i + triggerKey * 1000,
        x: rng() * 100 - 50,
        y: rng() * -100 - 50,
        size: rng() * 12 + 4,
        color: selectedColor ?? '#F97316',
        duration: rng() * 1.5 + 1,
        delay: rng() * 0.3
      }
    })

    setParticles(newParticles)

    const timeout = setTimeout(() => {
      setParticles([])
    }, 2500)

    return () => clearTimeout(timeout)
  }, [triggerKey, count, colors])

  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center overflow-hidden">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
          }}
          initial={{ 
            x: 0, 
            y: 0, 
            opacity: 0, 
            scale: 0 
          }}
          animate={{
            x: particle.x,
            y: particle.y,
            opacity: [0, 1, 1, 0],
            scale: [0, 1, 1, 0]
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            ease: [0.34, 1.56, 0.64, 1]
          }}
        />
      ))}
    </div>
  )
}
