import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, MagnifyingGlass, Sliders } from '@phosphor-icons/react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { 
  STORY_FILTERS, 
  FILTER_CATEGORIES,
  getFiltersByCategory,
  type StoryFilter 
} from '@/lib/story-templates'
import { cn } from '@/lib/utils'

interface StoryFilterSelectorProps {
  selectedFilter: StoryFilter
  onSelectFilter: (filter: StoryFilter) => void
  mediaPreview?: string
  intensity?: number
  onIntensityChange?: (intensity: number) => void
}

export default function StoryFilterSelector({ 
  selectedFilter, 
  onSelectFilter,
  mediaPreview,
  intensity = 1,
  onIntensityChange
}: StoryFilterSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [localIntensity, setLocalIntensity] = useState(intensity)
  const previewRefs = useRef<Map<string, HTMLImageElement>>(new Map())

  const filteredFilters = getFiltersByCategory(selectedCategory).filter(filter =>
    filter.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  useEffect(() => {
    previewRefs.current.forEach((img, filterId) => {
      const filter = STORY_FILTERS.find(f => f.id === filterId)
      if (filter && img) {
        img.style.filter = filter.cssFilter
      }
    })
  }, [])

  const handleIntensityChange = (value: number[]) => {
    const newIntensity = value[0]
    setLocalIntensity(newIntensity)
    onIntensityChange?.(newIntensity)
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="relative">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input
            placeholder="Search filters..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <ScrollArea className="w-full">
          <div className="flex gap-2 pb-2">
            {FILTER_CATEGORIES.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className={cn(
                  "whitespace-nowrap",
                  selectedCategory === category.id && "bg-gradient-to-r from-primary to-accent"
                )}
              >
                <span className="mr-1.5">{category.icon}</span>
                {category.name}
              </Button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {selectedFilter.id !== 'filter-none' && onIntensityChange && (
        <div className="glass-effect p-4 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-semibold flex items-center gap-2">
              <Sliders size={16} />
              Filter Intensity
            </Label>
            <span className="text-sm text-muted-foreground">
              {Math.round(localIntensity * 100)}%
            </span>
          </div>
          <Slider
            value={[localIntensity]}
            onValueChange={handleIntensityChange}
            min={0}
            max={1}
            step={0.1}
            className="w-full"
          />
        </div>
      )}

      <ScrollArea className="h-[280px]">
        <div className="grid grid-cols-3 gap-3 pr-4">
          <AnimatePresence mode="popLayout">
            {filteredFilters.map((filter, index) => (
              <motion.button
                key={filter.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ 
                  duration: 0.2,
                  delay: index * 0.03
                }}
                onClick={() => onSelectFilter(filter)}
                className={cn(
                  "relative aspect-square rounded-xl overflow-hidden border-2 transition-all duration-200 bg-muted",
                  selectedFilter.id === filter.id
                    ? 'border-primary ring-2 ring-primary/20'
                    : 'border-border hover:border-primary/50'
                )}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {mediaPreview ? (
                  <img
                    ref={(el) => {
                      if (el) previewRefs.current.set(filter.id, el)
                    }}
                    src={mediaPreview}
                    alt={filter.name}
                    className="w-full h-full object-cover"
                    style={{ filter: filter.cssFilter }}
                  />
                ) : (
                  <div 
                    className="w-full h-full"
                    style={{
                      background: filter.id === 'filter-none' 
                        ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                        : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                      filter: filter.cssFilter
                    }}
                  />
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end">
                  <p className="text-[10px] font-semibold text-white px-2 pb-1.5 w-full text-center">
                    {filter.name}
                  </p>
                </div>

                {selectedFilter.id === filter.id && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center shadow-lg"
                  >
                    <Check size={12} weight="bold" className="text-white" />
                  </motion.div>
                )}
              </motion.button>
            ))}
          </AnimatePresence>
        </div>

        {filteredFilters.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <p className="text-muted-foreground text-sm">No filters found</p>
            <p className="text-xs text-muted-foreground mt-1">Try a different search or category</p>
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
