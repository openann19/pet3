/**
 * Presence Aurora Ring Component — Web
 *
 * Animated aurora ring around avatar for presence indication.
 * Uses Framer Motion for smooth animations.
 */

import { useEffect } from 'react';
import { motion, useMotionValue, animate } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export interface PresenceAuroraRingProps {
    src?: string;
    alt?: string;
    fallback?: string;
    status?: 'online' | 'away' | 'busy' | 'offline';
    size?: number;
    intensity?: number; // 0-1, default 0.8
    pulseRate?: number; // milliseconds per rotation, default 3600
    className?: string;
}

/**
 * Presence Aurora Ring — Web Implementation
 *
 * @example
 * ```tsx
 * <PresenceAuroraRing
 *   src="/avatar.jpg"
 *   status="online"
 *   size={40}
 *   intensity={0.8}
 * />
 * ```
 */
export function PresenceAuroraRing({
    src,
    alt,
    fallback,
    status = 'online',
    size = 40,
    intensity = 0.8,
    pulseRate = 3600,
    className,
}: PresenceAuroraRingProps): JSX.Element {
    const reduced = useReducedMotion();
    const rot = useMotionValue(0);
    const opacity = useMotionValue(status === 'offline' ? 0 : intensity);

    const dur = reduced ? 0 : pulseRate / 1000;

    useEffect(() => {
        if (reduced || status === 'offline') {
            rot.set(0);
            opacity.set(status === 'offline' ? 0 : intensity);
            return;
        }

        void animate(rot, 360, {
            duration: dur,
            repeat: Infinity,
            ease: 'linear',
        });
        void animate(opacity, [intensity, intensity * 0.6, intensity], {
            duration: dur / 2,
            repeat: Infinity,
            ease: 'easeInOut',
        });
    }, [reduced, status, dur, rot, opacity, intensity]);

    const ringColors =
        status === 'online'
            ? 'from-emerald-400 via-cyan-400 to-blue-500'
            : status === 'away'
                ? 'from-amber-400 via-orange-400 to-rose-400'
                : status === 'busy'
                    ? 'from-rose-500 via-fuchsia-500 to-indigo-500'
                    : 'from-gray-400 via-gray-500 to-gray-600';

    return (
        <div
            className={`relative inline-block ${className ?? ''}`}
            style={{ width: size, height: size }}
            role="img"
            aria-label={alt ?? `User avatar ${status}`}
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
                        opacity,
                    }}
                    className={`pointer-events-none absolute -inset-0.5 rounded-full bg-[conic-gradient(var(--tw-gradient-stops))] ${ringColors} blur-[2px] opacity-80`}
                    aria-hidden="true"
                >
                    <div />
                </motion.div>
            )}
        </div>
    );
}
