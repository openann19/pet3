/**
 * Presence Avatar — Web with Aurora Ring
 * - Animated aurora ring using Reanimated alpha/rotate
 * - Reduced motion → static subtle ring
 *
 * Location: apps/web/src/components/chat/PresenceAvatar.tsx
 */

import { useEffect } from 'react';
import { motion, useMotionValue, animate } from 'framer-motion';
import { useReducedMotion, getReducedMotionDuration } from '@/effects/chat/core/reduced-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useUIConfig } from "@/hooks/use-ui-config";

export interface PresenceAvatarProps {
  src?: string;
  alt?: string;
  fallback?: string;
  status?: 'online' | 'away' | 'busy' | 'offline';
  size?: number;
  className?: string;
}

export function PresenceAvatar({
  src,
  alt,
  fallback,
  status = 'online',
  size = 40,
  className,
}: PresenceAvatarProps) {
  const _uiConfig = useUIConfig();
  const reduced = useReducedMotion();
  const rot = useMotionValue(0);

  const dur = getReducedMotionDuration(3600, reduced);
  useEffect(() => {
    rot.set(0);
    if (!reduced && status !== 'offline') {
      void animate(rot, 360, {
        duration: dur / 1000,
        repeat: Infinity,
        ease: 'linear',
      });
    }
  }, [reduced, status, dur, rot]);

  const ringColors =
    status === 'online'
      ? 'from-emerald-400 via-cyan-400 to-blue-500'
      : status === 'away'
        ? 'from-amber-400 via-orange-400 to-rose-400'
        : 'from-rose-500 via-fuchsia-500 to-indigo-500';

  return (
    <div
      className={`relative inline-block ${className ?? ''}`}
      style={{ width: size, height: size }}
    >
      <Avatar className="w-full h-full">
        <AvatarImage src={src} alt={alt} />
        <AvatarFallback className="bg-linear-to-br from-secondary to-primary text-white text-xs font-bold">
          {(fallback?.[0] ?? '?').toUpperCase()}
        </AvatarFallback>
      </Avatar>

      {status !== 'offline' && (
        <motion.div
          style={{
            rotate: rot,
            opacity: 1,
          }}
          className={`pointer-events-none absolute -inset-0.5 rounded-full bg-[conic-gradient(var(--tw-gradient-stops))] ${String(ringColors ?? '')} blur-[2px] opacity-80`}
        />
      )}
    </div>
  );
}
