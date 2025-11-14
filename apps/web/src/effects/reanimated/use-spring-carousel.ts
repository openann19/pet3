/**
 * Spring Carousel Animation
 * Smooth carousel with spring physics and snap points
 */

import { useMotionValue, animate, useTransform, type MotionValue } from 'framer-motion';
import { useCallback, useState, useMemo } from 'react';
import { isTruthy } from '@petspark/shared';
import { useMotionStyle } from './use-motion-style';
import type { CSSProperties } from 'react';

export interface UseSpringCarouselOptions {
  itemCount: number;
  itemWidth: number;
  gap?: number;
  damping?: number;
  stiffness?: number;
  onIndexChange?: (index: number) => void;
}

export interface UseSpringCarouselReturn {
  containerStyle: CSSProperties;
  getItemStyle: (itemIndex: number) => CSSProperties;
  currentIndex: number;
  goToIndex: (index: number) => void;
  next: () => void;
  previous: () => void;
  canGoNext: boolean;
  canGoPrevious: boolean;
  translateX: MotionValue<number>;
}

export function useSpringCarousel(options: UseSpringCarouselOptions): UseSpringCarouselReturn {
  const { itemCount, itemWidth, gap = 16, damping = 20, stiffness = 120, onIndexChange } = options;

  const translateX = useMotionValue(0);
  const [currentIndex, setCurrentIndex] = useState(0);

  const slideWidth = itemWidth + gap;

  const goToIndex = useCallback(
    (index: number) => {
      const clampedIndex = Math.max(0, Math.min(itemCount - 1, index));
      const targetX = -clampedIndex * slideWidth;

      void animate(translateX, targetX, {
        type: 'spring',
        damping,
        stiffness,
      });

      setCurrentIndex(clampedIndex);
      if (isTruthy(onIndexChange)) {
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

  // Create transforms for all items at top level
  const itemTransforms = useMemo(() => {
    return Array.from({ length: itemCount }, (_, itemIndex) => {
      const inputRange = [
        (itemIndex - 1) * -slideWidth,
        itemIndex * -slideWidth,
        (itemIndex + 1) * -slideWidth,
      ];

      return {
        scale: useTransform(translateX, inputRange, [0.85, 1, 0.85]),
        opacity: useTransform(translateX, inputRange, [0.6, 1, 0.6]),
        rotateY: useTransform(translateX, inputRange, [20, 0, -20]),
      };
    });
  }, [itemCount, slideWidth, translateX]);

  // Create style getter function
  const getItemStyle = useCallback(
    (itemIndex: number): CSSProperties => {
      if (itemIndex < 0 || itemIndex >= itemCount) {
        return {};
      }

      const transforms = itemTransforms[itemIndex];
      if (!transforms) {
        return {};
      }

      return useMotionStyle(() => {
        return {
          transform: [
            { translateX: itemIndex * slideWidth },
            { scale: transforms.scale.get() },
            { perspective: 1000 },
            { rotateY: `${transforms.rotateY.get()}deg` },
          ],
          opacity: transforms.opacity.get(),
        };
      });
    },
    [itemTransforms, slideWidth]
  );

  const containerStyle = useMotionStyle(() => ({
    transform: [{ translateX: translateX.get() }],
  }));

  return {
    containerStyle,
    getItemStyle,
    currentIndex,
    goToIndex,
    next,
    previous,
    canGoNext: currentIndex < itemCount - 1,
    canGoPrevious: currentIndex > 0,
    translateX,
  };
}
