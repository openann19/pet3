'use client';

import { motion } from 'framer-motion';
import { memo } from 'react';
import { Heart, Eye, Sparkle } from '@phosphor-icons/react';
import { useApp } from '@/contexts/AppContext';
import { usePrefersReducedMotion } from '@/utils/reduced-motion';

interface StatsCardProps {
  totalMatches: number;
  totalSwipes: number;
  successRate: number;
}

function AnimatedNumber({ value }: { value: number }) {
  // Simplified: render the target value directly to avoid framer-motion API usage
  return <span>{Math.round(value)}</span>;
}

export default function StatsCard({ totalMatches, totalSwipes, successRate }: StatsCardProps) {
  const { t } = useApp();
  const prefersReducedMotion = usePrefersReducedMotion();

  return (
    <section
      className="p-6 mb-6 overflow-hidden relative rounded-3xl glass-strong premium-shadow backdrop-blur-2xl border border-white/20"
      aria-labelledby="stats-heading"
    >
      {!prefersReducedMotion && (
        <motion.div
          className="absolute inset-0 bg-linear-to-br from-primary/10 via-accent/5 to-secondary/10"
          animate={{
            opacity: [0.3, 0.7, 0.3],
          }}
          transition={{ duration: 4, repeat: Infinity, repeatType: 'reverse' }}
          aria-hidden="true"
        />
      )}
      <h3
        id="stats-heading"
        className="text-lg font-bold mb-6 relative bg-linear-to-r from-primary via-accent to-secondary bg-clip-text text-transparent"
      >
        {t.profile.stats}
      </h3>
      <div className="grid grid-cols-3 gap-4 relative" role="list" aria-label="Statistics">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: prefersReducedMotion ? 0 : 0.1, type: 'spring', stiffness: 300, damping: 20 }}
          whileHover={prefersReducedMotion ? undefined : { scale: 1.08, y: -8 }}
          className="text-center glass-effect p-4 rounded-2xl backdrop-blur-md border border-white/20"
          role="listitem"
          aria-label={`${t.profile.totalMatches}: ${Math.round(totalMatches)}`}
        >
          <motion.div
            className="w-14 h-14 rounded-full bg-linear-to-br from-primary via-primary/80 to-primary/60 flex items-center justify-center mx-auto mb-3 shadow-xl"
            whileHover={prefersReducedMotion ? undefined : { rotate: [0, -15, 15, -15, 0], scale: 1.1 }}
            transition={{ duration: 0.5 }}
            aria-hidden="true"
          >
            <Heart size={28} className="text-white drop-shadow-lg" weight="fill" aria-hidden="true" />
          </motion.div>
          <div className="text-3xl font-bold bg-linear-to-br from-primary to-accent bg-clip-text text-transparent" aria-hidden="true">
            <AnimatedNumber value={totalMatches} />
          </div>
          <div className="text-xs text-foreground/70 font-semibold mt-1">
            {t.profile.totalMatches}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: prefersReducedMotion ? 0 : 0.2, type: 'spring', stiffness: 300, damping: 20 }}
          whileHover={prefersReducedMotion ? undefined : { scale: 1.08, y: -8 }}
          className="text-center glass-effect p-4 rounded-2xl backdrop-blur-md border border-white/20"
          role="listitem"
          aria-label={`${t.profile.totalSwipes}: ${Math.round(totalSwipes)}`}
        >
          <motion.div
            className="w-14 h-14 rounded-full bg-linear-to-br from-secondary via-secondary/80 to-secondary/60 flex items-center justify-center mx-auto mb-3 shadow-xl"
            whileHover={prefersReducedMotion ? undefined : { scale: 1.25 }}
            transition={{ type: 'tween', duration: 0.3 }}
            aria-hidden="true"
          >
            <Eye size={28} className="text-white drop-shadow-lg" weight="fill" aria-hidden="true" />
          </motion.div>
          <div className="text-3xl font-bold bg-linear-to-br from-secondary to-primary bg-clip-text text-transparent" aria-hidden="true">
            <AnimatedNumber value={totalSwipes} />
          </div>
          <div className="text-xs text-foreground/70 font-semibold mt-1">
            {t.profile.totalSwipes}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: prefersReducedMotion ? 0 : 0.3, type: 'spring', stiffness: 300, damping: 20 }}
          whileHover={prefersReducedMotion ? undefined : { scale: 1.08, y: -8 }}
          className="text-center glass-effect p-4 rounded-2xl backdrop-blur-md border border-white/20"
          role="listitem"
          aria-label={`${t.profile.successRate}: ${Math.round(successRate)}%`}
        >
          <motion.div
            className="w-14 h-14 rounded-full bg-linear-to-br from-accent via-accent/80 to-accent/60 flex items-center justify-center mx-auto mb-3 shadow-xl"
            animate={prefersReducedMotion ? {} : { rotate: [0, 15, 0] }}
            transition={{ duration: 2.5, repeat: prefersReducedMotion ? 0 : Infinity, repeatType: 'reverse' }}
            aria-hidden="true"
          >
            <Sparkle size={28} className="text-white drop-shadow-lg" weight="fill" aria-hidden="true" />
          </motion.div>
          <div className="text-3xl font-bold bg-linear-to-br from-accent to-secondary bg-clip-text text-transparent" aria-hidden="true">
            <AnimatedNumber value={successRate} />%
          </div>
          <div className="text-xs text-foreground/70 font-semibold mt-1">
            {t.profile.successRate}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// Memoize to prevent unnecessary re-renders
export const MemoizedStatsCard = memo(StatsCard);
