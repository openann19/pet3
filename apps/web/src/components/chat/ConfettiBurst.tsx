/**
import { motion } from 'framer-motion';
 * Confetti Burst — Web (Reanimated v3)
 * - Physics-like: upward impulse + gravity + lateral drift + spin
 * - Deterministic seeding, reduced motion fast fallback
 *
 * Location: apps/web/src/components/chat/ConfettiBurst.tsx
 */

import { useEffect, useMemo, useState, memo } from 'react';
import { motion, useMotionValue, animate, type MotionValue } from 'framer-motion';
import { useReducedMotion, getReducedMotionDuration } from '@/effects/chat/core/reduced-motion';
import { createSeededRNG } from '@/effects/chat/core/seeded-rng';
import { useUIConfig } from "@/hooks/use-ui-config";

export interface ConfettiParticle {
  x: MotionValue<number>;
  y: MotionValue<number>;
  r: MotionValue<number>;
  s: MotionValue<number>;
  o: MotionValue<number>;
  color: string;
  w: number;
  h: number;
  delay: number;
  vx: number;
  vy: number;
}

export interface ConfettiBurstProps {
  enabled?: boolean;
  particleCount?: number;
  colors?: string[];
  duration?: number;
  onComplete?: () => void;
  className?: string;
  seed?: number | string;
}

export function ConfettiBurst({
  enabled = true,
  particleCount = 120,
  colors = ['var(--color-accent-9)', 'var(--color-accent-secondary-9)', 'var(--color-accent-10)', 'var(--color-accent-11)', 'var(--color-accent-8)'],
  duration = 1400,
  onComplete,
  className,
  seed = 'confetti-burst',
}: ConfettiBurstProps) {
  const _uiConfig = useUIConfig();
  const reduced = useReducedMotion();
  const dur = getReducedMotionDuration(duration, reduced);
  const [finishedCount, setFinishedCount] = useState(0);

  const particles = useMemo<ConfettiParticle[]>(() => {
    const rng = createSeededRNG(seed);
    return Array.from({ length: particleCount }, (_, i) => {
      const x = useMotionValue(0);
      const y = useMotionValue(0);
      const r = useMotionValue(0);
      const s = useMotionValue(rng.range(0.85, 1.25));
      const o = useMotionValue(0);
      const color = colors[i % colors.length] ?? colors[0] ?? 'var(--color-accent-9)';
      const w = rng.rangeInt(6, 12);
      const h = rng.rangeInt(6, 12);
      const delay = i * (reduced ? 0 : 5);
      const vx = Math.cos(rng.range(0, Math.PI * 2)) * 40;
      const vy = -120 - rng.range(0, 80);
      return { x, y, r, s, o, color, w, h, delay, vx, vy };
    });
  }, [particleCount, colors, seed, reduced]);

  useEffect(() => {
    if (!enabled) return;
    setFinishedCount(0);

    particles.forEach((p, index) => {
      if (reduced) {
        p.o.set(1);
        p.s.set(1);
        setTimeout(() => {
          void animate(p.y, 40, {
            duration: getReducedMotionDuration(120, true) / 1000,
            ease: [0.2, 0, 0, 1],
          }).then(() => {
            void animate(p.o, 0, {
              duration: 0.12,
              ease: [0.2, 0, 0, 1],
            }).then(() => {
              setFinishedCount((prev) => {
                const next = prev + 1;
                if (next === particles.length && onComplete) {
                  onComplete();
                }
                return next;
              });
            });
          });
        }, p.delay);
        return;
      }

      setTimeout(() => {
        void animate(p.o, 1, {
          duration: 0.08,
          ease: [0.2, 0, 0, 1],
        });
        
        void animate(p.x, p.vx, {
          duration: dur / 1000,
          ease: [0.33, 1, 0.68, 1],
        });
        
        void animate(p.y, p.vy, {
          duration: (dur * 0.35) / 1000,
          ease: [0.25, 0.46, 0.45, 0.94],
        }).then(() => {
          void animate(p.y, 160, {
            duration: (dur * 0.65) / 1000,
            ease: [0.55, 0.06, 0.68, 0.19],
          }).then(() => {
            void animate(p.o, 0, {
              duration: Math.max(0.14, (dur * 0.25) / 1000),
              ease: [0.2, 0, 0, 1],
            }).then(() => {
              setFinishedCount((prev) => {
                const next = prev + 1;
                if (next === particles.length && onComplete) {
                  onComplete();
                }
                return next;
              });
            });
          });
        });
        
        void animate(p.r, 360, {
          duration: Math.max(0.6, (dur * 0.6) / 1000),
          ease: 'linear',
          repeat: Infinity,
        });
      }, p.delay);
    });
  }, [enabled, particles, dur, reduced, onComplete]);

  return (
    <div className={`fixed inset-0 z-50 pointer-events-none ${className ?? ''}`}>
      {particles.map((p, i) => (
        <ConfettiParticleView key={i} particle={p} />
      ))}
    </div>
  );
}

/**
 * ConfettiParticleView component that renders a single confetti particle with animated style
 * Uses Framer Motion motion values directly
 */
function ConfettiParticleView({ particle }: { particle: ConfettiParticle }): React.JSX.Element {
  return (
    <motion.div
      style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        x: particle.x,
        y: particle.y,
        rotate: particle.r,
        scale: particle.s,
        opacity: particle.o,
        width: particle.w,
        height: particle.h,
        backgroundColor: particle.color,
        borderRadius: 2,
      }}
    />
  );
}

// Memoize to prevent unnecessary re-renders
export const MemoizedConfettiBurst = memo(ConfettiBurst);
