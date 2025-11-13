'use client';

import { motion } from 'framer-motion';
import { springConfigs } from '@/effects/framer-motion/variants';
import { usePrefersReducedMotion } from '@/utils/reduced-motion';
import type { CompatibilityFactors } from '@/lib/types';
import { useEffect, useState } from 'react';

interface CompatibilityBreakdownProps {
  factors: CompatibilityFactors;
  className?: string;
}

const factorLabels = {
  personalityMatch: 'Personality',
  interestMatch: 'Shared Interests',
  sizeMatch: 'Size Compatibility',
  ageCompatibility: 'Age Match',
  locationProximity: 'Location',
};

const factorIcons = {
  personalityMatch: '🎭',
  interestMatch: '🎾',
  sizeMatch: '📏',
  ageCompatibility: '🎂',
  locationProximity: '📍',
};

const factorColors = {
  personalityMatch: 'from-primary to-primary/60',
  interestMatch: 'from-accent to-accent/60',
  sizeMatch: 'from-secondary to-secondary/60',
  ageCompatibility: 'from-lavender to-lavender/60',
  locationProximity: 'from-primary to-accent',
};

export default function CompatibilityBreakdown({
  factors,
  className,
}: CompatibilityBreakdownProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [animatedValues, setAnimatedValues] = useState<Record<string, number>>({});

  useEffect(() => {
    const timer = setTimeout(() => {
      const values: Record<string, number> = {
        personalityMatch: factors.personalityMatch,
        interestMatch: factors.interestMatch,
        sizeMatch: factors.sizeMatch,
        ageCompatibility: factors.ageCompatibility,
        locationProximity: factors.locationProximity,
      };
      setAnimatedValues(values);
    }, 100);
    return () => clearTimeout(timer);
  }, [factors]);

  const emojiStyle = { fontSize: '1.5em', marginRight: '0.5em' };
  return (
    <div
      className={`rounded-3xl glass-strong premium-shadow backdrop-blur-2xl border border-white/20 ${className}`}
    >
      <div className="p-6 bg-linear-to-br from-white/20 to-white/10">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={prefersReducedMotion ? { duration: 0.1 } : springConfigs.smooth}
          className="text-lg font-bold mb-4 flex items-center gap-2 bg-linear-to-r from-primary via-accent to-secondary bg-clip-text text-transparent"
        >
          <motion.div style={emojiStyle} className="inline-block">
            📊
          </motion.div>
          Compatibility Breakdown
        </motion.div>
        <div className="space-y-4">
          {Object.entries(factors).map(([key, _value], idx) => {
            const animatedPercentage = Math.round((animatedValues[key] ?? 0) * 100);
            const label = factorLabels[key as keyof typeof factorLabels];
            const icon = factorIcons[key as keyof typeof factorIcons];
            const colorClass = factorColors[key as keyof typeof factorColors];

            const delay = prefersReducedMotion ? 0 : idx * 0.1;
            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={prefersReducedMotion ? { duration: 0.1 } : { delay, ...springConfigs.smooth }}
                whileHover={prefersReducedMotion ? undefined : { scale: 1.02 }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium flex items-center gap-2">
                    <motion.span
                      whileHover={prefersReducedMotion ? undefined : { scale: 1.3, rotate: 360 }}
                      transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.5 }}
                    >
                      {icon}
                    </motion.span>
                    {label}
                  </span>
                  <motion.span
                    className="text-sm font-bold text-muted-foreground tabular-nums"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={prefersReducedMotion ? { duration: 0.1 } : { delay: delay + 0.3 }}
                  >
                    {animatedPercentage}%
                  </motion.span>
                </div>
                <div className="relative">
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full bg-linear-to-r ${colorClass} rounded-full relative overflow-hidden`}
                      initial={{ width: 0 }}
                      animate={{ width: `${animatedPercentage}%` }}
                      transition={prefersReducedMotion ? { duration: 0.1 } : { delay: delay + 0.2, duration: 0.8, ease: 'easeOut' }}
                    >
                      {!prefersReducedMotion && (
                        <motion.div
                          className="absolute inset-0 bg-white/30"
                          animate={{
                            x: ['-100%', '100%'],
                          }}
                          transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: 'linear',
                            delay: delay + 0.5,
                          }}
                          style={{ width: '50%' }}
                        />
                      )}
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
