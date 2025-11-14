'use client';

import {
  useMotionValue,
  animate,
  useTransform,
  type MotionValue,
} from 'framer-motion';
import { useCallback, useEffect } from 'react';
import { springConfigs, timingConfigs } from '@/effects/reanimated/transitions';
import { makeRng } from '@petspark/shared';
import { useMotionStyle } from './use-motion-style';
import type { CSSProperties } from 'react';

export type MediaType = 'image' | 'video' | 'voice';

export interface UseMediaBubbleOptions {
  type: MediaType;
  isLoaded?: boolean;
  isPlaying?: boolean;
  onZoom?: () => void;
  waveform?: number[];
}

export interface UseMediaBubbleReturn {
  imageOpacity: MotionValue<number>;
  imageScale: MotionValue<number>;
  zoomModalOpacity: MotionValue<number>;
  zoomModalScale: MotionValue<number>;
  waveformScales: MotionValue<number>[];
  imageStyle: CSSProperties;
  zoomModalStyle: CSSProperties;
  waveformStyles: CSSProperties[];
  handleImageLoad: () => void;
  handleImageTap: () => void;
  closeZoom: () => void;
}

const DEFAULT_IS_LOADED = false;
const DEFAULT_IS_PLAYING = false;

export function useMediaBubble(options: UseMediaBubbleOptions): UseMediaBubbleReturn {
  const {
    type,
    isLoaded = DEFAULT_IS_LOADED,
    isPlaying = DEFAULT_IS_PLAYING,
    onZoom,
    waveform = [],
  } = options;

  const imageOpacity = useMotionValue(0);
  const imageScale = useMotionValue(0.95);
  const zoomModalOpacity = useMotionValue(0);
  const zoomModalScale = useMotionValue(0.9);

  const waveformScales = Array.from({ length: 20 }, () => useMotionValue(0.3));

  useEffect(() => {
    if (isLoaded && type === 'image') {
      void animate(imageOpacity, 1, {
        ...springConfigs.smooth,
      });
      void animate(imageScale, 1, {
        ...springConfigs.bouncy,
      });
    }
  }, [isLoaded, type, imageOpacity, imageScale]);

  useEffect(() => {
    if (type === 'voice') {
      // Create seeded RNG for deterministic waveform variation
      const seed = Date.now() + waveformScales.length;
      const rng = makeRng(seed);

      waveformScales.forEach((scale, index) => {
        if (isPlaying) {
          const baseValue = waveform[index] ?? 0.3;
          const variation = rng() * 0.3;
          void animate(scale, [baseValue + variation, Math.max(0.2, baseValue - variation), baseValue], {
            duration: 0.6, // 200ms * 3 = 600ms
            ease: 'easeInOut',
            repeat: Infinity,
            times: [0, 0.33, 0.66, 1],
          });
        } else {
          const baseValue = waveform[index] ?? 0.3;
          void animate(scale, baseValue, {
            duration: timingConfigs.fast.duration,
            ease: timingConfigs.fast.ease as string,
          });
        }
      });
    }
  }, [isPlaying, type, waveform, waveformScales]);

  const handleImageLoad = useCallback(() => {
    void animate(imageOpacity, 1, {
      ...springConfigs.smooth,
    });
    void animate(imageScale, 1, {
      ...springConfigs.bouncy,
    });
  }, [imageOpacity, imageScale]);

  const handleImageTap = useCallback(() => {
    if (onZoom) {
      void animate(zoomModalOpacity, 1, {
        ...springConfigs.smooth,
      });
      void animate(zoomModalScale, 1, {
        ...springConfigs.bouncy,
      });
      onZoom();
    }
  }, [onZoom, zoomModalOpacity, zoomModalScale]);

  const closeZoom = useCallback(() => {
    void animate(zoomModalOpacity, 0, {
      duration: timingConfigs.fast.duration,
      ease: timingConfigs.fast.ease as string,
    });
    void animate(zoomModalScale, 0.9, {
      duration: timingConfigs.fast.duration,
      ease: timingConfigs.fast.ease as string,
    });
  }, [zoomModalOpacity, zoomModalScale]);

  const imageStyle = useMotionStyle(() => {
    return {
      opacity: imageOpacity.get(),
      transform: [{ scale: imageScale.get() }],
    };
  });

  const zoomModalStyle = useMotionStyle(() => {
    return {
      opacity: zoomModalOpacity.get(),
      transform: [{ scale: zoomModalScale.get() }],
    };
  });

  // Create transforms for waveform heights (all created at top level)
  const waveformHeights = waveformScales.map((scale) => useTransform(scale, [0, 1], [8, 32]));

  // Create a single style function that returns styles for all waveforms
  // Components should use the individual MotionValues directly or create their own styles
  // For backward compatibility, we'll create a helper that returns a style getter
  const getWaveformStyle = (index: number): CSSProperties => {
    return {
      height: waveformHeights[index]?.get() ?? 8,
      transform: `scaleY(${waveformScales[index]?.get() ?? 0.3})`,
    };
  };

  // For backward compatibility, create styles array (but these won't be reactive)
  // Components should use waveformScales and waveformHeights directly with motion components
  const waveformStyles: CSSProperties[] = waveformScales.map((scale, index) => getWaveformStyle(index));

  return {
    imageOpacity,
    imageScale,
    zoomModalOpacity,
    zoomModalScale,
    waveformScales,
    imageStyle,
    zoomModalStyle,
    waveformStyles,
    handleImageLoad,
    handleImageTap,
    closeZoom,
  };
}
