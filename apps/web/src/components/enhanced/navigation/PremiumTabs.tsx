'use client';
import { motion, useMotionValue, animate } from 'framer-motion';

import React, { useCallback, useRef, useEffect } from 'react';
import { springConfigs, motionDurations } from '@/effects/framer-motion/variants';
import { haptics } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { useUIConfig } from "@/hooks/use-ui-config";
import { usePrefersReducedMotion } from '@/utils/reduced-motion';
import { getTypographyClasses, getSpacingClassesFromConfig, accessibilityClasses } from '@/lib/typography';

export interface PremiumTab {
  value: string;
  label: string;
  icon?: React.ReactNode;
  badge?: number | string;
  disabled?: boolean;
}

export interface PremiumTabsProps {
  tabs: PremiumTab[];
  value?: string;
  onValueChange?: (value: string) => void;
  defaultValue?: string;
  variant?: 'default' | 'pills' | 'underline';
  size?: 'sm' | 'md' | 'lg';
  scrollable?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function PremiumTabs({
  tabs,
  value,
  onValueChange,
  defaultValue,
  variant = 'default',
  size = 'md',
  scrollable = false,
  className,
  children,
}: PremiumTabsProps): React.JSX.Element {
  const _uiConfig = useUIConfig();
  const prefersReducedMotion = usePrefersReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const indicatorPosition = useMotionValue(0);
  const indicatorWidth = useMotionValue(0);
  const activeTab = value ?? defaultValue ?? tabs[0]?.value;

  const updateIndicator = useCallback(() => {
    if (!containerRef.current || tabs.length === 0) return;

    const container = containerRef.current;
    const buttons = container.querySelectorAll('button[data-tab-trigger]');
    const activeIndex = tabs.findIndex((tab) => tab.value === activeTab);

    if (activeIndex >= 0 && buttons[activeIndex]) {
      const activeButton = buttons[activeIndex] as HTMLElement;
      const containerRect = container.getBoundingClientRect();
      const buttonRect = activeButton.getBoundingClientRect();

      const newPosition = buttonRect.left - containerRect.left;
      const newWidth = buttonRect.width;

      if (prefersReducedMotion) {
        indicatorPosition.set(newPosition);
        indicatorWidth.set(newWidth);
      } else {
        void animate(indicatorPosition, newPosition, {
          ...springConfigs.smooth,
          duration: motionDurations.smooth,
        });
        void animate(indicatorWidth, newWidth, {
          ...springConfigs.smooth,
          duration: motionDurations.smooth,
        });
      }
    }
  }, [tabs, activeTab, indicatorPosition, indicatorWidth, prefersReducedMotion]);

  useEffect(() => {
    updateIndicator();
    const resizeObserver = new ResizeObserver(updateIndicator);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    return () => resizeObserver.disconnect();
  }, [updateIndicator]);

  const handleValueChange = useCallback(
    (newValue: string) => {
      onValueChange?.(newValue);
      haptics.selection();
      setTimeout(updateIndicator, 0);
    },
    [onValueChange, updateIndicator]
  );

  const variants = {
    default: 'bg-muted',
    pills: cn('bg-transparent', getSpacingClassesFromConfig({ gap: 'sm' })),
    underline: 'bg-transparent border-b border-border',
  };

  const sizes = {
    sm: cn(
      'h-8',
      getSpacingClassesFromConfig({ paddingX: 'md' }),
      getTypographyClasses('caption')
    ),
    md: cn(
      'h-10',
      getSpacingClassesFromConfig({ paddingX: 'lg' }),
      getTypographyClasses('body')
    ),
    lg: cn(
      'h-12',
      getSpacingClassesFromConfig({ paddingX: 'xl' }),
      getTypographyClasses('h3')
    ),
  };

  return (
    <TabsPrimitive.Root
      {...(value !== undefined ? { value } : {})}
      {...(defaultValue !== undefined ? { defaultValue } : {})}
      onValueChange={handleValueChange}
      className={cn('w-full', className)}
    >
      <div className="relative">
        <TabsPrimitive.List
          ref={containerRef}
          className={cn(
            'inline-flex items-center',
            scrollable && 'overflow-x-auto',
            variants[variant],
            variant === 'default' && cn('rounded-lg', getSpacingClassesFromConfig({ padding: 'xs' })),
            variant === 'underline' && getSpacingClassesFromConfig({ padding: 'xs' })
          )}
        >
          {variant === 'underline' && (
            <motion.div
              style={{
                x: indicatorPosition,
                width: indicatorWidth,
              }}
              transition={prefersReducedMotion ? { duration: 0 } : {
                ...springConfigs.smooth,
                duration: motionDurations.smooth,
              }}
              className="absolute bottom-0 h-0.5 bg-primary"
            />
          )}
          {tabs.map((tab) => {
            const isActive = tab.value === activeTab;
            return (
              <TabsPrimitive.Trigger
                key={tab.value}
                value={tab.value}
                disabled={tab.disabled}
                data-tab-trigger
                className={cn(
                  'relative z-10 flex items-center font-medium',
                  getSpacingClassesFromConfig({ gap: 'sm' }),
                  prefersReducedMotion ? '' : 'transition-all duration-200',
                  accessibilityClasses.focusVisible,
                  'disabled:pointer-events-none disabled:opacity-50',
                  sizes[size],
                  variant === 'default' &&
                    cn(
                      'rounded-md',
                      isActive
                        ? 'bg-(--background) text-(--text-primary) shadow-sm'
                        : 'text-(--text-muted) hover:text-(--text-primary)'
                    ),
                  variant === 'pills' &&
                    cn(
                      'rounded-full',
                      getSpacingClassesFromConfig({ paddingX: 'lg' }),
                      isActive
                        ? 'bg-(--primary) text-(--primary-foreground)'
                        : 'bg-(--surface) text-(--text-muted) hover:bg-(--surface)/80'
                    ),
                  variant === 'underline' &&
                    cn(
                      'border-b-2 border-transparent',
                      isActive
                        ? 'border-(--primary) text-(--primary)'
                        : 'text-(--text-muted) hover:text-(--text-primary) hover:border-(--text-muted)/50'
                    )
                )}
                aria-label={tab.label}
                aria-selected={isActive}
              >
                {tab.icon && <span aria-hidden="true">{tab.icon}</span>}
                {tab.label}
                {tab.badge !== undefined && (
                  <span
                    className={cn(
                      'font-bold rounded-full',
                      getSpacingClassesFromConfig({ marginX: 'xs', paddingX: 'xs', paddingY: 'xs' }),
                      getTypographyClasses('caption'),
                      isActive
                        ? 'bg-primary-foreground/20 text-primary-foreground'
                        : 'bg-muted-foreground/20 text-muted-foreground'
                    )}
                    aria-label={`${tab.badge} ${tab.label}`}
                  >
                    {tab.badge}
                  </span>
                )}
              </TabsPrimitive.Trigger>
            );
          })}
        </TabsPrimitive.List>
      </div>
      {children}
    </TabsPrimitive.Root>
  );
}
