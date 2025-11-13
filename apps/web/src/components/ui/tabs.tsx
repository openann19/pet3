'use client';

import type { ComponentProps } from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { motion } from 'framer-motion';

import { cn } from '@/lib/utils';
import { getSpacingClassesFromConfig, getTypographyClasses } from '@/lib/typography';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useMotionTokens } from '@/hooks/useMotionTokens';
import { buttonPressVariants, fadeVariants } from '@/effects/framer-motion/variants';
import { focusRing } from '@/lib/design-token-utils';

function Tabs({ className, ...props }: ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      role="tablist"
      className={cn('flex flex-col', getSpacingClassesFromConfig({ gap: 'sm' }), className)}
      {...props}
    />
  );
}

function TabsList({ className, ...props }: ComponentProps<typeof TabsPrimitive.List>) {
  const prefersReducedMotion = useReducedMotion();
  const tokens = useMotionTokens();

  return (
    <TabsPrimitive.List asChild data-slot="tabs-list" role="tablist" {...props}>
      <motion.div
        className={cn(
          'bg-muted text-muted-foreground inline-flex h-9 w-fit items-center justify-center rounded-lg',
          getSpacingClassesFromConfig({ padding: 'xs' }),
          className
        )}
        initial={false}
        animate={{ opacity: 1 }}
        transition={{
          duration: prefersReducedMotion ? 0 : tokens.durations.normal,
        }}
      />
    </TabsPrimitive.List>
  );
}

function TabsTrigger({ className, ...props }: ComponentProps<typeof TabsPrimitive.Trigger>) {
  const prefersReducedMotion = useReducedMotion();
  const tokens = useMotionTokens();
  const shouldAnimate = !prefersReducedMotion;

  return (
    <TabsPrimitive.Trigger asChild data-slot="tabs-trigger" role="tab" {...props}>
      <motion.button
        className={cn(
          "data-[state=active]:bg-background dark:data-[state=active]:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring dark:data-[state=active]:border-input dark:data-[state=active]:bg-input/30 text-foreground dark:text-muted-foreground inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center rounded-md border border-transparent whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow-sm [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
          getTypographyClasses('caption'),
          getSpacingClassesFromConfig({ gap: 'xs', paddingX: 'sm', paddingY: 'xs' }),
          focusRing,
          className
        )}
        variants={shouldAnimate ? buttonPressVariants : undefined}
        initial="rest"
        whileHover={shouldAnimate ? "hover" : undefined}
        whileTap={shouldAnimate ? "tap" : undefined}
        whileFocus={shouldAnimate ? "hover" : undefined}
        transition={{
          ...tokens.spring.smooth,
          duration: prefersReducedMotion ? 0 : tokens.durations.normal,
        }}
      />
    </TabsPrimitive.Trigger>
  );
}

function TabsContent({ className, ...props }: ComponentProps<typeof TabsPrimitive.Content>) {
  const prefersReducedMotion = useReducedMotion();
  const tokens = useMotionTokens();
  const shouldAnimate = !prefersReducedMotion;

  return (
    <TabsPrimitive.Content asChild data-slot="tabs-content" role="tabpanel" {...props}>
      <motion.div
        className={cn('flex-1 outline-none', className)}
        variants={shouldAnimate ? fadeVariants : undefined}
        initial={shouldAnimate ? "hidden" : false}
        animate={shouldAnimate ? "visible" : false}
        transition={{
          ...tokens.spring.smooth,
          duration: prefersReducedMotion ? 0 : tokens.durations.smooth,
        }}
      />
    </TabsPrimitive.Content>
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
