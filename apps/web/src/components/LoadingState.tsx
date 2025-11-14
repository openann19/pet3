
import { useEffect } from 'react';
import { PawPrint, Heart } from '@phosphor-icons/react';
import { AnimatedView } from '@/effects/reanimated/animated-view';
import { useFadeAnimation } from '@/effects/reanimated/use-fade-animation';
import { useScaleAnimation } from '@/effects/reanimated/use-scale-animation';
import { useMotionVariants } from '@/effects/reanimated/use-motion-variants';
import { useHeaderAnimation } from '@/effects/reanimated/use-header-animation';
import { useLogoAnimation, useLogoGlow } from '@/effects/reanimated/use-logo-animation';
import { useIconRotation } from '@/effects/reanimated/use-icon-rotation';
import type { AnimatedStyle } from '@/effects/reanimated/animated-view';


export default function LoadingState() {
  // Main container scale animation
  const { animatedStyle: mainStyle } = useScaleAnimation({
    initial: true,
    initialScale: 0.98,
    duration: 1250,
    enabled: true,
    useSpring: true,
  });

  // Outer glow ring animation (scale, opacity, rotate)
  const outerVariants = {
    animate: {
      scale: 1.8,
      opacity: 0.4,
      rotate: 360,
      transition: { duration: 3, ease: 'easeInOut' },
    },
    initial: {
      scale: 1,
      opacity: 0.4,
      rotate: 0,
    },
  };
  const { animatedStyle: outerStyle } = useMotionVariants({
    variants: outerVariants,
    initial: 'initial',
    animate: 'animate',
    enabled: true,
  });

  // Middle glow ring animation
  const middleVariants = {
    animate: {
      scale: 1.4,
      opacity: 0.3,
      rotate: 360,
      transition: { duration: 2.5, ease: 'easeInOut' },
    },
    initial: {
      scale: 1,
      opacity: 0.3,
      rotate: 0,
    },
  };
  const { animatedStyle: middleStyle } = useMotionVariants({
    variants: middleVariants,
    initial: 'initial',
    animate: 'animate',
    enabled: true,
  });

  // Center icon rotation
  const { animatedStyle: centerStyle } = useMotionVariants({
    variants: {
      animate: { rotate: 360, transition: { duration: 4, ease: 'linear' } },
      initial: { rotate: 0 },
    },
    initial: 'initial',
    animate: 'animate',
    enabled: true,
  });

  // Icon counter-rotation
  const { animatedStyle: iconStyle } = useMotionVariants({
    variants: {
      animate: { rotate: -360, transition: { duration: 4, ease: 'linear' } },
      initial: { rotate: 0 },
    },
    initial: 'initial',
    animate: 'animate',
    enabled: true,
  });

  // Floating hearts (staggered)
  const heartVariants = [
    {
      animate: {
        translateY: -40,
        scale: 1,
        opacity: 1,
        transition: { duration: 1, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' },
      },
      initial: { translateY: -20, scale: 0.5, opacity: 0 },
    },
    {
      animate: {
        translateY: -40,
        scale: 1,
        opacity: 1,
        transition: { duration: 1, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut', delay: 0.4 },
      },
      initial: { translateY: -20, scale: 0.5, opacity: 0 },
    },
    {
      animate: {
        translateY: -40,
        scale: 1,
        opacity: 1,
        transition: { duration: 1, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut', delay: 0.8 },
      },
      initial: { translateY: -20, scale: 0.5, opacity: 0 },
    },
  ];
  const heartStyles = heartVariants.map((variants) =>
    useMotionVariants({ variants, initial: 'initial', animate: 'animate', enabled: true }).animatedStyle
  );

  // Text fade-in and slide-up
  const { animatedStyle: textStyle } = useMotionVariants({
    variants: {
      animate: { opacity: 1, translateY: 0, transition: { duration: 0.5, delay: 0.3 } },
      initial: { opacity: 0, translateY: 10 },
    },
    initial: 'initial',
    animate: 'animate',
    enabled: true,
  });

  // Dots fade-in
  const { animatedStyle: dotsStyle } = useMotionVariants({
    variants: {
      animate: { opacity: 1, transition: { duration: 0.5, delay: 0.5 } },
      initial: { opacity: 0 },
    },
    initial: 'initial',
    animate: 'animate',
    enabled: true,
  });

  // Dots scale and opacity (staggered)
  const dotVariants = [0, 0.18, 0.36, 0.54].map((delay) => ({
    animate: {
      scale: 1.3,
      opacity: 1,
      transition: { duration: 0.6, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut', delay },
    },
    initial: { scale: 1, opacity: 0.4 },
  }));
  const dotStyles = dotVariants.map((variants) =>
    useMotionVariants({ variants, initial: 'initial', animate: 'animate', enabled: true }).animatedStyle
  );

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 px-4">
      <AnimatedView style={mainStyle} className="relative w-28 h-28">
        {/* Outer glow ring */}
        <AnimatedView
          style={outerStyle}
          className="absolute inset-0 rounded-full bg-linear-to-br from-primary/30 via-accent/20 to-secondary/30"
        />

        {/* Middle glow ring */}
        <AnimatedView
          style={middleStyle}
          className="absolute inset-2 rounded-full bg-linear-to-tr from-accent/30 to-primary/30"
        />

        {/* Center icon container */}
        <AnimatedView
          style={centerStyle}
          className="absolute inset-4 rounded-full bg-linear-to-br from-primary/10 to-accent/10 backdrop-blur-sm flex items-center justify-center border border-primary/20"
        >
          <AnimatedView style={iconStyle}>
            <PawPrint size={40} weight="fill" className="text-primary drop-shadow-lg" />
          </AnimatedView>
        </AnimatedView>

        {/* Floating hearts */}
        <AnimatedView style={{ ...heartStyles[0], left: '30%', top: '50%' }} className="absolute">
          <Heart size={16} weight="fill" className="text-accent" />
        </AnimatedView>
        <AnimatedView style={{ ...heartStyles[1], left: '50%', top: '50%' }} className="absolute">
          <Heart size={16} weight="fill" className="text-accent" />
        </AnimatedView>
        <AnimatedView style={{ ...heartStyles[2], left: '70%', top: '50%' }} className="absolute">
          <Heart size={16} weight="fill" className="text-accent" />
        </AnimatedView>
      </AnimatedView>

      <AnimatedView
        style={textStyle}
        className="flex flex-col items-center gap-3 max-w-sm text-center"
      >
        <div className="text-xl font-bold bg-linear-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
          Loading your experience...
        </div>
        <p className="text-sm text-muted-foreground">Preparing amazing connections</p>
      </AnimatedView>

      <AnimatedView style={dotsStyle} className="flex gap-2.5">
        <AnimatedView
          style={dotStyles[0]}
          className="w-2.5 h-2.5 rounded-full bg-linear-to-r from-primary to-accent"
        />
        <AnimatedView
          style={dotStyles[1]}
          className="w-2.5 h-2.5 rounded-full bg-linear-to-r from-primary to-accent"
        />
        <AnimatedView
          style={dotStyles[2]}
          className="w-2.5 h-2.5 rounded-full bg-linear-to-r from-primary to-accent"
        />
        <AnimatedView
          style={dotStyles[3]}
          className="w-2.5 h-2.5 rounded-full bg-linear-to-r from-primary to-accent"
        />
      </AnimatedView>
    </div>
  );
}
