'use client';
import { motion } from 'framer-motion';

import { PaperPlaneRight } from '@phosphor-icons/react';

export interface StickerButtonProps {
  sticker: { id: string; emoji: string };
  onSelect: (emoji: string) => void;
}

export function StickerButton({ sticker, onSelect }: StickerButtonProps): JSX.Element {
  return (
    <motion.div
      onClick={() => {
        onSelect(sticker.emoji);
      }}
      className="text-3xl p-2 rounded-xl cursor-pointer"
      whileHover={{ 
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        scale: 1.2,
      }}
      whileTap={{ scale: 1.1 }}
      transition={{ type: 'spring', damping: 15, stiffness: 400 }}
    >
      {sticker.emoji}
    </motion.div>
  );
}

export interface ReactionButtonProps {
  emoji: string;
  onClick?: () => void;
}

export function ReactionButton({ emoji, onClick }: ReactionButtonProps): JSX.Element {
  return (
    <motion.div
      whileHover={{ 
        scale: 1.2,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
      }}
      whileTap={{ scale: 1.1 }}
      onClick={onClick}
      className="text-2xl p-2 rounded-xl cursor-pointer"
      transition={{ type: 'spring', damping: 15, stiffness: 400 }}
    >
      {emoji}
    </motion.div>
  );
}

export function SendButtonIcon(): JSX.Element {
  return (
    <motion.div
      whileHover={{ x: 5 }}
      whileTap={{ scale: 0.9 }}
      transition={{ type: 'spring', damping: 25, stiffness: 400 }}
    >
      <PaperPlaneRight size={20} weight="fill" />
    </motion.div>
  );
}
