import { useEffect } from 'react';
import { motion, useMotionValue, animate, AnimatePresence } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { springConfigs, motionDurations } from '@/effects/framer-motion/variants';
import { Heart, Sparkle } from '@phosphor-icons/react';

interface MatchCelebrationProps {
  show: boolean;
  petName1: string;
  petName2: string;
  onComplete: () => void;
}

interface ParticleProps {
  index: number;
  total: number;
}

function Particle({ index, total }: ParticleProps) {
  const reducedMotion = useReducedMotion();
  const angle = (index / total) * Math.PI * 2;
  const distance = 180 + Math.random() * 120;
  const x = Math.cos(angle) * distance;
  const y = Math.sin(angle) * distance;

  const particleOpacity = useMotionValue(1);
  const particleScale = useMotionValue(0);
  const particleRotate = useMotionValue(0);
  const particleX = useMotionValue(0);
  const particleY = useMotionValue(0);

  useEffect(() => {
    if (reducedMotion) {
      particleX.set(x);
      particleY.set(y);
      particleScale.set(1);
      particleOpacity.set(1);
      particleRotate.set(0);
      return;
    }

    const delay = index * 20;
    setTimeout(() => {
      void animate(particleX, x, { duration: 2, ease: [0.33, 1, 0.68, 1] });
      void animate(particleY, y, { duration: 2, ease: [0.33, 1, 0.68, 1] });
      void animate(particleScale, [1.5, 0], {
        duration: 2,
        times: [0, 1],
        ease: [0.2, 0, 0, 1],
      });
      void animate(particleOpacity, [1, 0], {
        duration: 2,
        times: [0, 1],
        ease: [0.2, 0, 0, 1],
      });
      void animate(particleRotate, 360, { duration: 2, ease: 'linear' });
    }, delay);
  }, [index, x, y, particleX, particleY, particleScale, particleOpacity, particleRotate, reducedMotion]);

  return (
    <motion.div
      className="absolute"
      style={{
        x: particleX,
        y: particleY,
        scale: particleScale,
        rotate: particleRotate,
        opacity: particleOpacity,
      }}
    >
      {index % 2 === 0 ? (
        <Heart size={24} weight="fill" className="text-primary drop-shadow-2xl" />
      ) : (
        <Sparkle size={20} weight="fill" className="text-accent drop-shadow-2xl" />
      )}
    </motion.div>
  );
}

