'use client';
import { motion, useMotionValue, animate } from 'framer-motion';
import { useCallback, useEffect, useState, memo } from 'react';
import { springConfigs, motionDurations } from '@/effects/framer-motion/variants';
import { haptics } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import { ArrowUUpLeft } from '@phosphor-icons/react';
import { useUIConfig } from "@/hooks/use-ui-config";
import { useReducedMotion } from '@/hooks/useReducedMotion';

export interface UndoDeleteChipProps {
  onUndo: () => void;
  duration?: number;
  className?: string;
}

export function UndoDeleteChip({ onUndo, duration = 5000, className }: UndoDeleteChipProps) {
  const _uiConfig = useUIConfig();
  const reducedMotion = useReducedMotion();
  const [isVisible, setIsVisible] = useState(true);
  const translateX = useMotionValue(-100);
  const opacity = useMotionValue(0);
  const scale = useMotionValue(0.8);

  const handleUndo = useCallback(() => {
    haptics.selection();
    setIsVisible(false);
    onUndo();
  }, [onUndo]);

  useEffect(() => {
    if (reducedMotion) {
      if (isVisible) {
        translateX.set(0);
        opacity.set(1);
        scale.set(1);
      } else {
        translateX.set(-100);
        opacity.set(0);
        scale.set(0.8);
      }
      return;
    }
    
    if (isVisible) {
      void animate(translateX, 0, {
        type: 'spring',
        damping: springConfigs.bouncy.damping,
        stiffness: springConfigs.bouncy.stiffness,
      });
      void animate(opacity, 1, {
        duration: motionDurations.fast,
        ease: [0.2, 0, 0, 1],
      });
      void animate(scale, 1, {
        type: 'spring',
        damping: springConfigs.bouncy.damping,
        stiffness: springConfigs.bouncy.stiffness,
      });
    } else {
      void animate(translateX, -100, {
        duration: motionDurations.fast,
        ease: [0.2, 0, 0, 1],
      });
      void animate(opacity, 0, {
        duration: motionDurations.fast,
        ease: [0.2, 0, 0, 1],
      });
      void animate(scale, 0.8, {
        duration: motionDurations.fast,
        ease: [0.2, 0, 0, 1],
      });
    }
  }, [isVisible, translateX, opacity, scale, reducedMotion]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  if (!isVisible) {
    return null;
  }

  return (
    <motion.div
      style={{
        x: translateX,
        scale,
        opacity,
      }}
      className={cn(
        'fixed bottom-20 left-1/2 -translate-x-1/2 z-50',
        'bg-card border border-border rounded-full shadow-lg',
        'px-4 py-2 flex items-center gap-2',
        'transform-gpu',
        className
      )}
    >
      <button
        onClick={handleUndo}
        className={cn(
          'flex items-center gap-2',
          'text-sm font-medium',
          'hover:opacity-80 transition-opacity'
        )}
      >
        <ArrowUUpLeft size={16} className="text-foreground" />
        <span className="text-foreground">Undo delete</span>
      </button>
    </motion.div>
  );
}

// Memoize to prevent unnecessary re-renders
export const MemoizedUndoDeleteChip = memo(UndoDeleteChip);
