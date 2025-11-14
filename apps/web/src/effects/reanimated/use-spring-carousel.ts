/**
 * Spring Carousel Animation
 * Smooth carousel with spring physics and snap points
 */

import { useCallback, useState } from 'react';
import { useMotionValue, animate, useTransform, MotionValue } from 'framer-motion';

export interface UseSpringCarouselOptions {
  itemCount: number;
  itemWidth: number;
  gap?: number;
  damping?: number;
  stiffness?: number;
  onIndexChange?: (index: number) => void;
}

export function useSpringCarousel(options: UseSpringCarouselOptions) {
  const { itemCount, itemWidth, gap = 16, damping = 20, stiffness = 120, onIndexChange } = options;

  const translateX = useMotionValue(0);
  const [currentIndex, setCurrentIndex] = useState(0);

  const slideWidth = itemWidth + gap;

  const goToIndex = useCallback(
    (index: number) => {
      const clampedIndex = Math.max(0, Math.min(itemCount - 1, index));
      const targetX = -clampedIndex * slideWidth;
      animate(translateX, targetX, { type: 'spring', damping, stiffness });
      setCurrentIndex(clampedIndex);
      if (onIndexChange) {
        onIndexChange(clampedIndex);
      }
    },
    [itemCount, slideWidth, damping, stiffness, onIndexChange, translateX]
  );

  const next = useCallback(() => {
    if (currentIndex < itemCount - 1) {
      goToIndex(currentIndex + 1);
    }
  }, [currentIndex, itemCount, goToIndex]);

  const previous = useCallback(() => {
    if (currentIndex > 0) {
      goToIndex(currentIndex - 1);
    }
  }, [currentIndex, goToIndex]);

  const createItemStyle = useCallback(
    (itemIndex: number) => {
      const inputRange = [
        (itemIndex - 1) * -slideWidth,
        itemIndex * -slideWidth,
        (itemIndex + 1) * -slideWidth,
      ];
      const scale = useTransform(translateX, inputRange, [0.85, 1, 0.85]);
      const opacity = useTransform(translateX, inputRange, [0.6, 1, 0.6]);
      const rotateY = useTransform(translateX, inputRange, [20, 0, -20]);
      return {
        transform: [
          { translateX: itemIndex * slideWidth },
          { scale },
          { perspective: 1000 },
          { rotateY: rotateY },
        ],
        opacity,
      };
    },
    [slideWidth, translateX]
  );

  const containerStyle = {
    transform: [{ translateX }],
  };

  return {
    containerStyle,
    createItemStyle,
    currentIndex,
    goToIndex,
    next,
    previous,
    canGoNext: currentIndex < itemCount - 1,
    canGoPrevious: currentIndex > 0,
  };
}
