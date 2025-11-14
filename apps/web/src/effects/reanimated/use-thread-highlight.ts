'use client';

import {
  useMotionValue,
  animate,
  type MotionValue,
} from 'framer-motion';
import { useEffect, useCallback } from 'react';
import { springConfigs, timingConfigs } from '@/effects/reanimated/transitions';
import { useMotionStyle } from './use-motion-style';
import type { CSSProperties } from 'react';

export interface UseThreadHighlightOptions {
  isThreadMessage?: boolean;
  highlightDuration?: number;
  previewDelay?: number;
  enabled?: boolean;
}

export interface UseThreadHighlightReturn {
  scale: MotionValue<number>;
  highlightOpacity: MotionValue<number>;
  previewOpacity: MotionValue<number>;
  previewTranslateY: MotionValue<number>;
  animatedStyle: CSSProperties;
  previewStyle: CSSProperties;
  highlightStyle: CSSProperties;
  trigger: () => void;
  dismiss: () => void;
}

const DEFAULT_IS_THREAD_MESSAGE = false;
const DEFAULT_HIGHLIGHT_DURATION = 2000;
const DEFAULT_PREVIEW_DELAY = 300;
const DEFAULT_ENABLED = true;

export function useThreadHighlight(
  options: UseThreadHighlightOptions = {}
): UseThreadHighlightReturn {
  const {
    isThreadMessage = DEFAULT_IS_THREAD_MESSAGE,
    highlightDuration = DEFAULT_HIGHLIGHT_DURATION,
    previewDelay = DEFAULT_PREVIEW_DELAY,
    enabled = DEFAULT_ENABLED,
  } = options;

  const scale = useMotionValue(1);
  const highlightOpacity = useMotionValue(0);
  const previewOpacity = useMotionValue(0);
  const previewTranslateY = useMotionValue(10);

  const trigger = useCallback(() => {
    if (!enabled || !isThreadMessage) {
      return;
    }

    // Animate scale
    void animate(scale, 1.05, {
      type: 'spring',
      damping: 15,
      stiffness: 400,
    }).then(() => {
      void animate(scale, 1, {
        ...springConfigs.bouncy,
      });
    });

    // Animate highlight opacity
    void animate(highlightOpacity, 1, {
      duration: timingConfigs.fast.duration,
      ease: timingConfigs.fast.ease as string,
    }).then(() => {
      setTimeout(() => {
        void animate(highlightOpacity, 0, {
          duration: timingConfigs.smooth.duration,
          ease: timingConfigs.smooth.ease as string,
        });
      }, highlightDuration);
    });

    // Animate preview with delay
    setTimeout(() => {
      void animate(previewOpacity, 1, {
        ...springConfigs.smooth,
      });
      void animate(previewTranslateY, 0, {
        ...springConfigs.smooth,
      });
    }, previewDelay);
  }, [
    enabled,
    isThreadMessage,
    highlightDuration,
    previewDelay,
    scale,
    highlightOpacity,
    previewOpacity,
    previewTranslateY,
  ]);

  const dismiss = useCallback(() => {
    void animate(previewOpacity, 0, {
      duration: timingConfigs.fast.duration,
      ease: timingConfigs.fast.ease as string,
    });
    void animate(previewTranslateY, 10, {
      duration: timingConfigs.fast.duration,
      ease: timingConfigs.fast.ease as string,
    });
    void animate(highlightOpacity, 0, {
      duration: timingConfigs.fast.duration,
      ease: timingConfigs.fast.ease as string,
    });
  }, [previewOpacity, previewTranslateY, highlightOpacity]);

  useEffect(() => {
    if (enabled && isThreadMessage) {
      trigger();

      const timeout = setTimeout(
        () => {
          dismiss();
        },
        highlightDuration + previewDelay + 1000
      );

      return () => {
        clearTimeout(timeout);
      };
    }
    return undefined;
  }, [enabled, isThreadMessage, trigger, dismiss, highlightDuration, previewDelay]);

  const animatedStyle = useMotionStyle(() => {
    return {
      transform: [{ scale: scale.get() }],
    };
  });

  const highlightStyle = useMotionStyle(() => {
    const opacity = highlightOpacity.get();
    return {
      opacity,
      backgroundColor: `rgba(59, 130, 246, ${opacity * 0.2})`,
    };
  });

  const previewStyle = useMotionStyle(() => {
    return {
      opacity: previewOpacity.get(),
      transform: [{ translateY: previewTranslateY.get() }],
    };
  });

  return {
    scale,
    highlightOpacity,
    previewOpacity,
    previewTranslateY,
    animatedStyle,
    previewStyle,
    highlightStyle,
    trigger,
    dismiss,
  };
}
