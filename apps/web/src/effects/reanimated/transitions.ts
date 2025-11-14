
import { easeInOut } from 'framer-motion';

export interface SpringConfig {
  damping?: number;
  stiffness?: number;
  mass?: number;
}

export interface TimingConfig {
  duration?: number;
  easing?: (value: number) => number;
}


export const springConfigs = {
  gentle: { damping: 30, stiffness: 300, mass: 0.8 },
  smooth: { damping: 25, stiffness: 400 },
  bouncy: { damping: 15, stiffness: 500 },
  snappy: { damping: 20, stiffness: 600 },
};

export const timingConfigs = {
  fast: { duration: 150, easing: easeInOut },
  smooth: { duration: 300, easing: easeInOut },
  slow: { duration: 500, easing: easeInOut },
  elastic: { duration: 400, easing: easeInOut },
};

export function createSpringTransition(config: SpringConfig = springConfigs.smooth) {
  // Not used in framer-motion web, kept for API compatibility
  return (value: number) => value;
}

export function createTimingTransition(config: TimingConfig = timingConfigs.smooth) {
  // Not used in framer-motion web, kept for API compatibility
  return (value: number) => value;
}

export function createDelayedTransition(delay: number, transition: (value: number) => number) {
  // Not used in framer-motion web, kept for API compatibility
  return (value: number) => value;
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
