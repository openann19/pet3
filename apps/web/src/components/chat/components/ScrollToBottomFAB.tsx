/**
 * Scroll to Bottom FAB Component
 *
 * Floating action button to scroll to bottom
 * Uses Framer Motion for animations
 */

'use client';
import { motion, AnimatePresence, type MotionStyle } from 'framer-motion';
import { PaperPlaneRight } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { useUIConfig } from "@/hooks/use-ui-config";
import { fadeVariants, scaleVariants, getVariantsWithReducedMotion } from '@/effects/framer-motion/variants';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import type { CSSProperties } from 'react';

export interface ScrollToBottomFABProps {
  isVisible: boolean;
  badgeCount?: number;
  animatedStyle?: MotionStyle | CSSProperties;
  badgeAnimatedStyle?: MotionStyle | CSSProperties;
  onClick: () => void;
}

export function ScrollToBottomFAB({
  isVisible,
  badgeCount = 0,
  animatedStyle,
  badgeAnimatedStyle,
  onClick,
}: ScrollToBottomFABProps): React.ReactElement | null {
  const _uiConfig = useUIConfig();
  const prefersReducedMotion = useReducedMotion();
  
  const containerVariants = getVariantsWithReducedMotion(fadeVariants, prefersReducedMotion);
  const badgeVariants = getVariantsWithReducedMotion(scaleVariants, prefersReducedMotion);

  if (!isVisible) {
    return null;
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          style={animatedStyle}
          className="fixed bottom-24 right-6 z-40"
        >
          <Button
            size="icon"
            className="rounded-full shadow-lg bg-primary hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            onClick={onClick}
            aria-label="Scroll to bottom"
          >
            <PaperPlaneRight size={20} weight="fill" aria-hidden="true" />
            {badgeCount > 0 && (
              <motion.div
                variants={badgeVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                style={badgeAnimatedStyle}
                className="absolute -top-1 -right-1 bg-accent text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
                aria-label={`${badgeCount} new messages`}
              >
                <span>{badgeCount}</span>
              </motion.div>
            )}
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
