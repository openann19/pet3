import { smoothTransition, springTransition, elasticTransition, type Transition } from './transitions';

export interface Variant {
  initial?: {
    opacity?: number;
    x?: number;
    y?: number;
    scale?: number;
  };
  animate?: {
    opacity?: number;
    x?: number;
    y?: number;
    scale?: number;
    transition?: Transition;
  };
  exit?: {
    opacity?: number;
    x?: number;
    y?: number;
    scale?: number;
    transition?: Transition;
  };
}

export const fadeInUp: Variant = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: smoothTransition,
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: smoothTransition,
  },
};

export const fadeInScale: Variant = {
  initial: {
    opacity: 0,
    scale: 0.9,
  },
  animate: {
    opacity: 1,
    scale: 1,
    transition: smoothTransition,
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    transition: smoothTransition,
  },
};

export const slideInFromRight: Variant = {
  initial: {
    opacity: 0,
    x: 100,
  },
  animate: {
    opacity: 1,
    x: 0,
    transition: springTransition,
  },
  exit: {
    opacity: 0,
    x: 100,
    transition: smoothTransition,
  },
};

export const slideInFromLeft: Variant = {
  initial: {
    opacity: 0,
    x: -100,
  },
  animate: {
    opacity: 1,
    x: 0,
    transition: springTransition,
  },
  exit: {
    opacity: 0,
    x: -100,
    transition: smoothTransition,
  },
};

export const elasticPop: Variant = {
  initial: {
    opacity: 0,
    scale: 0.5,
  },
  animate: {
    opacity: 1,
    scale: 1,
    transition: elasticTransition,
  },
  exit: {
    opacity: 0,
    scale: 0.5,
    transition: smoothTransition,
  },
};
