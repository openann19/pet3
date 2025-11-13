/**
 * Slider Component (Web)
 * 
 * Professional Framer Motion slider with drag gestures, smooth animations,
 * keyboard navigation, and full accessibility support.
 * 
 * Location: apps/web/src/components/ui/slider.tsx
 */

'use client';

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { motion, useMotionValue, useTransform, animate, type PanInfo } from 'framer-motion';
import { cn } from '@/lib/utils';
import { getSpacingClassesFromConfig } from '@/lib/typography';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { haptics } from '@/lib/haptics';
import { getAriaFormFieldAttributes } from '@/lib/accessibility';
import { sliderThumbVariants, springConfigs, motionDurations } from '@/effects/framer-motion/variants';

export interface SliderProps {
  min?: number;
  max?: number;
  value?: number;
  defaultValue?: number;
  onValueChange?: (value: number) => void;
  step?: number;
  disabled?: boolean;
  className?: string;
  'aria-label': string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  testID?: string;
}

const THUMB_SIZE = 44; // WCAG minimum touch target
const TRACK_HEIGHT = 4;

export function Slider({
  min = 0,
  max = 100,
  value: externalValue,
  defaultValue,
  onValueChange,
  step = 1,
  disabled = false,
  className,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ariaDescribedBy,
  testID = 'slider',
}: SliderProps): React.JSX.Element {
  const [internalValue, setInternalValue] = useState(() => defaultValue ?? (min + max) / 2);
  const [isDragging, setIsDragging] = useState(false);
  const [trackWidth, setTrackWidth] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  const value = externalValue ?? internalValue;

  // Calculate percentage
  const percentage = useMemo(() => {
    const clamped = Math.max(min, Math.min(max, value));
    return ((clamped - min) / (max - min)) * 100;
  }, [value, min, max]);

  // Calculate thumb position in pixels
  const thumbX = useMotionValue<number>(0);
  const isDraggingRef = useRef(false);

  // Update thumb position when value changes externally (when not dragging)
  useEffect(() => {
    if (!isDraggingRef.current && trackWidth > 0) {
      const newX = (percentage / 100) * (trackWidth - THUMB_SIZE);
      animate(thumbX, newX, {
        ...springConfigs.smooth,
        duration: prefersReducedMotion ? 0 : motionDurations.smooth,
      });
    }
  }, [percentage, trackWidth, thumbX, prefersReducedMotion]);

  // Measure track width on mount and resize
  useEffect(() => {
    const updateTrackWidth = (): void => {
      if (trackRef.current) {
        const width = trackRef.current.offsetWidth;
        setTrackWidth(width);
        // Set initial thumb position
        const initialX = (percentage / 100) * (width - THUMB_SIZE);
        thumbX.set(initialX);
      }
    };

    updateTrackWidth();
    window.addEventListener('resize', updateTrackWidth);
    return () => window.removeEventListener('resize', updateTrackWidth);
  }, [percentage, thumbX]);

  const handleValueChange = useCallback(
    (newValue: number) => {
      const clamped = Math.max(min, Math.min(max, newValue));
      const stepped = Math.round(clamped / step) * step;

      if (externalValue === undefined) {
        setInternalValue(stepped);
      }
      onValueChange?.(stepped);

      if (!prefersReducedMotion) {
        haptics.impact('light');
      }
    },
    [min, max, step, externalValue, onValueChange, prefersReducedMotion]
  );

  // Transform thumb X position to percentage
  const thumbPercentage = useTransform<number, number>(thumbX, (latestX: number) => {
    if (trackWidth === 0) return 0;
    const clampedX = Math.max(0, Math.min(trackWidth - THUMB_SIZE, latestX));
    return (clampedX / (trackWidth - THUMB_SIZE)) * 100;
  });

  // Drag handlers
  const onDragStart = useCallback(
    (_event: MouseEvent | TouchEvent | PointerEvent, _info: PanInfo) => {
      if (disabled) return;
      isDraggingRef.current = true;
      setIsDragging(true);
    },
    [disabled]
  );

  const onDrag = useCallback(
    (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (disabled || trackWidth === 0) return;

      const currentX = thumbX.get() + info.delta.x;
      const clampedX = Math.max(0, Math.min(trackWidth - THUMB_SIZE, currentX));
      thumbX.set(clampedX);

      // Calculate and update value in real-time
      const currentPercentage = (clampedX / (trackWidth - THUMB_SIZE)) * 100;
      const rawValue = min + (currentPercentage / 100) * (max - min);
      const steppedValue = Math.round(rawValue / step) * step;
      const clampedValue = Math.max(min, Math.min(max, steppedValue));

      handleValueChange(clampedValue);
    },
    [disabled, trackWidth, thumbX, min, max, step, handleValueChange]
  );

  const onDragEnd = useCallback(
    (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (disabled || trackWidth === 0) return;

      isDraggingRef.current = false;
      setIsDragging(false);

      // Calculate final position
      const finalX = thumbX.get() + info.offset.x;
      const clampedX = Math.max(0, Math.min(trackWidth - THUMB_SIZE, finalX));

      // Animate to final position
      animate(thumbX, clampedX, {
        ...springConfigs.smooth,
        duration: prefersReducedMotion ? 0 : motionDurations.smooth,
      });

      // Calculate final value
      const finalPercentage = (clampedX / (trackWidth - THUMB_SIZE)) * 100;
      const rawValue = min + (finalPercentage / 100) * (max - min);
      const steppedValue = Math.round(rawValue / step) * step;
      const finalValue = Math.max(min, Math.min(max, steppedValue));

      if (finalValue !== value) {
        handleValueChange(finalValue);
      }
    },
    [disabled, trackWidth, thumbX, min, max, step, value, handleValueChange, prefersReducedMotion]
  );

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (disabled) return;

      let newValue = value;
      const stepSize = step;

      switch (event.key) {
        case 'ArrowRight':
        case 'ArrowUp':
          event.preventDefault();
          newValue = Math.min(max, value + stepSize);
          break;
        case 'ArrowLeft':
        case 'ArrowDown':
          event.preventDefault();
          newValue = Math.max(min, value - stepSize);
          break;
        case 'Home':
          event.preventDefault();
          newValue = min;
          break;
        case 'End':
          event.preventDefault();
          newValue = max;
          break;
        case 'PageUp':
          event.preventDefault();
          newValue = Math.min(max, value + stepSize * 10);
          break;
        case 'PageDown':
          event.preventDefault();
          newValue = Math.max(min, value - stepSize * 10);
          break;
        default:
          return;
      }

      if (newValue !== value) {
        handleValueChange(newValue);
      }
    },
    [disabled, value, min, max, step, handleValueChange]
  );

  // Click on track to jump to position
  const handleTrackClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (disabled || !trackRef.current) return;

      const rect = trackRef.current.getBoundingClientRect();
      const clickX = event.clientX - rect.left;
      const percentage = Math.max(0, Math.min(1, clickX / rect.width));
      const rawValue = min + percentage * (max - min);
      const steppedValue = Math.round(rawValue / step) * step;
      const clampedValue = Math.max(min, Math.min(max, steppedValue));

      handleValueChange(clampedValue);
    },
    [disabled, min, max, step, handleValueChange]
  );

  const ariaAttrs = getAriaFormFieldAttributes({
    label: ariaLabel,
    labelledBy: ariaLabelledBy,
    describedBy: ariaDescribedBy,
    disabled,
  });

  return (
    <div
      className={cn(
        'relative flex w-full items-center',
        getSpacingClassesFromConfig({ paddingY: 'lg' }),
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      role="slider"
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={Math.round(value)}
      aria-label={ariaLabel}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : 0}
      onKeyDown={handleKeyDown}
      data-testid={testID}
      {...ariaAttrs}
    >
      <div
        ref={trackRef}
        className={cn(
          'relative w-full h-1 rounded-full bg-muted/80 cursor-pointer',
          'transition-colors duration-200',
          !disabled && 'hover:bg-muted'
        )}
        onClick={handleTrackClick}
        aria-hidden="true"
      >
        <motion.div
          className={cn(
            'absolute h-full rounded-full bg-primary shadow-lg shadow-primary/25',
            !prefersReducedMotion && 'will-change-[width]' // Performance optimization
          )}
          style={{
            width: useTransform<number, string>(thumbPercentage, (p: number) => `${p}%`),
          }}
          transition={{
            duration: prefersReducedMotion ? 0 : motionDurations.smooth,
            ease: 'easeOut',
          }}
        />
      </div>

      <motion.div
        className={cn(
          'absolute rounded-full border-2 border-primary bg-background',
          'shadow-xl shadow-primary/30',
          'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25',
          disabled && 'pointer-events-none',
          !prefersReducedMotion && 'will-change-transform' // Performance optimization
        )}
        style={{
          width: THUMB_SIZE,
          height: THUMB_SIZE,
          x: thumbX,
          y: -THUMB_SIZE / 2 + TRACK_HEIGHT / 2,
          cursor: disabled ? 'not-allowed' : isDragging ? 'grabbing' : 'grab',
        }}
        drag="x"
        dragConstraints={{
          left: 0,
          right: trackWidth - THUMB_SIZE,
        }}
        dragElastic={0}
        onDragStart={onDragStart}
        onDrag={onDrag}
        onDragEnd={onDragEnd}
        variants={sliderThumbVariants}
        initial="rest"
        animate={isDragging ? 'drag' : 'rest'}
        whileHover={disabled ? undefined : 'hover'}
        whileTap={disabled ? undefined : 'tap'}
        transition={{
          ...springConfigs.smooth,
          duration: prefersReducedMotion ? 0 : motionDurations.normal,
        }}
        tabIndex={-1}
        aria-hidden="true"
      />
    </div>
  );
}
