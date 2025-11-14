'use client';

import React, { useCallback, useEffect } from 'react';
import { X, Funnel, Check, Eraser } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useFilters } from '@/hooks/use-filters';
import { useBounceOnTap } from '@/effects/reanimated/use-bounce-on-tap';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { usePrefersReducedMotion } from '@/utils/reduced-motion';
import { motionDurations } from '@/effects/framer-motion/variants';
import { motion } from 'framer-motion';
import { useUIConfig } from "@/hooks/use-ui-config";
import { getTypographyClasses, getSpacingClassesFromConfig } from '@/lib/typography';
import { getMinTouchTargetClasses } from '@/lib/design-token-utils';

interface FilterOption {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface FilterCategory {
  id: string;
  label: string;
  type: 'multi-select' | 'single-select' | 'range' | 'toggle';
  options?: FilterOption[];
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}

interface AdvancedFilterPanelProps {
  categories: FilterCategory[];
  values: Record<string, unknown>;
  onChange: (values: Record<string, unknown>) => void;
  onClose?: () => void;
  showActiveCount?: boolean;
}

export function AdvancedFilterPanel({
  categories,
  values,
  onChange,
  onClose,
  showActiveCount = true,
}: AdvancedFilterPanelProps) {
  const _uiConfig = useUIConfig();
  const {
    values: localValues,
    activeFiltersCount,
    applyFilters,
    resetFilters,
    handleMultiSelect,
    handleSingleSelect,
    handleRangeChange,
    handleToggle,
  } = useFilters({
    categories,
    initialValues: values,
    onApply: (vals) => {
      onChange(vals);
      onClose?.();
    },
  });

  const handleApply = useCallback(() => {
    applyFilters();
  }, [applyFilters]);

  return (
    <Card className={cn('w-full max-w-md', getSpacingClassesFromConfig({ padding: 'lg', spaceY: 'lg' }))}>
      <div className={cn('flex items-center justify-between')}>
        <div className={cn('flex items-center', getSpacingClassesFromConfig({ gap: 'sm' }))}>
          <Funnel size={20} weight="bold" className="text-(--primary)" aria-hidden="true" />
          <h3 className={cn(getTypographyClasses('h3'), 'text-(--text-primary)')}>
            Filters
          </h3>
          {showActiveCount && activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {activeFiltersCount}
            </Badge>
          )}
        </div>
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close filter panel"
          >
            <X size={20} />
          </Button>
        )}
      </div>

      <div className={cn(getSpacingClassesFromConfig({ spaceY: 'lg' }), 'max-h-[60vh] overflow-y-auto pr-2')}>
        {categories.map((category) => (
          <div key={category.id} className={getSpacingClassesFromConfig({ spaceY: 'md' })}>
            <Label className={cn(getTypographyClasses('caption'), 'font-medium text-(--text-primary)')}>
              {category.label}
            </Label>

            {category.type === 'multi-select' && category.options && (
              <div className={cn('flex flex-wrap', getSpacingClassesFromConfig({ gap: 'sm' }))}>
                {category.options.map((option) => {
                  const isSelected = ((localValues[category.id] as string[]) ?? []).includes(
                    option.id
                  );
                  return (
                    <FilterOptionButton
                      key={option.id}
                      option={option}
                      isSelected={isSelected}
                      onClick={() => handleMultiSelect(category.id, option.id)}
                      showCheck={true}
                    />
                  );
                })}
              </div>
            )}

            {category.type === 'single-select' && category.options && (
              <div className={cn('grid grid-cols-2', getSpacingClassesFromConfig({ gap: 'sm' }))}>
                {category.options.map((option) => {
                  const isSelected = localValues[category.id] === option.id;
                  return (
                    <FilterOptionButton
                      key={option.id}
                      option={option}
                      isSelected={isSelected}
                      onClick={() => handleSingleSelect(category.id, option.id)}
                      showCheck={false}
                      className="justify-center py-3 rounded-lg"
                    />
                  );
                })}
              </div>
            )}

            {category.type === 'range' && (
              <div className={getSpacingClassesFromConfig({ spaceY: 'md' })}>
                <div className={cn('flex items-center justify-between', getTypographyClasses('caption'))}>
                  <span className="text-(--text-muted)">
                    {category.min} {category.unit}
                  </span>
                  <span className="font-semibold text-(--primary)">
                    {(localValues[category.id] as number | undefined) ?? category.min ?? 0}{' '}
                    {category.unit}
                  </span>
                  <span className="text-(--text-muted)">
                    {category.max} {category.unit}
                  </span>
                </div>
                <Slider
                  value={(localValues[category.id] as number | undefined) ?? category.min ?? 0}
                  onValueChange={(value) => handleRangeChange(category.id, [value])}
                  min={category.min ?? 0}
                  max={category.max ?? 100}
                  step={category.step ?? 1}
                  className="w-full"
                  aria-label={`${category.label} range filter`}
                />
              </div>
            )}

            {category.type === 'toggle' && (
              <ToggleSwitch
                label={category.label}
                checked={localValues[category.id] as boolean}
                onChange={() => handleToggle(category.id)}
              />
            )}
          </div>
        ))}
      </div>

      <div className={cn('flex border-t', getSpacingClassesFromConfig({ gap: 'sm', paddingY: 'md' }))}>
        <Button
          variant="outline"
          onClick={resetFilters}
          className={cn('flex-1', getSpacingClassesFromConfig({ gap: 'sm' }))}
          disabled={activeFiltersCount === 0}
          aria-label="Reset all filters"
        >
          <Eraser size={16} aria-hidden="true" />
          Reset
        </Button>
        <Button 
          onClick={handleApply} 
          className={cn('flex-1', getSpacingClassesFromConfig({ gap: 'sm' }))}
          aria-label={`Apply ${activeFiltersCount > 0 ? `${activeFiltersCount} ` : ''}filters`}
        >
          <Check size={16} weight="bold" aria-hidden="true" />
          Apply Filters
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-1 bg-primary-foreground/20">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </div>
    </Card>
  );
}

