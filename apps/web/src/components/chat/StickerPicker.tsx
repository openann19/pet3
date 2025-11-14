'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useMemo, useCallback } from 'react';
import { MagnifyingGlass, X, Crown, Clock } from '@phosphor-icons/react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useStorage } from '@/hooks/use-storage';
import {
  STICKER_CATEGORIES,
  STICKER_LIBRARY,
  getStickersByCategory,
  searchStickers,
  getPremiumStickers,
  getRecentStickers,
  type Sticker,
} from '@/lib/sticker-library';
import { haptics } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import { useUIConfig } from "@/hooks/use-ui-config";
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { 
  slideUpVariants, 
  fadeVariants, 
  staggerContainerVariants, 
  staggerItemVariants,
  getVariantsWithReducedMotion,
  springConfigs,
} from '@/effects/framer-motion/variants';

interface StickerPickerProps {
  onSelectSticker: (sticker: Sticker) => void;
  onClose: () => void;
}

export function StickerPicker({ onSelectSticker, onClose }: StickerPickerProps) {
  const _uiConfig = useUIConfig();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [recentStickerIds, setRecentStickerIds] = useStorage<string[]>('recent-stickers', []);
  const [hoveredSticker, setHoveredSticker] = useState<string | null>(null);
  const prefersReducedMotion = useReducedMotion();

  const displayedStickers = useMemo(() => {
    if (searchQuery.trim()) {
      return searchStickers(searchQuery);
    }

    if (selectedCategory === 'all') {
      return STICKER_LIBRARY;
    }

    if (selectedCategory === 'recent') {
      return getRecentStickers(recentStickerIds || []);
    }

    if (selectedCategory === 'premium') {
      return getPremiumStickers();
    }

    return getStickersByCategory(selectedCategory);
  }, [searchQuery, selectedCategory, recentStickerIds]);

  const handleStickerClick = (sticker: Sticker) => {
    haptics.impact('medium');

    const updatedRecent = [
      sticker.id,
      ...(recentStickerIds || []).filter((id) => id !== sticker.id),
    ].slice(0, 24);
    setRecentStickerIds(updatedRecent);

    onSelectSticker(sticker);
  };

  const handleCategoryChange = useCallback((categoryId: string) => {
    haptics.impact('light');
    setSelectedCategory(categoryId);
    setSearchQuery('');
  }, []);

  const recentCount = recentStickerIds?.length || 0;

  const containerVariants = getVariantsWithReducedMotion(slideUpVariants, prefersReducedMotion);
  const contentVariants = getVariantsWithReducedMotion(fadeVariants, prefersReducedMotion);
  const staggerContainer = getVariantsWithReducedMotion(staggerContainerVariants, prefersReducedMotion);
  const staggerItem = getVariantsWithReducedMotion(staggerItemVariants, prefersReducedMotion);

  return (
    <AnimatePresence>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      className="fixed inset-x-0 bottom-0 z-50 max-h-[70vh] bg-card/95 backdrop-blur-2xl border-t border-border/40 shadow-2xl sm:bottom-20 sm:left-auto sm:right-4 sm:w-105 sm:rounded-2xl sm:border sm:max-h-150"
      role="dialog"
      aria-modal="true"
      aria-label="Sticker picker"
    >
      <div className="flex flex-col h-full max-h-[70vh] sm:max-h-150">
        <div className="flex items-center justify-between p-4 border-b border-border/40">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">Stickers</h3>
            {displayedStickers.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {displayedStickers.length}
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full"
            aria-label="Close sticker picker"
          >
            <X size={20} aria-hidden="true" />
          </Button>
        </div>

        <motion.div
          variants={contentVariants}
          initial="hidden"
          animate="visible"
          className="px-4 pt-4"
        >
          <div className="relative">
            <MagnifyingGlass
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="text"
              placeholder="Search stickers..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); }}
              className="pl-10 pr-10"
              aria-label="Search stickers"
            />
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(''); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Clear search"
              >
                <X size={16} aria-hidden="true" />
              </button>
            )}
          </div>
        </motion.div>

        {!searchQuery && (
          <div className="px-4 py-3 border-b border-border/40">
            <ScrollArea className="w-full">
              <div className="flex gap-2 pb-2">
                <Button
                  variant={selectedCategory === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => { handleCategoryChange('all'); }}
                  className="whitespace-nowrap rounded-full"
                >
                  All
                </Button>
                {recentCount > 0 && (
                  <Button
                    variant={selectedCategory === 'recent' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => { handleCategoryChange('recent'); }}
                    className="whitespace-nowrap rounded-full gap-1.5"
                  >
                    <Clock size={14} weight="bold" aria-hidden="true" />
                    Recent
                  </Button>
                )}
                <Button
                  variant={selectedCategory === 'premium' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => { handleCategoryChange('premium'); }}
                  className="whitespace-nowrap rounded-full gap-1.5"
                >
                  <Crown size={14} weight="fill" aria-hidden="true" />
                  Premium
                </Button>
                {STICKER_CATEGORIES.map((category) => (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => { handleCategoryChange(category.id); }}
                    className="whitespace-nowrap rounded-full gap-1.5"
                  >
                    <span aria-hidden="true">{category.emoji}</span>
                    <span className="hidden sm:inline">{category.name}</span>
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        <ScrollArea className="flex-1 px-4">
          <AnimatePresence mode="wait">
            {displayedStickers.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-12 text-center"
              >
                <div className="text-6xl mb-4 opacity-50" aria-hidden="true">🔍</div>
                <p className="text-muted-foreground">
                  {searchQuery ? 'No stickers found' : 'No stickers in this category'}
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="stickers"
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-6 sm:grid-cols-7 gap-2 py-4"
              >
                {displayedStickers.map((sticker) => (
                  <StickerButton
                    key={sticker.id}
                    sticker={sticker}
                    isHovered={hoveredSticker === sticker.id}
                    onHover={() => { setHoveredSticker(sticker.id); }}
                    onLeave={() => { setHoveredSticker(null); }}
                    onClick={() => { handleStickerClick(sticker); }}
                    variants={staggerItem}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </ScrollArea>
      </div>
    </motion.div>
    </AnimatePresence>
  );
}

interface StickerButtonProps {
  sticker: Sticker;
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
  onClick: () => void;
  variants: typeof staggerItemVariants;
}

function StickerButton({
  sticker,
  isHovered,
  onHover,
  onLeave,
  onClick,
  variants,
}: StickerButtonProps) {
  return (
    <motion.button
      variants={variants}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      transition={springConfigs.smooth}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onClick={onClick}
      className={cn(
        'relative aspect-square rounded-xl flex items-center justify-center text-4xl hover:bg-muted/50 cursor-pointer',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        isHovered && 'bg-muted/50'
      )}
      title={sticker.label}
      aria-label={sticker.label}
    >
      <span className="select-none" aria-hidden="true">{sticker.emoji}</span>
      {sticker.premium && (
        <Crown 
          size={12} 
          weight="fill" 
          className="absolute top-0.5 right-0.5 text-accent" 
          aria-label="Premium sticker"
        />
      )}
    </motion.button>
  );
}
