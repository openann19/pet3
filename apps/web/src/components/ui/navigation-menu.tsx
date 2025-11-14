'use client';

import type { ComponentProps } from 'react';
import * as NavigationMenuPrimitive from '@radix-ui/react-navigation-menu';
import { cva } from 'class-variance-authority';
import { ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRef, useEffect, useState, useCallback, useMemo } from 'react';

import { cn } from '@/lib/utils';
import { navMenuIconVariants, createNavMenuContentVariants, navMenuViewportVariants } from '@/effects/framer-motion/variants';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { AnimatePresence } from 'framer-motion';

function NavigationMenu({
  className,
  children,
  viewport = true,
  ...props
}: ComponentProps<typeof NavigationMenuPrimitive.Root> & {
  viewport?: boolean;
}) {
  return (
    <NavigationMenuPrimitive.Root
      data-slot="navigation-menu"
      data-viewport={viewport}
      className={cn(
        'group/navigation-menu relative flex max-w-max flex-1 items-center justify-center',
        className
      )}
      {...props}
    >
      {children}
      {viewport && <NavigationMenuViewport />}
    </NavigationMenuPrimitive.Root>
  );
}

interface NavigationMenuListProps
  extends ComponentProps<typeof NavigationMenuPrimitive.List> {
  readonly activeIndex?: number
  readonly showInkBar?: boolean
}

function NavigationMenuList({
  className,
  activeIndex = 0,
  showInkBar = true,
  ...props
}: NavigationMenuListProps) {
  const listRef = useRef<HTMLUListElement | null>(null)

  const handleListRef = useCallback((node: HTMLUListElement | null) => {
    listRef.current = node
  }, [])

  const clampedIndex = useMemo(() => {
    if (!Number.isFinite(activeIndex)) {
      return 0
    }
    return Math.max(0, Math.floor(activeIndex))
  }, [activeIndex])

  return (
    <NavigationMenuPrimitive.List
      data-slot="navigation-menu-list"
      className={cn('group flex flex-1 list-none items-center justify-center gap-1', className)}
      {...props}
    />
  );
}

function NavigationMenuItem({
  className,
  ...props
}: ComponentProps<typeof NavigationMenuPrimitive.Item>) {
  return (
    <NavigationMenuPrimitive.Item
      data-slot="navigation-menu-item"
      className={cn('relative', className)}
      {...props}
    />
  );
}

const navigationMenuTriggerStyle = cva(
  'group inline-flex h-9 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground disabled:pointer-events-none disabled:opacity-50 data-[state=open]:hover:bg-accent data-[state=open]:text-accent-foreground data-[state=open]:focus:bg-accent data-[state=open]:bg-accent/50 focus-visible:ring-ring/50 outline-none transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:outline-1'
);

function NavigationMenuTrigger({
  className,
  children,
  ...props
}: ComponentProps<typeof NavigationMenuPrimitive.Trigger>) {
  const prefersReducedMotion = useReducedMotion();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const observer = new MutationObserver(() => {
      setIsOpen(trigger.getAttribute('data-state') === 'open');
    });

    observer.observe(trigger, {
      attributes: true,
      attributeFilter: ['data-state'],
    });

    setIsOpen(trigger.getAttribute('data-state') === 'open');

    return () => observer.disconnect();
  }, []);

  return (
    <NavigationMenuPrimitive.Trigger
      ref={triggerRef}
      data-slot="navigation-menu-trigger"
      className={cn(navigationMenuTriggerStyle(), 'group', className)}
      {...props}
    >
      {children}{' '}
      <motion.div
        variants={prefersReducedMotion ? undefined : navMenuIconVariants}
        animate={isOpen ? 'open' : 'closed'}
        transition={{ duration: prefersReducedMotion ? 0 : 0.24 }}
      >
        <ChevronDown className="relative top-0 ml-1 size-3" aria-hidden="true" />
      </motion.div>
    </NavigationMenuPrimitive.Trigger>
  );
}