export default function MatchCelebration({
  show,
  petName1,
  petName2,
  onComplete,
}: MatchCelebrationProps) {
  const reducedMotion = useReducedMotion();

  // Main container animations
  const containerOpacity = useMotionValue(0);
  const backdropOpacity = useMotionValue(0);

  // Modal animations
  const modalScale = useMotionValue(0);
  const modalRotate = useMotionValue(-180);
  const gradientOpacity = useMotionValue(0.5);

  // Heart icon animations
  const heartScale = useMotionValue(1);
  const heartRotate = useMotionValue(0);

  // Text animations
  const titleOpacity = useMotionValue(0);
  const titleY = useMotionValue(20);
  const subtitleOpacity = useMotionValue(0);
  const subtitleY = useMotionValue(20);
  const footerOpacity = useMotionValue(0);

  // Sparkle rotations
  const sparkle1Rotate = useMotionValue(0);
  const sparkle2Rotate = useMotionValue(0);

  useEffect(() => {
    if (show) {
      if (reducedMotion) {
        containerOpacity.set(1);
        backdropOpacity.set(1);
        modalScale.set(1);
        modalRotate.set(0);
        gradientOpacity.set(0.5);
        heartScale.set(1);
        heartRotate.set(0);
        titleOpacity.set(1);
        titleY.set(0);
        subtitleOpacity.set(1);
        subtitleY.set(0);
        footerOpacity.set(1);
        sparkle1Rotate.set(0);
        sparkle2Rotate.set(0);
        const timer = setTimeout(() => {
          onComplete();
        }, 1000);
        return () => clearTimeout(timer);
      }

      // Start animations
      void animate(containerOpacity, 1, {
        type: 'spring',
        damping: 20,
        stiffness: 300,
      });
      void animate(backdropOpacity, 1, {
        type: 'spring',
        damping: 20,
        stiffness: 300,
      });
      void animate(modalScale, 1, {
        type: 'spring',
        damping: 20,
        stiffness: 200,
      });
      void animate(modalRotate, 0, {
        type: 'spring',
        damping: 20,
        stiffness: 200,
      });

      // Gradient pulse
      void animate(gradientOpacity, [0.8, 0.5], {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      });

      // Heart pulse and rotate
      void animate(heartScale, [1.3, 1], {
        duration: 0.6,
        repeat: Infinity,
        ease: 'easeInOut',
      });
      void animate(heartRotate, [5, -5, 0], {
        duration: 0.6,
        repeat: Infinity,
        ease: 'easeInOut',
      });

      // Text animations with delays
      setTimeout(() => {
        void animate(titleOpacity, 1, {
          type: 'spring',
          damping: 20,
          stiffness: 300,
        });
        void animate(titleY, 0, {
          type: 'spring',
          damping: 20,
          stiffness: 300,
        });
      }, 300);
      setTimeout(() => {
        void animate(subtitleOpacity, 1, {
          type: 'spring',
          damping: 20,
          stiffness: 300,
        });
        void animate(subtitleY, 0, {
          type: 'spring',
          damping: 20,
          stiffness: 300,
        });
      }, 400);
      setTimeout(() => {
        void animate(footerOpacity, 1, {
          type: 'spring',
          damping: 20,
          stiffness: 300,
        });
      }, 500);

      // Sparkle rotations
      void animate(sparkle1Rotate, 360, {
        duration: 3,
        repeat: Infinity,
        ease: 'linear',
      });
      void animate(sparkle2Rotate, -360, {
        duration: 3,
        repeat: Infinity,
        ease: 'linear',
      });

      const timer = setTimeout(() => {
        onComplete();
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      // Reset animations
      containerOpacity.set(0);
      backdropOpacity.set(0);
      modalScale.set(0);
      modalRotate.set(-180);
    }
    return undefined;
  }, [
    show,
    onComplete,
    reducedMotion,
    containerOpacity,
    backdropOpacity,
    modalScale,
    modalRotate,
    gradientOpacity,
    heartScale,
    heartRotate,
    titleOpacity,
    titleY,
    subtitleOpacity,
    subtitleY,
    footerOpacity,
    sparkle1Rotate,
    sparkle2Rotate,
  ]);

  const particles = Array.from({ length: 20 }, (_, i) => i);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: containerOpacity }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"
        >
          <motion.div
            className="absolute inset-0 glass-strong backdrop-blur-2xl"
            style={{ opacity: backdropOpacity }}
          />

          {particles.map((i) => (
            <Particle key={i} index={i} total={particles.length} />
          ))}

          <motion.div
            className="relative z-10 rounded-3xl glass-strong premium-shadow border-2 border-white/40 p-10 max-w-md mx-4 backdrop-blur-2xl overflow-hidden"
            style={{
              scale: modalScale,
              rotate: modalRotate,
            }}
          >
            <motion.div
              className="absolute inset-0 bg-linear-to-br from-primary/30 via-accent/30 to-secondary/30"
              style={{ opacity: gradientOpacity }}
            />

            <motion.div
              style={{
                scale: heartScale,
                rotate: heartRotate,
              }}
              className="text-center mb-6 relative z-10"
            >
              <div className="inline-block p-4 rounded-full glass-strong border-2 border-white/50 shadow-2xl">
                <Heart size={72} weight="fill" className="text-white drop-shadow-2xl" />
              </div>
            </motion.div>

            <motion.div
              style={{
                opacity: titleOpacity,
                y: titleY,
              }}
              className="text-4xl font-bold text-white text-center mb-3 drop-shadow-2xl relative z-10"
            >
              It's a Match! 🎉
            </motion.div>

            <motion.div
              style={{
                opacity: subtitleOpacity,
                y: subtitleY,
              }}
              className="text-white/95 text-center text-xl font-medium drop-shadow-lg relative z-10"
            >
              {petName1} and {petName2} are now connected!
            </motion.div>

            <motion.div
              className="mt-8 flex items-center justify-center gap-5 relative z-10"
              style={{ opacity: footerOpacity }}
            >
              <motion.div
                style={{
                  rotate: sparkle1Rotate,
                }}
              >
                <Sparkle size={32} weight="fill" className="text-white drop-shadow-2xl" />
              </motion.div>
              <div className="text-white font-bold text-lg drop-shadow-lg">Perfect Companions!</div>
              <motion.div
                style={{
                  rotate: sparkle2Rotate,
                }}
              >
                <Sparkle size={32} weight="fill" className="text-white drop-shadow-2xl" />
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
