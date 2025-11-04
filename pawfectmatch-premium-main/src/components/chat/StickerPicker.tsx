import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MagnifyingGlass, X, Crown, Clock } from '@phosphor-icons/react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { useStorage } from '@/hooks/useStorage'
import {
  STICKER_CATEGORIES,
  STICKER_LIBRARY,
  getStickersByCategory,
  searchStickers,
  getPremiumStickers,
  getRecentStickers,
  getAnimationClass,
  type Sticker
} from '@/lib/sticker-library'
import { haptics } from '@/lib/haptics'
import { cn } from '@/lib/utils'

interface StickerPickerProps {
  onSelectSticker: (sticker: Sticker) => void
  onClose: () => void
}

export function StickerPicker({ onSelectSticker, onClose }: StickerPickerProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [recentStickerIds, setRecentStickerIds] = useStorage<string[]>('recent-stickers', [])
  const [hoveredSticker, setHoveredSticker] = useState<string | null>(null)

  const displayedStickers = useMemo(() => {
    if (searchQuery.trim()) {
      return searchStickers(searchQuery)
    }
    
    if (selectedCategory === 'all') {
      return STICKER_LIBRARY
    }
    
    if (selectedCategory === 'recent') {
      return getRecentStickers(recentStickerIds || [])
    }
    
    if (selectedCategory === 'premium') {
      return getPremiumStickers()
    }
    
    return getStickersByCategory(selectedCategory)
  }, [searchQuery, selectedCategory, recentStickerIds])

  const handleStickerClick = (sticker: Sticker) => {
    haptics.impact('medium')
    
    const updatedRecent = [
      sticker.id,
      ...(recentStickerIds || []).filter(id => id !== sticker.id)
    ].slice(0, 24)
    setRecentStickerIds(updatedRecent)
    
    onSelectSticker(sticker)
  }

  const handleCategoryChange = (categoryId: string) => {
    haptics.impact('light')
    setSelectedCategory(categoryId)
    setSearchQuery('')
  }

  const recentCount = recentStickerIds?.length || 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed inset-x-0 bottom-0 z-50 max-h-[70vh] bg-card/95 backdrop-blur-2xl border-t border-border/40 shadow-2xl sm:bottom-20 sm:left-auto sm:right-4 sm:w-[420px] sm:rounded-2xl sm:border sm:max-h-[600px]"
    >
      <div className="flex flex-col h-full max-h-[70vh] sm:max-h-[600px]">
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
            onClick={() => {
              haptics.impact('light')
              onClose()
            }}
            className="rounded-full"
          >
            <X size={20} />
          </Button>
        </div>

        <div className="px-4 pt-4">
          <div className="relative">
            <MagnifyingGlass 
              size={18} 
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" 
            />
            <Input
              type="text"
              placeholder="Search stickers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {!searchQuery && (
          <div className="px-4 py-3 border-b border-border/40">
            <ScrollArea className="w-full">
              <div className="flex gap-2 pb-2">
                <Button
                  variant={selectedCategory === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleCategoryChange('all')}
                  className="whitespace-nowrap rounded-full"
                >
                  All
                </Button>
                {recentCount > 0 && (
                  <Button
                    variant={selectedCategory === 'recent' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleCategoryChange('recent')}
                    className="whitespace-nowrap rounded-full gap-1.5"
                  >
                    <Clock size={14} weight="bold" />
                    Recent
                  </Button>
                )}
                <Button
                  variant={selectedCategory === 'premium' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleCategoryChange('premium')}
                  className="whitespace-nowrap rounded-full gap-1.5"
                >
                  <Crown size={14} weight="fill" />
                  Premium
                </Button>
                {STICKER_CATEGORIES.map(category => (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleCategoryChange(category.id)}
                    className="whitespace-nowrap rounded-full gap-1.5"
                  >
                    <span>{category.emoji}</span>
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
                <div className="text-6xl mb-4 opacity-50">🔍</div>
                <p className="text-muted-foreground">
                  {searchQuery ? 'No stickers found' : 'No stickers in this category'}
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-6 sm:grid-cols-7 gap-2 py-4"
              >
                {displayedStickers.map((sticker, index) => (
                  <motion.button
                    key={sticker.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.01 }}
                    onClick={() => handleStickerClick(sticker)}
                    onMouseEnter={() => setHoveredSticker(sticker.id)}
                    onMouseLeave={() => setHoveredSticker(null)}
                    className={cn(
                      "relative aspect-square rounded-xl flex items-center justify-center text-4xl hover:bg-muted/50 active:scale-95 transition-all duration-200",
                      hoveredSticker === sticker.id && "bg-muted/50"
                    )}
                    title={sticker.label}
                  >
                    <motion.span
                      className={cn(
                        "select-none",
                        hoveredSticker === sticker.id && sticker.animation && getAnimationClass(sticker.animation)
                      )}
                      animate={
                        hoveredSticker === sticker.id
                          ? { scale: [1, 1.2, 1] }
                          : { scale: 1 }
                      }
                      transition={{ duration: 0.3 }}
                    >
                      {sticker.emoji}
                    </motion.span>
                    {sticker.premium && (
                      <Crown
                        size={12}
                        weight="fill"
                        className="absolute top-0.5 right-0.5 text-accent"
                      />
                    )}
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </ScrollArea>
      </div>
    </motion.div>
  )
}
