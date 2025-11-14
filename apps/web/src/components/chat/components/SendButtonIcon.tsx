/**
 * Send Button Icon Component
 *
 * Animated send button icon with spring animation using Framer Motion
 */

'use client';
import { motion, useAnimationControls } from 'framer-motion';
import { useEffect } from 'react';
import { PaperPlaneRight } from '@phosphor-icons/react';
import { springConfigs } from '@/effects/framer-motion/variants';
import { useUIConfig } from "@/hooks/use-ui-config";

export interface SendButtonIconProps {
  isActive?: boolean;
}

export function SendButtonIcon({ isActive = false }: SendButtonIconProps): JSX.Element {
  const _uiConfig = useUIConfig();
  const controls = useAnimationControls();

  useEffect(() => {
    if (isActive) {
      void controls.start({
        x: 4,
        scale: 1.1,
        transition: springConfigs.bouncy,
      });

      const timeout = setTimeout(() => {
        void controls.start({
          x: 0,
          scale: 1,
          transition: springConfigs.smooth,
        });
      }, 150);

      return () => {
        clearTimeout(timeout);
      };
    }
    return undefined;
  }, [isActive, controls]);

  return (
    <motion.div
      animate={controls}
      initial={{ x: 0, scale: 1 }}
      aria-hidden="true"
    >
      <PaperPlaneRight size={20} weight="fill" />
    </motion.div>
  );
}
