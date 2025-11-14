'use client';

import { motionValue, animate, type MotionValue } from 'framer-motion';
import { useCallback, useState, useEffect } from 'react';
import { makeRng } from '@petspark/shared';

export interface ReactionTrailParticle {
  id: string;
  x: MotionValue<number>;
  y: MotionValue<number>;
  scale: MotionValue<number>;
  opacity: MotionValue<number>;
  rotation: MotionValue<number>;
  emoji: string;
  createdAt: number;
}

export interface UseReactionTrailOptions {
  enabled?: boolean;
  trailLength?: number;
  duration?: number;
  emoji?: string;
}

export interface UseReactionTrailReturn {
  particles: ReactionTrailParticle[];
  triggerTrail: (fromX: number, fromY: number, toX: number, toY: number, emoji?: string) => void;
  clearTrail: () => void;
  getParticleStyle: (particle: ReactionTrailParticle) => {
    position: 'absolute';
    left: MotionValue<number>;
    top: MotionValue<number>;
    scale: MotionValue<number>;
    rotate: MotionValue<number>;
    opacity: MotionValue<number>;
    pointerEvents: 'none';
    zIndex: number;
  };
}

const DEFAULT_ENABLED = true;
const DEFAULT_TRAIL_LENGTH = 5;
const DEFAULT_DURATION = 1000;
const DEFAULT_EMOJI = '❤️';

export function useReactionTrail(options: UseReactionTrailOptions = {}): UseReactionTrailReturn {
  const {
    enabled = DEFAULT_ENABLED,
    trailLength = DEFAULT_TRAIL_LENGTH,
    duration = DEFAULT_DURATION,
    emoji = DEFAULT_EMOJI,
  } = options;

  const [particles, setParticles] = useState<ReactionTrailParticle[]>([]);

  const triggerTrail = useCallback(
    (fromX: number, fromY: number, toX: number, toY: number, trailEmoji?: string) => {
      if (!enabled) return;

      const particlesToCreate: ReactionTrailParticle[] = [];
      const emojiToUse = trailEmoji ?? emoji;

      // Create seeded RNG for deterministic particle generation
      const seed = Date.now() + fromX + fromY + toX + toY;
      const rng = makeRng(seed);

      for (let i = 0; i < trailLength; i++) {
        const progress = i / (trailLength - 1);
        const x = fromX + (toX - fromX) * progress;
        const y = fromY + (toY - fromY) * progress;
        const offsetX = (rng() - 0.5) * 30;
        const offsetY = (rng() - 0.5) * 30;

        const particle: ReactionTrailParticle = {
          id: `${String(Date.now() ?? '')}-${String(i ?? '')}-${String(rng() ?? '')}`,
          x: motionValue(x + offsetX),
          y: motionValue(y + offsetY),
          scale: motionValue(0),
          opacity: motionValue(0),
          rotation: motionValue(0),
          emoji: emojiToUse,
          createdAt: Date.now(),
        };

        const delay = (progress * (duration * 0.3)) / 1000;
        const particleDuration = (duration * 0.7) / 1000;

        animate(particle.scale, [0, 1.2, 0.8, 0], {
          delay,
          duration: particleDuration,
          ease: 'easeInOut',
          times: [0, 0.2, 0.8, 1],
        });

        animate(particle.opacity, [0, 1, 0.9, 0], {
          delay,
          duration: particleDuration,
          ease: 'easeInOut',
          times: [0, 0.1, 0.9, 1],
        });

        animate(particle.rotation, rng() * 360, {
          delay,
          duration: particleDuration,
          ease: 'linear',
        });

        const finalX = toX + (rng() - 0.5) * 20;
        const finalY = toY + (rng() - 0.5) * 20;

        animate(particle.x, finalX, {
          delay,
          duration: particleDuration,
          ease: [0.25, 0.1, 0.25, 1],
        });

        animate(particle.y, finalY, {
          delay,
          duration: particleDuration,
          ease: [0.25, 0.1, 0.25, 1],
        });

        particlesToCreate.push(particle);
      }

      setParticles((prev) => [...prev, ...particlesToCreate]);

      setTimeout(() => {
        setParticles((prev: ReactionTrailParticle[]) =>
          prev.filter((p: ReactionTrailParticle) => Date.now() - p.createdAt < duration + 200)
        );
      }, duration + 300);
    },
    [enabled, trailLength, duration, emoji]
  );

  const clearTrail = useCallback(() => {
    setParticles([]);
  }, []);

  const getParticleStyle = useCallback(
    (particle: ReactionTrailParticle) => {
      return {
        position: 'absolute' as const,
        left: particle.x,
        top: particle.y,
        scale: particle.scale,
        rotate: particle.rotation,
        opacity: particle.opacity,
        pointerEvents: 'none' as const,
        zIndex: 9999,
      };
    },
    []
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setParticles((prev: ReactionTrailParticle[]) =>
        prev.filter((p: ReactionTrailParticle) => Date.now() - p.createdAt < duration + 200)
      );
    }, 100);

    return () => clearInterval(interval);
  }, [duration]);

  return {
    particles,
    triggerTrail,
    clearTrail,
    getParticleStyle,
  };
}
