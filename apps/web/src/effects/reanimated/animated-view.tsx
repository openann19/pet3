'use client';

import React from 'react';
import type { ReactNode, MouseEventHandler } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
// Re-export for backward compatibility during migration
export { useAnimatedStyleValue, type AnimatedStyle } from '@/hooks/use-animated-style-value';
import type { AnimatedStyle } from '@/hooks/use-animated-style-value';

interface AnimatedViewProps {
  children?: ReactNode;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  style?: AnimatedStyle | Record<string, any>;
  className?: string | undefined;
  onMouseEnter?: MouseEventHandler<HTMLDivElement> | undefined;
  onMouseLeave?: MouseEventHandler<HTMLDivElement> | undefined;
  onClick?: MouseEventHandler<HTMLDivElement> | undefined;
  initial?: HTMLMotionProps<'div'>['initial'];
  animate?: HTMLMotionProps<'div'>['animate'];
  exit?: HTMLMotionProps<'div'>['exit'];
  transition?: HTMLMotionProps<'div'>['transition'];
  layout?: boolean | 'position' | 'size';
  layoutId?: string;
  [key: string]: unknown;
}

export function AnimatedView({
  children,
  style: animatedStyle,
  className,
  onMouseEnter,
  onMouseLeave,
  onClick,
  initial,
  animate,
  exit,
  transition,
  layout,
  layoutId,
  ...props
}: AnimatedViewProps) {
  // Import here to avoid circular dependency during migration
  // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
  const hookModule = require('@/hooks/use-animated-style-value');
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
  const computedStyle = animatedStyle ? hookModule.useAnimatedStyleValue(animatedStyle as AnimatedStyle) : (props.style as React.CSSProperties | undefined);

  // Extract non-motion props
  const {
    initial: _initial,
    animate: _animate,
    exit: _exit,
    transition: _transition,
    layout: _layout,
    layoutId: _layoutId,
    style: _style,
    ...domProps
  } = props;

  return (
    <motion.div
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      style={computedStyle}
      className={className}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
      initial={initial}
      animate={animate}
      exit={exit}
      transition={transition}
      layout={layout}
      layoutId={layoutId}
      {...domProps}
    >
      {children}
    </motion.div>
  );
}
