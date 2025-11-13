'use client';
import { motion } from 'framer-motion';

import React, { useCallback } from 'react';
import { useMotionValue, animate } from 'framer-motion';
import { springConfigs, motionDurations } from '@/effects/framer-motion/variants';
import { haptics } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import { useUIConfig } from "@/hooks/use-ui-config";
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { getTypographyClasses } from '@/lib/typography';
import { getMinTouchTargetClasses } from '@/lib/design-token-utils';
import { getSpacing } from '@/lib/design-tokens';

export interface StepperStep {
  id: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  optional?: boolean;
}

export interface StepperProps {
  steps: StepperStep[];
  currentStep: number;
  onStepClick?: (stepIndex: number) => void;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

export function Stepper({
  steps,
  currentStep,
  onStepClick,
  orientation = 'horizontal',
  className,
}: StepperProps): React.JSX.Element {
  const _uiConfig = useUIConfig();
  const reducedMotion = useReducedMotion();
  const progressWidth = useMotionValue(0);

  const handleStepClick = useCallback(
    (index: number) => {
      if (onStepClick && index <= currentStep) {
        onStepClick(index);
        haptics.selection();
      }
    },
    [onStepClick, currentStep]
  );

  const progressPercentage = steps.length > 1 ? (currentStep / (steps.length - 1)) * 100 : 0;

  React.useEffect(() => {
    if (reducedMotion) {
      progressWidth.set(progressPercentage);
      return;
    }
    void animate(progressWidth, progressPercentage, {
      ...springConfigs.smooth,
      duration: motionDurations.smooth,
    });
  }, [progressPercentage, progressWidth, reducedMotion]);

  if (orientation === 'vertical') {
    return (
      <div className={cn('flex flex-col', className)}>
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isUpcoming = index > currentStep;

          return (
            <div key={step.id} className="flex items-start gap-4">
              <div className="flex flex-col items-center">
                <button
                  onClick={() => { handleStepClick(index); }}
                  disabled={isUpcoming}
                  className={cn(
                    'flex items-center justify-center rounded-full border-2',
                    reducedMotion ? '' : 'transition-all duration-200',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--primary) focus-visible:ring-offset-2 focus-visible:ring-offset-(--background)',
                    isCompleted && 'bg-(--primary) border-(--primary) text-(--primary-foreground)',
                    isCurrent && cn('bg-(--primary) border-(--primary) text-(--primary-foreground)', reducedMotion ? '' : 'scale-110'),
                    isUpcoming && 'bg-(--surface) border-(--border) text-(--text-muted)',
                    isUpcoming && 'cursor-not-allowed',
                    'w-10 h-10',
                    getMinTouchTargetClasses()
                  )}
                >
                  {isCompleted ? (
                    <Check size={20} />
                  ) : (
                    <span className="text-sm font-bold">{index + 1}</span>
                  )}
                </button>
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      'w-0.5 my-2',
                      reducedMotion ? '' : 'transition-colors duration-300',
                      isCompleted ? 'bg-(--primary)' : 'bg-(--surface)'
                    )}
                    style={{ height: getSpacing('10') }}
                  />
                )}
              </div>
              <div className="flex-1 pb-8">
                <button
                  onClick={() => { handleStepClick(index); }}
                  disabled={isUpcoming}
                  className={cn('text-left', isUpcoming && 'cursor-not-allowed')}
                >
                  <div
                    className={cn(
                      getTypographyClasses('body-sm'),
                      reducedMotion ? '' : 'transition-colors duration-200',
                      isCompleted || isCurrent ? 'text-(--text-primary)' : 'text-(--text-muted)'
                    )}
                  >
                    {step.label}
                    {step.optional && (
                      <span className={cn(getTypographyClasses('body'), 'text-(--text-muted) font-normal ml-1')}>
                        (Optional)
                      </span>
                    )}
                  </div>
                  {step.description && (
                    <div className={cn(getTypographyClasses('body'), 'text-(--text-muted) mt-1')}>
                      {step.description}
                    </div>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className={cn('w-full', className)}>
      <div className="relative flex items-center justify-between mb-4">
        <motion.div
          style={{ width: progressWidth }}
          className={cn(
            'absolute top-5 left-0 h-0.5 bg-(--primary)'
          )}
          transition={reducedMotion ? { duration: 0 } : {
            ...springConfigs.smooth,
            duration: motionDurations.smooth,
          }}
        />
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-(--surface)" />

        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isUpcoming = index > currentStep;

          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center flex-1">
              <button
                onClick={() => { handleStepClick(index); }}
                disabled={isUpcoming}
                className={cn(
                  'flex items-center justify-center rounded-full border-2',
                  reducedMotion ? '' : 'transition-all duration-200',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--primary) focus-visible:ring-offset-2 focus-visible:ring-offset-(--background)',
                  isCompleted && 'bg-(--primary) border-(--primary) text-(--primary-foreground)',
                  isCurrent &&
                    cn(
                      'bg-(--primary) border-(--primary) text-(--primary-foreground) shadow-lg',
                      reducedMotion ? '' : 'scale-110'
                    ),
                  isUpcoming && 'bg-(--surface) border-(--border) text-(--text-muted)',
                  isUpcoming && 'cursor-not-allowed',
                  'w-10 h-10',
                  getMinTouchTargetClasses()
                )}
              >
                {isCompleted ? (
                  <Check size={20} />
                ) : (
                  <span className="text-sm font-bold">{index + 1}</span>
                )}
              </button>
              <div className="mt-2 text-center">
                <div
                  className={cn(
                    'text-sm font-semibold',
                    isCompleted || isCurrent ? 'text-foreground' : 'text-muted-foreground'
                  )}
                >
                  {step.label}
                </div>
                {step.description && (
                  <div className="text-xs text-muted-foreground mt-1">{step.description}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
