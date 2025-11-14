'use client';

import { useCallback, useState, useEffect } from 'react';

import { useMotionValue, animate, MotionValue } from 'framer-motion';
import { spawnParticlesData } from './particle-engine';
import type { ParticleData, ParticleConfig } from './particle-engine';
import { springConfigs, timingConfigs } from './transitions';
import { haptics } from '@/lib/haptics';

export type ReactionType = '❤️' | '😂' | '👍' | '👎' | '🔥' | '🙏' | '⭐';


export interface UseReactionSparklesOptions {
  onReaction?: (emoji: ReactionType) => void;
  hapticFeedback?: boolean;
  enableParticles?: boolean;
  enablePulse?: boolean;
}

export interface UseReactionSparklesReturn {
  emojiScale: MotionValue<number>;
  emojiOpacity: MotionValue<number>;
  pulseScale: MotionValue<number>;
  animatedStyle: {
    transform: Array<{ scale: MotionValue<number> }>;
    opacity: MotionValue<number>;
  };
  pulseStyle: {
    transform: Array<{ scale: MotionValue<number> }>;
  };
  particles: ParticleData[];
  animate: (emoji: ReactionType, x?: number, y?: number) => void;
  startPulse: () => void;
  stopPulse: () => void;
  clearParticles: () => void;
}



const EMOJI_COLORS: Record<ReactionType, string[]> = {
  '❤️': ['#FF6B6B', '#FF8E8E', '#FFB3B3'],
  '😂': ['#FFD93D', '#FFE66D', '#FFF4A3'],
  '👍': ['#4ECDC4', '#6EDDD4', '#8EEDE4'],
  '👎': ['#95A5A6', '#BDC3C7', '#D5DBDB'],
  '🔥': ['#FF6B35', '#FF8C42', '#FFA07A'],
  '🙏': ['#A8D8EA', '#C8E6F5', '#E8F4F8'],
  '⭐': ['#FFD700', '#FFE55C', '#FFF4A3'],
};

const DEFAULT_HAPTIC_FEEDBACK = true;
const DEFAULT_ENABLE_PARTICLES = true;
const DEFAULT_ENABLE_PULSE = true;

export function useReactionSparkles(
  options: UseReactionSparklesOptions = {}
): UseReactionSparklesReturn {

  const {
    onReaction,
    hapticFeedback = DEFAULT_HAPTIC_FEEDBACK,
    enableParticles = DEFAULT_ENABLE_PARTICLES,
    enablePulse = DEFAULT_ENABLE_PULSE,
  } = options;

  const emojiScale = useMotionValue(0);
  const emojiOpacity = useMotionValue(0);
  const pulseScale = useMotionValue(1);
  const [particles, setParticles] = useState<ParticleData[]>([]);
  const [isPulsing, setIsPulsing] = useState(false);

  const getParticleConfig = useCallback((emoji: ReactionType): ParticleConfig => {
    return {
      count: 10,
      colors: EMOJI_COLORS[emoji] ?? EMOJI_COLORS['❤️'],
      minSize: 4,
      maxSize: 10,
      minLifetime: 500,
      maxLifetime: 800,
      minVelocity: 100,
      maxVelocity: 250,
      gravity: 0.4,
      spread: 360,
    };
  }, []);

  const triggerAnimation = useCallback(
    async (emoji: ReactionType, x?: number, y?: number) => {
      if (hapticFeedback) {
        haptics.impact('medium');
      }

      await animate(emojiScale, 1.2, { type: 'spring', damping: 10, stiffness: 400 });
      await animate(emojiScale, 1, { type: 'spring', ...springConfigs.bouncy });

      animate(emojiOpacity, 1, { duration: (timingConfigs.fast.duration ?? 150) / 1000 });
      setTimeout(() => {
        animate(emojiOpacity, 0, { duration: (timingConfigs.smooth.duration ?? 300) / 1000 });
      }, 400);

      if (enableParticles && x !== undefined && y !== undefined) {
        const config = getParticleConfig(emoji);
        const newParticles = spawnParticlesData(x, y, config);
        setParticles((prev) => [...prev, ...newParticles]);
        const maxLifetime = config.maxLifetime ?? 1000;
        setTimeout(() => {
          setParticles((prev) => {
            const now = Date.now();
            return prev.filter((p) => now - p.createdAt < maxLifetime);
          });
        }, maxLifetime);
      }

      if (onReaction) {
        onReaction(emoji);
      }
    },
    [hapticFeedback, enableParticles, getParticleConfig, onReaction, emojiScale, emojiOpacity]
  );

  const startPulse = useCallback(() => {
    if (!enablePulse || isPulsing) {
      return;
    }
    setIsPulsing(true);
    let running = true;
    function pulseLoop() {
      if (!running) return;
      animate(pulseScale, 1.1, { duration: 0.4, ease: 'linear' }).then(() => {
        animate(pulseScale, 1, { duration: 0.4, ease: 'linear' }).then(() => {
          if (running && isPulsing) pulseLoop();
        });
      });
    }
    pulseLoop();
    // Store running flag for cleanup if needed
    // Not strictly necessary in this closure, but safe for future
  }, [enablePulse, isPulsing, pulseScale]);

  const stopPulse = useCallback(() => {
    setIsPulsing(false);
    animate(pulseScale, 1, { duration: (timingConfigs.fast.duration ?? 150) / 1000 });
  }, [pulseScale]);

  const clearParticles = useCallback(() => {
    setParticles([]);
  }, []);

  useEffect(() => {
    return () => {
      clearParticles();
    };
  }, [clearParticles]);

  const animatedStyle = {
    transform: [{ scale: emojiScale }],
    opacity: emojiOpacity,
  };

  const pulseStyle = {
    transform: [{ scale: pulseScale }],
  };

  return {
    emojiScale,
    emojiOpacity,
    pulseScale,
    animatedStyle,
    pulseStyle,
    particles,
  animate: triggerAnimation,
    startPulse,
    stopPulse,
    clearParticles,
  };
}