interface FilterOptionButtonProps {
  option: FilterOption;
  isSelected: boolean;
  onClick: () => void;
  showCheck: boolean;
  className?: string;
}

function FilterOptionButton({
  option,
  isSelected,
  onClick,
  showCheck,
  className,
}: FilterOptionButtonProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const bounceAnimation = useBounceOnTap({ scale: 0.95, hapticFeedback: false });

  const ButtonComponent = prefersReducedMotion ? 'button' : motion.button;

  return (
    <ButtonComponent
      onClick={() => {
        if (!prefersReducedMotion) {
          bounceAnimation.handlePress();
        }
        onClick();
      }}
      aria-label={`${option.label} filter option`}
      aria-pressed={isSelected}
      variants={prefersReducedMotion ? undefined : bounceAnimation.variants}
      initial="rest"
      whileTap={prefersReducedMotion ? undefined : "tap"}
      whileHover={!prefersReducedMotion && !isSelected ? {
        borderColor: 'var(--primary)',
        transition: {
          duration: 0.2,
          ease: 'easeInOut',
        },
      } : undefined}
      transition={{
        duration: prefersReducedMotion ? 0 : 0.2,
        ease: 'easeInOut',
      }}
      className={cn(
        'flex items-center rounded-full border-2',
        getMinTouchTargetClasses(),
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--primary) focus-visible:ring-offset-2 focus-visible:ring-offset-(--background)',
        getTypographyClasses('caption'),
        getSpacingClassesFromConfig({ gap: 'sm', paddingX: 'lg', paddingY: 'sm' }),
        isSelected
          ? 'bg-(--primary) text-(--primary-foreground) border-(--primary)'
          : 'bg-(--background) border-(--border)',
        className
      )}
    >
      {option.icon && <span aria-hidden="true">{option.icon}</span>}
      <span>{option.label}</span>
      {showCheck && isSelected && <Check size={16} weight="bold" aria-hidden="true" />}
    </ButtonComponent>
  );
}

interface ToggleSwitchProps {
  label: string;
  checked: boolean;
  onChange: () => void;
}

function ToggleSwitch({ label, checked, onChange }: ToggleSwitchProps) {
  const reducedMotion = useReducedMotion();
  const toggleAnimation = useBounceOnTap({ scale: 0.95, hapticFeedback: false });

  const handleClick = useCallback(() => {
    if (!reducedMotion) {
      toggleAnimation.handlePress();
    }
    onChange();
  }, [onChange, toggleAnimation, reducedMotion]);

  const ButtonComponent = reducedMotion ? 'button' : motion.button;

  return (
    <ButtonComponent
      onClick={handleClick}
      role="switch"
      aria-checked={checked}
      aria-label={`${label} toggle`}
      variants={reducedMotion ? undefined : toggleAnimation.variants}
      initial="rest"
      whileTap={reducedMotion ? undefined : "tap"}
      whileHover={!reducedMotion ? {
        borderColor: 'var(--primary)',
        transition: {
          duration: 0.2,
          ease: 'easeInOut',
        },
      } : undefined}
      transition={{
        duration: reducedMotion ? 0 : 0.2,
        ease: 'easeInOut',
      }}
      className={cn(
        'flex items-center justify-between w-full rounded-lg border-2 border-(--border)',
        getMinTouchTargetClasses(),
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--primary) focus-visible:ring-offset-2 focus-visible:ring-offset-(--background)',
        getTypographyClasses('caption'),
        getSpacingClassesFromConfig({ padding: 'md' })
      )}
    >
      <span className="text-(--text-primary)">{label}</span>
      <motion.div
        className={cn(
          'w-11 h-6 rounded-full',
          checked ? 'bg-(--primary)' : 'bg-(--surface)'
        )}
        animate={{
          backgroundColor: checked ? 'var(--primary)' : 'var(--surface)',
        }}
        transition={{
          duration: reducedMotion ? 0 : 0.2,
          ease: 'easeInOut',
        }}
      >
        <motion.div
          animate={{ x: checked ? 20 : 0 }}
          transition={reducedMotion ? { duration: 0 } : {
            duration: motionDurations.normal / 1000,
            ease: 'easeOut',
          }}
          className="w-5 h-5 mt-0.5 ml-0.5 rounded-full bg-(--background) shadow-md"
          aria-hidden="true"
        />
      </motion.div>
    </ButtonComponent>
  );
}
