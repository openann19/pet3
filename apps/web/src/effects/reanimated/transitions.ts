'use client';

import type { Transition, Spring, Tween } from 'framer-motion';

export interface SpringConfig {
  damping?: number;
  stiffness?: number;
  mass?: number;
}

export interface TimingConfig {
  duration?: number;
  easing?: string | number[];
  ease?: string | number[]; // Alias for easing (for compatibility)
}

export const springConfigs = {
  gentle: { damping: 30, stiffness: 300, mass: 0.8 } as SpringConfig,
  smooth: { damping: 25, stiffness: 400 } as SpringConfig,
  bouncy: { damping: 15, stiffness: 500 } as SpringConfig,
  snappy: { damping: 20, stiffness: 600 } as SpringConfig,
};

export const timingConfigs = {
  fast: { duration: 0.15, ease: 'easeOut' } as TimingConfig,
  smooth: { duration: 0.3, ease: 'easeInOut' } as TimingConfig,
  slow: { duration: 0.5, ease: 'easeInOut' } as TimingConfig,
  elastic: { duration: 0.4, ease: [0.2, 0, 0, 1] } as TimingConfig,
};

export function createSpringTransition(config: SpringConfig = springConfigs.smooth): Spring {
  return {
    type: 'spring',
    damping: config.damping ?? 25,
    stiffness: config.stiffness ?? 400,
    mass: config.mass,
  };
}

export function createTimingTransition(config: TimingConfig = timingConfigs.smooth): Tween {
  return {
    type: 'tween',
    duration: config.duration ?? 0.3,
    ease: config.easing ?? 'easeInOut',
  };
}

export function createDelayedTransition(delay: number, transition: Transition): Transition {
  return {
    ...transition,
    delay: delay / 1000, // Convert ms to seconds
  };
}

export const fadeIn = {
  opacity: {
    from: 0,
    to: 1,
    config: timingConfigs.smooth,
  },
};

export const fadeOut = {
  opacity: {
    from: 1,
    to: 0,
    config: timingConfigs.fast,
  },
};

export const slideUp = {
  translateY: {
    from: 20,
    to: 0,
    config: springConfigs.smooth,
  },
  opacity: {
    from: 0,
    to: 1,
    config: timingConfigs.smooth,
  },
};

export const slideDown = {
  translateY: {
    from: -20,
    to: 0,
    config: springConfigs.smooth,
  },
  opacity: {
    from: 0,
    to: 1,
    config: timingConfigs.smooth,
  },
};

export const scaleIn = {
  scale: {
    from: 0.9,
    to: 1,
    config: springConfigs.bouncy,
  },
  opacity: {
    from: 0,
    to: 1,
    config: timingConfigs.smooth,
  },
};

export const scaleOut = {
  scale: {
    from: 1,
    to: 0.9,
    config: springConfigs.smooth,
  },
  opacity: {
    from: 1,
    to: 0,
    config: timingConfigs.fast,
  },
};
