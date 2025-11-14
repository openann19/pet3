'use client';
import { motion, type MotionStyle } from 'framer-motion';
import type { Particle } from '@/effects/reanimated/particle-engine';
import type { MotionValue } from 'framer-motion';

export interface ParticleViewProps {
  particle: Particle;
  className?: string;
}

/**
 * ParticleView component that renders a single particle with animated style
 * Uses Framer Motion MotionValues directly for reactive animations
 */
export function ParticleView({ particle, className }: ParticleViewProps): React.JSX.Element {
  // Convert SharedValue to MotionValue if needed, or use directly
  // The particle engine uses SharedValue which is compatible with MotionValue
  const x = particle.x as unknown as MotionValue<number>;
  const y = particle.y as unknown as MotionValue<number>;
  const opacity = particle.opacity as unknown as MotionValue<number>;
  const scale = particle.scale as unknown as MotionValue<number>;
  const rotation = particle.rotation as unknown as MotionValue<number>;

  const style: MotionStyle = {
    position: 'absolute',
    left: x,
    top: y,
    width: particle.size,
    height: particle.size,
    backgroundColor: particle.color,
    borderRadius: particle.size / 2,
    opacity,
    scale,
    rotate: rotation,
    pointerEvents: 'none',
    zIndex: 9999,
  };

  return (
    <motion.div style={style} className={className} aria-hidden="true">
      <div />
    </motion.div>
  );
}
