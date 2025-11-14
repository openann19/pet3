/**
 * Confetti Burst Animation
 * Celebratory confetti explosion with physics
 * Migrated to pure Framer Motion
 */

import { motionValue, animate, type MotionValue } from 'framer-motion';
import { useCallback, useState } from 'react';
import { makeRng } from '@petspark/shared';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export interface ConfettiParticle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  rotation: number;
  velocity: { x: number; y: number };
  // Motion values for each particle
  translateX: MotionValue<number>;
  translateY: MotionValue<number>;
  rotate: MotionValue<number>;
  scale: MotionValue<number>;
  opacity: MotionValue<number>;
}

export interface UseConfettiBurstOptions {
  particleCount?: number;
  colors?: string[];
  duration?: number;
  spread?: number;
}

export interface UseConfettiBurstReturn {
  burst: (centerX?: number, centerY?: number) => void;
  particles: ConfettiParticle[];
  isAnimating: boolean;
}

export function useConfettiBurst(options: UseConfettiBurstOptions = {}): UseConfettiBurstReturn {
  const {
    particleCount = 30,
    colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f7dc6f', '#bb8fce'],
    duration = 2000,
    spread = 200,
  } = options;

  const prefersReducedMotion = useReducedMotion();
  const [particles, setParticles] = useState<ConfettiParticle[]>([]);

  const burst = useCallback(
    (centerX?: number, centerY?: number) => {
      if (typeof window === 'undefined') return;

      const cx = centerX ?? window.innerWidth / 2;
      const cy = centerY ?? window.innerHeight / 2;

      if (prefersReducedMotion) {
        return;
      }

      const newParticles: ConfettiParticle[] = [];

      // Create seeded RNG for deterministic confetti generation
      const seed = Date.now() + cx + cy;
      const rng = makeRng(seed);

      for (let i = 0; i < particleCount; i++) {
        const angle = (Math.PI * 2 * i) / particleCount;
        const velocity = rng() * spread + spread * 0.5;
        const color = colors[Math.floor(rng() * colors.length)] ?? colors[0] ?? '#ff6b6b';

        // Create motion values directly (not hooks) for dynamic particles
        // motionValue() is the imperative API for creating motion values outside React's render cycle
        const translateX = motionValue(0);
        const translateY = motionValue(0);
        const rotate = motionValue(0);
        const scale = motionValue(0);
        const opacity = motionValue(1);

        const particle: ConfettiParticle = {
          id: Date.now() + i,
          x: cx,
          y: cy,
          color,
          size: rng() * 8 + 4,
          rotation: rng() * 360,
          velocity: {
            x: Math.cos(angle) * velocity,
            y: Math.sin(angle) * velocity - 100,
          },
          translateX,
          translateY,
          rotate,
          scale,
          opacity,
        };

        // Animate particle motion values
        const durationSeconds = duration / 1000;

        // Animate translateX (relative to starting position)
        animate(translateX, particle.velocity.x, {
          duration: durationSeconds,
          ease: [0.25, 0.46, 0.45, 0.94], // ease-out-quad
        });

        // Animate translateY with gravity
        const finalY = particle.velocity.y + 300; // gravity effect
        animate(translateY, finalY, {
          duration: durationSeconds,
          ease: [0.25, 0.46, 0.45, 0.94],
        });

        // Animate rotation
        animate(rotate, particle.rotation + 720, {
          duration: durationSeconds,
          ease: 'linear',
        });

        // Animate scale: 0 -> 1 -> 0.8
        animate(scale, [0, 1, 0.8], {
          duration: durationSeconds,
          times: [0, 0.2, 1],
          ease: [0.25, 0.46, 0.45, 0.94],
        });

        // Animate opacity: 1 -> 1 -> 0
        animate(opacity, [1, 1, 0], {
          duration: durationSeconds,
          times: [0, 0.7, 1],
          ease: [0.25, 0.46, 0.45, 0.94],
        });

        newParticles.push(particle);
      }

      setParticles(newParticles);

      // Clear particles after animation
      setTimeout(() => {
        setParticles([]);
      }, duration);
    },
    [particleCount, colors, duration, spread, prefersReducedMotion]
  );

  return {
    burst,
    particles,
    isAnimating: particles.length > 0,
  };
}
