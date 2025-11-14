'use client';

import type { ComponentProps } from 'react';
import * as AccordionPrimitive from '@radix-ui/react-accordion';
import { ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';

import { cn } from '@/lib/utils';
import { getTypographyClasses, getSpacingClassesFromConfig } from '@/lib/typography';
import { accordionContentVariants, accordionIconVariants } from '@/effects/framer-motion/variants';
import { useReducedMotion } from '@/hooks/useReducedMotion';

function Accordion({ ...props }: ComponentProps<typeof AccordionPrimitive.Root>) {
  return <AccordionPrimitive.Root data-slot="accordion" {...props} />;
}

function AccordionItem({ className, ...props }: ComponentProps<typeof AccordionPrimitive.Item>) {
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      className={cn('border-b last:border-b-0', className)}
      {...props}
    />
  );
}

function AccordionTrigger({
  className,
  children,
  ...props
}: ComponentProps<typeof AccordionPrimitive.Trigger>) {
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
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        ref={triggerRef}
        data-slot="accordion-trigger"
        className={cn(
          'focus-visible:border-ring focus-visible:ring-ring/50 flex flex-1 items-start justify-between rounded-md text-left outline-none hover:underline focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50',
          getTypographyClasses('caption'),
          getSpacingClassesFromConfig({ gap: 'lg', paddingY: 'lg' }),
          className
        )}
        {...props}
      >
        {children}
        <motion.div
          variants={prefersReducedMotion ? undefined : accordionIconVariants}
          animate={isOpen ? 'open' : 'closed'}
          transition={{ duration: prefersReducedMotion ? 0 : 0.15 }}
        >
          <ChevronDown className="text-muted-foreground pointer-events-none size-4 shrink-0 translate-y-0.5" aria-hidden="true" />
        </motion.div>
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

function AccordionContent({
  className,
  children,
  ...props
}: ComponentProps<typeof AccordionPrimitive.Content>) {
  const prefersReducedMotion = useReducedMotion();
  const contentRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;

    const observer = new MutationObserver(() => {
      setIsOpen(content.getAttribute('data-state') === 'open');
    });

    observer.observe(content, {
      attributes: true,
      attributeFilter: ['data-state'],
    });

    setIsOpen(content.getAttribute('data-state') === 'open');

    return () => observer.disconnect();
  }, []);

  return (
    <AccordionPrimitive.Content
      ref={contentRef}
      data-slot="accordion-content"
      className={cn('overflow-hidden', getTypographyClasses('body-sm'))}
      {...props}
      asChild
    >
      <motion.div
        variants={prefersReducedMotion ? undefined : accordionContentVariants}
        animate={isOpen ? 'open' : 'closed'}
        initial={false}
      >
        <div className={cn(getSpacingClassesFromConfig({ paddingY: 'lg' }), className)}>{children}</div>
      </motion.div>
    </AccordionPrimitive.Content>
  );
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
