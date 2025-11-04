import { Variants, Transition } from 'framer-motion'

export const springTransition: Transition = {
  type: 'spring',
  stiffness: 400,
  damping: 25
}

export const smoothTransition: Transition = {
  duration: 0.4,
  ease: [0.4, 0, 0.2, 1]
}

export const elasticTransition: Transition = {
  type: 'spring',
  stiffness: 300,
  damping: 15
}

// Buttery smooth transition optimized for 60fps
export const butterySmoothTransition: Transition = {
  type: 'spring',
  stiffness: 350,
  damping: 30,
  mass: 0.8
}

// Smooth page transition for view changes
export const smoothPageTransition: Transition = {
  duration: 0.5,
  ease: [0.25, 0.1, 0.25, 1] // Custom cubic-bezier for natural motion
}

export const fadeInUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
}

export const fadeInScale: Variants = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.9 }
}

export const slideInFromRight: Variants = {
  initial: { x: 100, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: -100, opacity: 0 }
}

export const slideInFromLeft: Variants = {
  initial: { x: -100, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: 100, opacity: 0 }
}

export const scaleRotate: Variants = {
  initial: { scale: 0, rotate: -180 },
  animate: { scale: 1, rotate: 0 },
  exit: { scale: 0, rotate: 180 }
}

export const elasticPop: Variants = {
  initial: { scale: 0, opacity: 0 },
  animate: { 
    scale: 1, 
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 500,
      damping: 15
    }
  },
  exit: { scale: 0, opacity: 0 }
}

export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
}

export const staggerItem: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 }
}

export const hoverLift = {
  scale: 1.05,
  y: -4,
  transition: springTransition
}

export const hoverGrow = {
  scale: 1.02,
  transition: springTransition
}

export const tapShrink = {
  scale: 0.95,
  transition: { duration: 0.1 }
}

export const glowPulse = {
  boxShadow: [
    '0 0 20px rgba(var(--primary), 0.3)',
    '0 0 40px rgba(var(--primary), 0.6)',
    '0 0 20px rgba(var(--primary), 0.3)',
  ],
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: 'easeInOut'
  }
}

export const shimmerEffect = {
  backgroundPosition: ['-200% 0', '200% 0'],
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: 'linear'
  }
}

export const floatAnimation = {
  y: [0, -10, 0],
  transition: {
    duration: 3,
    repeat: Infinity,
    ease: 'easeInOut'
  }
}

export const rotateAnimation = {
  rotate: [0, 360],
  transition: {
    duration: 20,
    repeat: Infinity,
    ease: 'linear'
  }
}

export const pulseScale = {
  scale: [1, 1.1, 1],
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: 'easeInOut'
  }
}

export const cardHover = {
  y: -8,
  scale: 1.02,
  boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.15)',
  transition: smoothTransition
}

export const buttonHover = {
  scale: 1.05,
  boxShadow: '0 8px 20px -5px rgba(0, 0, 0, 0.2)',
  transition: springTransition
}

export const iconHover = {
  scale: 1.15,
  rotate: 5,
  transition: springTransition
}

export const pageTransition: Variants = {
  initial: { opacity: 0, y: 30, scale: 0.98 },
  animate: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: smoothTransition
  },
  exit: { 
    opacity: 0, 
    y: -30, 
    scale: 0.98,
    transition: { duration: 0.3, ease: [0.4, 0, 1, 1] }
  }
}

export const modalBackdrop: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 }
}

export const modalContent: Variants = {
  initial: { scale: 0.9, opacity: 0, y: 20 },
  animate: { 
    scale: 1, 
    opacity: 1, 
    y: 0,
    transition: elasticTransition
  },
  exit: { 
    scale: 0.9, 
    opacity: 0, 
    y: 20,
    transition: { duration: 0.2 }
  }
}

export const notificationSlide: Variants = {
  initial: { x: 400, opacity: 0 },
  animate: { 
    x: 0, 
    opacity: 1,
    transition: springTransition
  },
  exit: { 
    x: 400, 
    opacity: 0,
    transition: { duration: 0.2 }
  }
}

export const revealFromBottom: Variants = {
  initial: { y: 100, opacity: 0 },
  animate: { y: 0, opacity: 1 },
  exit: { y: 100, opacity: 0 }
}

export const revealFromTop: Variants = {
  initial: { y: -100, opacity: 0 },
  animate: { y: 0, opacity: 1 },
  exit: { y: -100, opacity: 0 }
}

export const zoomIn: Variants = {
  initial: { scale: 0, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit: { scale: 0, opacity: 0 }
}

export const rotateIn: Variants = {
  initial: { rotate: -180, scale: 0, opacity: 0 },
  animate: { rotate: 0, scale: 1, opacity: 1 },
  exit: { rotate: 180, scale: 0, opacity: 0 }
}

export const flipIn: Variants = {
  initial: { rotateY: -90, opacity: 0 },
  animate: { 
    rotateY: 0, 
    opacity: 1,
    transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] }
  },
  exit: { rotateY: 90, opacity: 0 }
}

export const bounceIn: Variants = {
  initial: { y: -100, opacity: 0 },
  animate: { 
    y: 0, 
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 10
    }
  },
  exit: { y: 100, opacity: 0 }
}

export const heartbeat = {
  scale: [1, 1.2, 1, 1.2, 1],
  transition: {
    duration: 1,
    repeat: Infinity,
    repeatDelay: 1
  }
}

export const wiggle = {
  rotate: [0, -10, 10, -10, 10, 0],
  transition: {
    duration: 0.5,
    repeat: Infinity,
    repeatDelay: 2
  }
}

export const slideIndicator = {
  x: '100%',
  transition: {
    duration: 0.3,
    ease: 'easeInOut'
  }
}
