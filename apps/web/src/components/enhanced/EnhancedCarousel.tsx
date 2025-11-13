import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, useMotionValue, animate, useTransform } from 'framer-motion';
import { springConfigs, motionDurations } from '@/effects/framer-motion/variants';
import { CaretLeft, CaretRight } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { haptics } from '@/lib/haptics';
import { getTypographyClasses, getSpacingClassesFromConfig } from '@/lib/typography';
import { usePrefersReducedMotion } from '@/utils/reduced-motion';

interface EnhancedCarouselProps {
  items: React.ReactNode[];
  className?: string;
  autoPlay?: boolean;
  autoPlayInterval?: number;
  showControls?: boolean;
  showIndicators?: boolean;
  loop?: boolean;
  onSlideChange?: (index: number) => void;
}

export function EnhancedCarousel({
  items,
  className,
  autoPlay = false,
  autoPlayInterval = 5000,
  showControls = true,
  showIndicators = true,
  loop = true,
  onSlideChange,
}: EnhancedCarouselProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<'left' | 'right'>('right');
  const autoPlayRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const itemCount = items.length;

  const goToSlide = (index: number, dir: 'left' | 'right' = 'right') => {
    if (index === currentIndex) return;

    haptics.impact('light');
    setDirection(dir);
    setCurrentIndex(index);
    onSlideChange?.(index);
  };

  const goToNext = useCallback(() => {
    setCurrentIndex((prevIndex) => {
      const nextIndex = prevIndex === itemCount - 1 ? (loop ? 0 : prevIndex) : prevIndex + 1;
      if (nextIndex !== prevIndex) {
        setDirection('right');
        onSlideChange?.(nextIndex);
        haptics.impact('light');
      }
      return nextIndex;
    });
  }, [itemCount, loop, onSlideChange]);

  const goToPrev = useCallback(() => {
    setCurrentIndex((prevIndex) => {
      const prevIndexValue = prevIndex === 0 ? (loop ? itemCount - 1 : prevIndex) : prevIndex - 1;
      if (prevIndexValue !== prevIndex) {
        setDirection('left');
        onSlideChange?.(prevIndexValue);
        haptics.impact('light');
      }
      return prevIndexValue;
    });
  }, [itemCount, loop, onSlideChange]);

  const resetAutoPlay = useCallback(() => {
    if (autoPlay && autoPlayRef.current) {
      clearInterval(autoPlayRef.current);
      autoPlayRef.current = setInterval(() => {
        goToNext();
      }, autoPlayInterval);
    }
  }, [autoPlay, autoPlayInterval, goToNext]);

  const translateX = useMotionValue(0);
  const opacity = useMotionValue(1);
  const dragX = useMotionValue(0);

  useEffect(() => {
    if (prefersReducedMotion) {
      translateX.set(0);
      opacity.set(1);
      dragX.set(0);
      return;
    }

    void animate(translateX, 0, {
      ...springConfigs.smooth,
      duration: motionDurations.smooth,
    });
    void animate(opacity, 1, {
      duration: motionDurations.fast,
    });
    dragX.set(0);
  }, [currentIndex, direction, translateX, opacity, dragX, prefersReducedMotion]);


  const x = useTransform(translateX, (tx) => tx + dragX.get());

  if (itemCount === 0) {
    return null;
  }

  return (
    <div 
      className={cn('relative overflow-hidden rounded-xl', className)}
      role="region"
      aria-label="Image carousel"
      aria-roledescription="carousel"
    >
      <div className="relative aspect-4/3 bg-muted" aria-live="polite" aria-atomic="true">
        <motion.div
          key={currentIndex}
          style={{ x, opacity }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDrag={(_, info) => {
            dragX.set(info.offset.x);
          }}
          onDragEnd={(_, info) => {
            const swipeThreshold = 50;
            if (Math.abs(info.offset.x) > swipeThreshold) {
              if (info.offset.x > 0) {
                goToPrev();
              } else {
                goToNext();
              }
            }
            dragX.set(0);
          }}
          onClick={resetAutoPlay}
          className="absolute inset-0 cursor-grab active:cursor-grabbing"
          transition={prefersReducedMotion ? { duration: 0 } : springConfigs.smooth}
          role="group"
          aria-roledescription="slide"
          aria-label={`Slide ${currentIndex + 1} of ${itemCount}`}
          id={`carousel-slide-${currentIndex}`}
        >
          {items[currentIndex]}
        </motion.div>
      </div>

      {showControls && itemCount > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              goToPrev();
              resetAutoPlay();
            }}
            disabled={!loop && currentIndex === 0}
            className={cn(
              'absolute left-2 top-1/2 -translate-y-1/2 z-10 rounded-full bg-background/80 backdrop-blur-sm shadow-lg hover:bg-background/95 disabled:opacity-0',
              'transition-all duration-200 hover:scale-110 active:scale-95'
            )}
            aria-label="Previous slide"
          >
            <CaretLeft size={20} weight="bold" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              goToNext();
              resetAutoPlay();
            }}
            disabled={!loop && currentIndex === itemCount - 1}
            className={cn(
              'absolute right-2 top-1/2 -translate-y-1/2 z-10 rounded-full bg-background/80 backdrop-blur-sm shadow-lg hover:bg-background/95 disabled:opacity-0',
              'transition-all duration-200 hover:scale-110 active:scale-95'
            )}
            aria-label="Next slide"
          >
            <CaretRight size={20} weight="bold" />
          </Button>
        </>
      )}

      {showIndicators && itemCount > 1 && (
        <div 
          className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex gap-2"
          role="tablist"
          aria-label="Slide indicators"
        >
          {items.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                goToSlide(index, index > currentIndex ? 'right' : 'left');
                resetAutoPlay();
              }}
              className={cn(
                'h-2 rounded-full transition-all duration-300',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                index === currentIndex
                  ? 'w-8 bg-primary shadow-lg shadow-primary/50'
                  : 'w-2 bg-background/60 hover:bg-background/80 backdrop-blur-sm'
              )}
              role="tab"
              aria-selected={index === currentIndex}
              aria-label={`Go to slide ${String(index + 1)}`}
              aria-controls={`carousel-slide-${index}`}
            />
          ))}
        </div>
      )}

      {itemCount > 1 && (
        <div className={cn('absolute top-3 right-3 z-10 rounded-full bg-background/80 backdrop-blur-sm shadow-lg', getTypographyClasses('caption'), getSpacingClassesFromConfig({ paddingX: 'md', paddingY: 'xs' }))}>
          {currentIndex + 1} / {itemCount}
        </div>
      )}
    </div>
  );
}
