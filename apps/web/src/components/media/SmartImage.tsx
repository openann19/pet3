'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, animate } from 'framer-motion';
import { springConfigs, motionDurations } from '@/effects/framer-motion/variants';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useFeatureFlags } from '@/config/feature-flags';
import { cn } from '@/lib/utils';

export interface SmartImageProps {
  src: string;
  lqip?: string; // Low Quality Image Placeholder
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  onLoad?: () => void;
  onClick?: () => void;
}

/**
 * SmartImage Component
 *
 * Progressive image loading with LQIP, shimmer effect, and parallax reveal
 * Reduced motion → instant swap
 */
export function SmartImage({
  src,
  lqip,
  alt,
  className = '',
  width,
  height,
  onLoad,
  onClick,
}: SmartImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [showSharp, setShowSharp] = useState(false);
  const reducedMotion = useReducedMotion();
  const { enableSmartImage } = useFeatureFlags();
  const imgRef = useRef<HTMLImageElement>(null);

  const shimmerOpacity = useMotionValue(0.6);
  const imageOpacity = useMotionValue(0);
  const parallaxOffset = useMotionValue(0);

  useEffect(() => {
    if (!enableSmartImage) {
      return;
    }

    if (reducedMotion) {
      // Instant swap for reduced motion
      imageOpacity.set(1);
      parallaxOffset.set(0);
      return;
    }

    // Shimmer animation
    void animate(shimmerOpacity, 0.6, {
      duration: 0.6,
      ease: [0.2, 0, 0, 1],
    });

    if (isLoaded && showSharp) {
      void animate(imageOpacity, 1, {
        type: 'spring',
        damping: springConfigs.smooth.damping,
        stiffness: springConfigs.smooth.stiffness,
      });
      void animate(parallaxOffset, 0, {
        type: 'spring',
        damping: springConfigs.smooth.damping,
        stiffness: springConfigs.smooth.stiffness,
      });
    }
  }, [
    isLoaded,
    showSharp,
    reducedMotion,
    enableSmartImage,
    imageOpacity,
    shimmerOpacity,
    parallaxOffset,
  ]);

  const handleLoad = () => {
    setIsLoaded(true);
    setTimeout(
      () => {
        setShowSharp(true);
        onLoad?.();
      },
      reducedMotion ? 0 : 30
    );
  };

  if (!enableSmartImage) {
    return (
      <img
        src={src}
        alt={alt}
        className={className}
        width={width}
        height={height}
        onLoad={onLoad}
      />
    );
  }

  return (
    <div className={cn('relative overflow-hidden', className)} style={{ width, height }}>
      {/* LQIP placeholder */}
      {lqip && !showSharp && (
        <img
          src={lqip}
          alt=""
          className="absolute inset-0 w-full h-full object-cover blur-sm"
          aria-hidden="true"
        />
      )}

      {/* Shimmer effect */}
      {!isLoaded && (
        <motion.div
          style={{ opacity: shimmerOpacity }}
          className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent animate-shimmer"
          aria-hidden="true"
        >
          <div />
        </motion.div>
      )}

      {/* Sharp image */}
      <motion.img
        ref={imgRef}
        src={src}
        alt={alt}
        className={cn(
          'w-full h-full object-cover transition-opacity',
          showSharp ? 'opacity-100' : 'opacity-0',
          onClick ? 'cursor-pointer' : ''
        )}
        style={{
          opacity: imageOpacity,
          y: parallaxOffset,
        }}
        width={width}
        height={height}
        onLoad={handleLoad}
        onClick={onClick}
        loading="lazy"
        decoding="async"
      />
    </div>
  );
}
