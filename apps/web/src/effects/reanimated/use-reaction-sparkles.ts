'use client';

import {
  useMotionValue,
  animate,
  type MotionValue,
} from 'framer-motion';
import { useCallback, useState, useEffect } from 'react';
import { haptics } from '@/lib/haptics';
import { springConfigs, timingConfigs } from '@/effects/reanimated/transitions';
import {
  spawnParticlesData,
  type ParticleData,
  type ParticleConfig,
} from './particle-engine';
import { useMotionStyle } from './use-motion-style';
import type { CSSProperties } from 'react';

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
  animatedStyle: CSSProperties;
  pulseStyle: CSSProperties;
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

  const animate = useCallback(
    (emoji: ReactionType, x?: number, y?: number) => {
      if (hapticFeedback) {
        haptics.impact('medium');
      }

      // Animate scale sequence
      void animate(emojiScale, 1.2, {
        type: 'spring',
        damping: 10,
        stiffness: 400,
      }).then(() => {
        void animate(emojiScale, 1, {
          ...springConfigs.bouncy,
        });
      });

      // Animate opacity sequence
      void animate(emojiOpacity, 1, {
        duration: timingConfigs.fast.duration,
        ease: timingConfigs.fast.ease as string,
      }).then(() => {
        setTimeout(() => {
          void animate(emojiOpacity, 0, {
            duration: timingConfigs.smooth.duration,
            ease: timingConfigs.smooth.ease as string,
          });
        }, 400);
      });

      if (enableParticles && x !== undefined && y !== undefined) {
        const config = getParticleConfig(emoji);
        const newParticles = spawnParticlesData(x, y, config);

        setParticles((prev) => [...prev, ...newParticles]);

        // Clean up particles after their lifetime
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
    void animate(pulseScale, [1, 1.1, 1], {
      duration: 0.8, // 400ms * 2 = 800ms
      ease: 'linear',
      repeat: Infinity,
      times: [0, 0.5, 1],
    });
  }, [enablePulse, isPulsing, pulseScale]);

  const stopPulse = useCallback(() => {
    setIsPulsing(false);
    void animate(pulseScale, 1, {
      duration: timingConfigs.fast.duration,
      ease: timingConfigs.fast.ease as string,
    });
  }, [pulseScale]);

  const clearParticles = useCallback(() => {
    setParticles([]);
  }, []);

  useEffect(() => {
    return () => {
      clearParticles();
    };
  }, [clearParticles]);

  const animatedStyle = useMotionStyle(() => {
    return {
      transform: [{ scale: emojiScale.get() }],
      opacity: emojiOpacity.get(),
    };
  });

  const pulseStyle = useMotionStyle(() => {
    return {
      transform: [{ scale: pulseScale.get() }],
    };
  });

  return {
    emojiScale,
    emojiOpacity,
    pulseScale,
    animatedStyle,
    pulseStyle,
    particles,
    animate,
    startPulse,
    stopPulse,
    clearParticles,
  };
}
