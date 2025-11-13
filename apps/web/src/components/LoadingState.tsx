import { useEffect } from 'react';
import { PawPrint, Heart } from '@phosphor-icons/react';
import { motion, useMotionValue, animate } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export default function LoadingState() {
  const reducedMotion = useReducedMotion();
  
  // Main container scale animation
  const mainScale = useMotionValue(1);

  // Outer glow ring animations
  const outerScale = useMotionValue(1);
  const outerOpacity = useMotionValue(0.4);
  const outerRotate = useMotionValue(0);

  // Middle glow ring animations
  const middleScale = useMotionValue(1);
  const middleOpacity = useMotionValue(0.3);
  const middleRotate = useMotionValue(360);

  // Center icon rotation
  const centerRotate = useMotionValue(0);
  const iconRotate = useMotionValue(0);

  // Floating hearts animations
  const heart1Y = useMotionValue(-20);
  const heart1Opacity = useMotionValue(0);
  const heart1Scale = useMotionValue(0.5);

  const heart2Y = useMotionValue(-20);
  const heart2Opacity = useMotionValue(0);
  const heart2Scale = useMotionValue(0.5);

  const heart3Y = useMotionValue(-20);
  const heart3Opacity = useMotionValue(0);
  const heart3Scale = useMotionValue(0.5);

  // Text container animations
  const textOpacity = useMotionValue(0);
  const textY = useMotionValue(10);

  // Dots animations
  const dot1Scale = useMotionValue(1);
  const dot1Opacity = useMotionValue(0.4);
  const dot2Scale = useMotionValue(1);
  const dot2Opacity = useMotionValue(0.4);
  const dot3Scale = useMotionValue(1);
  const dot3Opacity = useMotionValue(0.4);
  const dot4Scale = useMotionValue(1);
  const dot4Opacity = useMotionValue(0.4);

  const dotsOpacity = useMotionValue(0);

  useEffect(() => {
    if (reducedMotion) return;
    
    // Main container scale
    void animate(mainScale, [1, 1.05, 1], {
      duration: 2.5,
      repeat: Infinity,
      ease: 'easeInOut',
    });

    // Outer glow ring
    void animate(outerScale, [1, 1.8, 1], {
      duration: 3,
      repeat: Infinity,
      ease: 'easeInOut',
    });
    
    void animate(outerOpacity, [0.4, 0, 0.4], {
      duration: 3,
      repeat: Infinity,
      ease: 'easeInOut',
    });
    
    void animate(outerRotate, [0, 360], {
      duration: 3,
      repeat: Infinity,
      ease: 'linear',
    });

    // Middle glow ring
    void animate(middleScale, [1, 1.4, 1], {
      duration: 2.5,
      repeat: Infinity,
      ease: 'easeInOut',
    });
    
    void animate(middleOpacity, [0.3, 0, 0.3], {
      duration: 2.5,
      repeat: Infinity,
      ease: 'easeInOut',
    });
    
    void animate(middleRotate, [360, 0], {
      duration: 2.5,
      repeat: Infinity,
      ease: 'linear',
    });

    // Center icon rotation
    void animate(centerRotate, [0, 360], {
      duration: 4,
      repeat: Infinity,
      ease: 'linear',
    });
    void animate(iconRotate, [0, -360], {
      duration: 4,
      repeat: Infinity,
      ease: 'linear',
    });

    // Floating hearts
    void animate(heart1Y, [-20, -40, -20], {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    });
    
    void animate(heart1Opacity, [0, 1, 0], {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    });
    
    void animate(heart1Scale, [0.5, 1, 0.5], {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    });

    setTimeout(() => {
      void animate(heart2Y, [-20, -40, -20], {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      });
      
      void animate(heart2Opacity, [0, 1, 0], {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      });
      
      void animate(heart2Scale, [0.5, 1, 0.5], {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      });
    }, 400);

    setTimeout(() => {
      void animate(heart3Y, [-20, -40, -20], {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      });
      
      void animate(heart3Opacity, [0, 1, 0], {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      });
      
      void animate(heart3Scale, [0.5, 1, 0.5], {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      });
    }, 800);

    // Text container
    setTimeout(() => {
      void animate(textOpacity, 1, { duration: 0.5, ease: [0.2, 0, 0, 1] });
      void animate(textY, 0, { duration: 0.5, ease: [0.2, 0, 0, 1] });
    }, 300);

    // Dots container
    setTimeout(() => {
      void animate(dotsOpacity, 1, { duration: 0.5, ease: [0.2, 0, 0, 1] });
    }, 500);

    // Individual dots
    void animate(dot1Scale, [1, 1.3, 1], {
      duration: 1.2,
      repeat: Infinity,
      ease: 'easeInOut',
    });
    
    void animate(dot1Opacity, [0.4, 1, 0.4], {
      duration: 1.2,
      repeat: Infinity,
      ease: 'easeInOut',
    });

    setTimeout(() => {
      void animate(dot2Scale, [1, 1.3, 1], {
        duration: 1.2,
        repeat: Infinity,
        ease: 'easeInOut',
      });
      
      void animate(dot2Opacity, [0.4, 1, 0.4], {
        duration: 1.2,
        repeat: Infinity,
        ease: 'easeInOut',
      });
    }, 180);

    setTimeout(() => {
      void animate(dot3Scale, [1, 1.3, 1], {
        duration: 1.2,
        repeat: Infinity,
        ease: 'easeInOut',
      });
      
      void animate(dot3Opacity, [0.4, 1, 0.4], {
        duration: 1.2,
        repeat: Infinity,
        ease: 'easeInOut',
      });
    }, 360);

    setTimeout(() => {
      void animate(dot4Scale, [1, 1.3, 1], {
        duration: 1.2,
        repeat: Infinity,
        ease: 'easeInOut',
      });
      
      void animate(dot4Opacity, [0.4, 1, 0.4], {
        duration: 1.2,
        repeat: Infinity,
        ease: 'easeInOut',
      });
    }, 540);
  }, [reducedMotion, mainScale, outerScale, outerOpacity, outerRotate, middleScale, middleOpacity, middleRotate, centerRotate, iconRotate, heart1Y, heart1Opacity, heart1Scale, heart2Y, heart2Opacity, heart2Scale, heart3Y, heart3Opacity, heart3Scale, textOpacity, textY, dotsOpacity, dot1Scale, dot1Opacity, dot2Scale, dot2Opacity, dot3Scale, dot3Opacity, dot4Scale, dot4Opacity]); // Only run once on mount - animations are managed by framer-motion

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 px-4">
      <motion.div
        style={{ scale: mainScale }}
        className="relative w-28 h-28"
      >
        {/* Outer glow ring */}
        <motion.div
          style={{
            scale: outerScale,
            rotate: outerRotate,
            opacity: outerOpacity,
          }}
          className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/30 via-accent/20 to-secondary/30"
        />

        {/* Middle glow ring */}
        <motion.div
          style={{
            scale: middleScale,
            rotate: middleRotate,
            opacity: middleOpacity,
          }}
          className="absolute inset-2 rounded-full bg-gradient-to-tr from-accent/30 to-primary/30"
        />

        {/* Center icon container */}
        <motion.div
          style={{ rotate: centerRotate }}
          className="absolute inset-4 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 backdrop-blur-sm flex items-center justify-center border border-primary/20"
        >
          <motion.div style={{ rotate: iconRotate }}>
            <PawPrint size={40} weight="fill" className="text-primary drop-shadow-lg" />
          </motion.div>
        </motion.div>

        {/* Floating hearts */}
        <motion.div
          style={{
            y: heart1Y,
            scale: heart1Scale,
            opacity: heart1Opacity,
            left: '30%',
            top: '50%',
          }}
          className="absolute"
        >
          <Heart size={16} weight="fill" className="text-accent" />
        </motion.div>
        <motion.div
          style={{
            y: heart2Y,
            scale: heart2Scale,
            opacity: heart2Opacity,
            left: '50%',
            top: '50%',
          }}
          className="absolute"
        >
          <Heart size={16} weight="fill" className="text-accent" />
        </motion.div>
        <motion.div
          style={{
            y: heart3Y,
            scale: heart3Scale,
            opacity: heart3Opacity,
            left: '70%',
            top: '50%',
          }}
          className="absolute"
        >
          <Heart size={16} weight="fill" className="text-accent" />
        </motion.div>
      </motion.div>

      <motion.div
        style={{
          opacity: textOpacity,
          y: textY,
        }}
        className="flex flex-col items-center gap-3 max-w-sm text-center"
      >
        <div className="text-xl font-bold bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
          Loading your experience...
        </div>
        <p className="text-sm text-muted-foreground">Preparing amazing connections</p>
      </motion.div>

      <motion.div style={{ opacity: dotsOpacity }} className="flex gap-2.5">
        <motion.div
          style={{
            scale: dot1Scale,
            opacity: dot1Opacity,
          }}
          className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-primary to-accent"
        />
        <motion.div
          style={{
            scale: dot2Scale,
            opacity: dot2Opacity,
          }}
          className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-primary to-accent"
        />
        <motion.div
          style={{
            scale: dot3Scale,
            opacity: dot3Opacity,
          }}
          className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-primary to-accent"
        />
        <motion.div
          style={{
            scale: dot4Scale,
            opacity: dot4Opacity,
          }}
          className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-primary to-accent"
        />
      </motion.div>
    </div>
  );
}
