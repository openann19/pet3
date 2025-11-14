'use client';
import { motion, useMotionValue, animate } from 'framer-motion';

import { useState, useCallback, useEffect } from 'react';
import type { Sticker } from '@/lib/sticker-library';
import { cn } from '@/lib/utils';
import { useStickerAnimation } from '@/effects/reanimated/use-sticker-animation';
import { useHoverTap } from '@/effects/reanimated/use-hover-tap';
import { springConfigs } from '@/effects/framer-motion/variants';
import { useUIConfig } from "@/hooks/use-ui-config";
import { useReducedMotion } from '@/hooks/useReducedMotion';

export interface StickerMessageProps {
  sticker: Sticker;
  isOwn?: boolean;
  onHover?: () => void;
}

export function StickerMessage({ sticker, isOwn = false, onHover }: StickerMessageProps) {
    const _uiConfig = useUIConfig();
    const prefersReducedMotion = useReducedMotion();
    const [isHovered, setIsHovered] = useState(false);

  const entryOpacity = useMotionValue(0);
  const entryScale = useMotionValue(0.5);

  const stickerAnimation = useStickerAnimation({
    animation: sticker.animation ?? undefined,
    enabled: isHovered && Boolean(sticker.animation) && !prefersReducedMotion,
  });

  const hoverTap = useHoverTap({
    hoverScale: 1.1,
    tapScale: 0.95,
  });

  useEffect(() => {
    if (!prefersReducedMotion) {
      void animate(entryOpacity, 1, springConfigs.smooth);
      void animate(entryScale, 1, springConfigs.bouncy);
    } else {
      entryOpacity.set(1);
      entryScale.set(1);
    }
  }, [entryOpacity, entryScale, prefersReducedMotion]);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
    if (sticker.animation) {
      stickerAnimation.trigger();
    }
    hoverTap.handleMouseEnter();
    onHover?.();
  }, [sticker.animation, stickerAnimation, hoverTap, onHover]);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    stickerAnimation.reset();
    hoverTap.handleMouseLeave();
  }, [stickerAnimation, hoverTap]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={prefersReducedMotion ? { duration: 0 } : springConfigs.bouncy}
      className={cn('flex items-center', isOwn ? 'justify-end' : 'justify-start')}
    >
      <motion.div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={hoverTap.handlePress ?? undefined}
        style={{
          scale: hoverTap.scale,
          ...(stickerAnimation.animatedStyle.transform && {
            rotate: stickerAnimation.animatedStyle.transform.includes('rotate') 
              ? stickerAnimation.animatedStyle.transform.match(/rotate\(([^)]+)\)/)?.[1] 
              : undefined,
            x: stickerAnimation.animatedStyle.transform.includes('translateX')
              ? stickerAnimation.animatedStyle.transform.match(/translateX\(([^)]+)\)/)?.[1]?.replace('px', '')
              : undefined,
            y: stickerAnimation.animatedStyle.transform.includes('translateY')
              ? stickerAnimation.animatedStyle.transform.match(/translateY\(([^)]+)\)/)?.[1]?.replace('px', '')
              : undefined,
          }),
        }}
        whileHover={prefersReducedMotion ? {} : { scale: 1.1 }}
        whileTap={prefersReducedMotion ? {} : { scale: 0.95 }}
        transition={springConfigs.smooth}
        className={cn(
          'relative cursor-default select-none sticker-message p-2 rounded-2xl',
          isHovered && 'bg-muted/30'
        )}
      >
        <span className="block">{sticker.emoji}</span>
      </motion.div>
    </motion.div>
  );
}
