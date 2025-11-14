/**
 * Ultra Enhanced Card
 * Card with 3D transforms, hover effects, and smooth animations
 * Migrated to pure Framer Motion - uses MotionValues directly
 */

import {
  useGlowBorder,
  useHoverLift,
  useMagneticHover,
  useParallaxTilt,
  useUltraCardReveal,
} from '@/effects/reanimated';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { type HTMLAttributes, type ReactNode } from 'react';
import { useUIConfig } from "@/hooks/use-ui-config";

export interface UltraCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  index?: number;
  enableReveal?: boolean;
  enableMagnetic?: boolean;
  enableHoverLift?: boolean;
  enableTilt?: boolean;
  enableGlow?: boolean;
  glowColor?: string;
  className?: string;
}

export function UltraCard({
  children,
  index = 0,
  enableReveal = true,
  enableMagnetic = false,
  enableHoverLift = true,
  enableTilt = false,
  enableGlow = false,
  glowColor = 'rgba(99, 102, 241, 0.4)',
  className,
  ...props
}: UltraCardProps) {
  const _uiConfig = useUIConfig();
  const reveal = useUltraCardReveal({
    index,
    enabled: enableReveal,
    delay: 0,
    rotationIntensity: 12,
  });

  const magnetic = useMagneticHover({
    strength: 0.2,
    maxDistance: 50,
    enabled: enableMagnetic,
  });

  const hoverLift = useHoverLift({
    scale: 1.03,
    translateY: -6,
    damping: 22,
    stiffness: 180,
  });

  const tilt = useParallaxTilt({
    maxTilt: 8,
  });

  const glow = useGlowBorder({
    enabled: enableGlow,
    color: glowColor,
    intensity: 14,
    speed: 2500,
  });

  const handleTiltMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!enableTilt) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    tilt.handleMove(x, y, rect.width, rect.height);
  };

  return (
    <div
      ref={enableMagnetic ? magnetic.handleRef : undefined}
      onMouseEnter={enableMagnetic ? magnetic.handleMouseEnter : hoverLift.handleEnter}
      onMouseLeave={enableMagnetic ? magnetic.handleMouseLeave : hoverLift.handleLeave}
      onMouseMove={enableMagnetic ? magnetic.handleMouseMove : undefined}
      className="inline-block"
    >
      <motion.div
        style={{
          opacity: enableReveal ? reveal.opacity : 1,
          scale: enableReveal ? reveal.scale : 1,
          rotateX: enableReveal ? reveal.rotateX : 0,
          rotateY: enableReveal ? reveal.rotateY : 0,
          z: enableReveal ? reveal.translateZ : 0,
          perspective: enableReveal ? reveal.perspective : undefined,
          x: enableMagnetic ? magnetic.translateX : 0,
          y: enableMagnetic ? magnetic.translateY : 0,
        }}
      >
        <motion.div
          onMouseMove={enableTilt ? handleTiltMove : undefined}
          onMouseLeave={enableTilt ? tilt.handleLeave : undefined}
          className="relative"
          style={{
            rotateX: enableTilt ? tilt.rotateX : 0,
            rotateY: enableTilt ? tilt.rotateY : 0,
            perspective: enableTilt ? tilt.perspective : undefined,
            scale: enableHoverLift ? hoverLift.scale : 1,
            y: enableHoverLift ? hoverLift.translateY : 0,
          }}
        >
          <motion.div
            className={cn(
              'bg-card border border-border rounded-xl shadow-lg',
              className
            )}
            whileHover={{
              boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)',
            }}
            transition={{
              duration: 0.3,
              ease: 'easeInOut',
            }}
            {...props}
          >
            {enableGlow && (
              <motion.div
                className="absolute inset-0 rounded-xl pointer-events-none"
                style={{
                  boxShadow: glow.boxShadow,
                  filter: glow.filter,
                  opacity: glow.opacity,
                }}
              />
            )}
            <div className="relative z-10">{children}</div>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}