function NavigationMenuContent({
  className,
  children,
  ...props
}: ComponentProps<typeof NavigationMenuPrimitive.Content>) {
  const prefersReducedMotion = useReducedMotion();
  const contentRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [direction, setDirection] = useState<'from-start' | 'from-end'>('from-start');

  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;

    const observer = new MutationObserver(() => {
      setIsOpen(content.getAttribute('data-state') === 'open');
      const motionAttr = content.getAttribute('data-motion');
      if (motionAttr?.startsWith('from-')) {
        setDirection(motionAttr as 'from-start' | 'from-end');
      }
    });

    observer.observe(content, {
      attributes: true,
      attributeFilter: ['data-state', 'data-motion'],
    });

    setIsOpen(content.getAttribute('data-state') === 'open');
    const motionAttr = content.getAttribute('data-motion');
    if (motionAttr?.startsWith('from-')) {
      setDirection(motionAttr as 'from-start' | 'from-end');
    }

    return () => observer.disconnect();
  }, []);

  const contentVariants = createNavMenuContentVariants(direction);

  return (
    <NavigationMenuPrimitive.Content
      ref={contentRef}
      data-slot="navigation-menu-content"
      className={cn(
        'top-0 left-0 w-full p-2 pr-2.5 md:absolute md:w-auto',
        'group-data-[viewport=false]/navigation-menu:bg-popover group-data-[viewport=false]/navigation-menu:text-popover-foreground group-data-[viewport=false]/navigation-menu:top-full group-data-[viewport=false]/navigation-menu:mt-1.5 group-data-[viewport=false]/navigation-menu:overflow-hidden group-data-[viewport=false]/navigation-menu:rounded-md group-data-[viewport=false]/navigation-menu:border group-data-[viewport=false]/navigation-menu:shadow **:data-[slot=navigation-menu-link]:focus:ring-0 **:data-[slot=navigation-menu-link]:focus:outline-none',
        className
      )}
      {...props}
    >
      <motion.div
        variants={prefersReducedMotion ? undefined : contentVariants}
        initial="hidden"
        animate={isOpen ? 'visible' : 'exit'}
        exit="exit"
      >
        {children}
      </motion.div>
    </NavigationMenuPrimitive.Content>
  );
}

function NavigationMenuViewport({
  className,
  ...props
}: ComponentProps<typeof NavigationMenuPrimitive.Viewport>) {
  const prefersReducedMotion = useReducedMotion();
  const viewportRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const observer = new MutationObserver(() => {
      setIsOpen(viewport.getAttribute('data-state') === 'open');
    });

    observer.observe(viewport, {
      attributes: true,
      attributeFilter: ['data-state'],
    });

    setIsOpen(viewport.getAttribute('data-state') === 'open');

    return () => observer.disconnect();
  }, []);

  return (
    <div className={cn('absolute top-full left-0 isolate z-50 flex justify-center')}>
      <NavigationMenuPrimitive.Viewport
        ref={viewportRef}
        data-slot="navigation-menu-viewport"
        className={cn(
          'origin-top-center bg-popover text-popover-foreground relative mt-1.5 h-(--radix-navigation-menu-viewport-height) w-full overflow-hidden rounded-md border shadow md:w-(--radix-navigation-menu-viewport-width)',
          className
        )}
        {...props}
      >
        <motion.div
          variants={prefersReducedMotion ? undefined : navMenuViewportVariants}
          initial="hidden"
          animate={isOpen ? 'visible' : 'exit'}
          exit="exit"
          className="h-full w-full"
        />
      </NavigationMenuPrimitive.Viewport>
    </div>
  );
}

function NavigationMenuLink({
  className,
  ...props
}: ComponentProps<typeof NavigationMenuPrimitive.Link>) {
  return (
    <NavigationMenuPrimitive.Link
      data-slot="navigation-menu-link"
      className={cn(
        "data-[active=true]:focus:bg-accent data-[active=true]:hover:bg-accent data-[active=true]:bg-accent/50 data-[active=true]:text-accent-foreground focus-visible:ring-ring/50 [&_svg:not([class*='text-'])]:text-muted-foreground flex flex-col gap-1 rounded-sm p-2 text-sm outline-none focus-visible:ring-[3px] focus-visible:outline-1 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    />
  );
}

function NavigationMenuIndicator({
  className,
  ...props
}: ComponentProps<typeof NavigationMenuPrimitive.Indicator>) {
  return (
    <NavigationMenuPrimitive.Indicator
      data-slot="navigation-menu-indicator"
      className={cn(
        'data-[state=visible]:animate-in data-[state=hidden]:animate-out data-[state=hidden]:fade-out data-[state=visible]:fade-in top-full z-1 flex h-1.5 items-end justify-center overflow-hidden',
        className
      )}
      {...props}
    >
      <div className="bg-border relative top-[60%] h-2 w-2 rotate-45 rounded-tl-sm shadow-md" />
    </NavigationMenuPrimitive.Indicator>
  );
}

export {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuContent,
  NavigationMenuTrigger,
  NavigationMenuLink,
  NavigationMenuIndicator,
  NavigationMenuViewport,
  navigationMenuTriggerStyle,
};
