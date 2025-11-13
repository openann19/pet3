// Unified motion tokens
export const motion = {
  durations: {
    instant: 0,
    fast: 150,
    normal: 240,
    smooth: 320,
    slow: 400,
    slower: 600,
  },
  easing: {
    standard: [0.2, 0, 0, 1],
    decelerate: [0, 0, 0.2, 1],
    accelerate: [0.4, 0, 1, 1],
    emphasized: [0.2, 0, 0, 1],
    spring: { damping: 15, stiffness: 250, mass: 0.9 },
  },
  transitions: {
    fade: { duration: 240, easing: 'standard' },
    slide: { duration: 320, easing: 'emphasized' },
    scale: { duration: 240, easing: 'decelerate' },
    slideUp: { duration: 320, easing: 'emphasized' },
    slideDown: { duration: 240, easing: 'accelerate' },
  },
  components: {
    button: {
      press: { duration: 150, easing: 'spring', scale: 0.95 },
      hover: { duration: 240, easing: 'standard' },
    },
    card: {
      entry: { duration: 320, easing: 'emphasized' },
      exit: { duration: 240, easing: 'accelerate' },
    },
    sheet: {
      open: { duration: 320, easing: 'emphasized' },
      close: { duration: 240, easing: 'accelerate' },
    },
  },
} as const;
