'use client';
import { useCallback } from 'react';
import { useSharedValue, useAnimatedStyle, withSpring } from '@petspark/motion';
import type { AnimatedStyle } from '@/hooks/use-animated-style-value';
import { useUIConfig } from '@/hooks/use-ui-config';
import { springConfigs } from '@/effects/reanimated/transitions';

export interface Use3DTiltEffectOptions {
  enabled?: boolean;
  intensity?: number;
}

export interface Use3DTiltEffectReturn {
  animatedStyle: AnimatedStyle;
  handleMouseMove: (e: React.MouseEvent) => void;
  handleMouseLeave: () => void;
  rotateX: ReturnType<typeof useSharedValue<number>>;
  rotateY: ReturnType<typeof useSharedValue<number>>;
}

/**
 * 3D tilt effect based on cursor/touch position
 *
 * Creates a 3D tilt effect that follows cursor or touch movement
 *
 * @example
 * ```tsx
 * const { animatedStyle, handleMouseMove, handleMouseLeave } = use3DTiltEffect()
 * return (
 *   <motion.div
 *     style={animatedStyle}
 *     onMouseMove={handleMouseMove}
 *     onMouseLeave={handleMouseLeave}
 *   >
 *     {content}
 *   </motion.div>
 * )
 * ```
 */
export function use3DTiltEffect(options: Use3DTiltEffectOptions = {}): Use3DTiltEffectReturn {
  const { enabled = true, intensity = 15 } = options;
  const { visual } = useUIConfig();

  const rotateX = useSharedValue(0);
  const rotateY = useSharedValue(0);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent): void => {
      if (!enabled || !visual.enable3DTilt) {
        return;
      }

      const rect = e.currentTarget.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const deltaX = (e.clientX - centerX) / rect.width;
      const deltaY = (e.clientY - centerY) / rect.height;

      rotateY.value = withSpring(deltaX * intensity, springConfigs.smooth).target;
      rotateX.value = withSpring(-deltaY * intensity, springConfigs.smooth).target;
    },
    [enabled, visual.enable3DTilt, rotateX, rotateY, intensity]
  );

  const handleMouseLeave = useCallback((): void => {
    if (!enabled || !visual.enable3DTilt) {
      return;
    }

    rotateX.value = withSpring(0, springConfigs.smooth).target;
    rotateY.value = withSpring(0, springConfigs.smooth).target;
  }, [enabled, visual.enable3DTilt, rotateX, rotateY]);

  const animatedStyle = useAnimatedStyle(() => {
    if (!enabled || !visual.enable3DTilt) {
      return {};
    }

    const rotateXVal = typeof rotateX.value === 'number' ? rotateX.value : rotateX.value.target;
    const rotateYVal = typeof rotateY.value === 'number' ? rotateY.value : rotateY.value.target;

    return {
      transform: [
        {
          rotateX: `${rotateXVal}deg`,
          rotateY: `${rotateYVal}deg`,
          perspective: 1000,
        },
      ],
    };
  }) as AnimatedStyle;

  return {
    animatedStyle,
    handleMouseMove,
    handleMouseLeave,
    rotateX,
    rotateY,
  };
}
