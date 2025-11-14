'use client';

import type { ComponentProps } from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { Check } from 'lucide-react';
import { motion } from 'framer-motion';

import { cn } from '@/lib/utils';
import { getAriaFormFieldAttributes } from '@/lib/accessibility';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { motionDurations, easing } from '@/effects/framer-motion/variants';

function Checkbox({ className, ...props }: ComponentProps<typeof CheckboxPrimitive.Root>) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        'peer size-[18px] shrink-0 rounded-[4px] border border-(--border-light) bg-white outline-none',
        'data-[state=checked]:bg-(--coral-primary) data-[state=checked]:border-(--coral-primary) data-[state=checked]:text-white',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--coral-primary)] focus-visible:ring-offset-2',
        'aria-invalid:border-destructive',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...getAriaFormFieldAttributes({
        invalid: props['aria-invalid'] === 'true' ? true : undefined,
        disabled: props.disabled,
      })}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        asChild
        aria-hidden="true"
      >
        <motion.div
          className="flex items-center justify-center text-current"
          initial={false}
          variants={{
            checked: {
              scale: 1,
              opacity: 1,
            },
            unchecked: {
              scale: 0,
              opacity: 0,
            },
          }}
          animate={props.checked || props['data-state'] === 'checked' ? 'checked' : 'unchecked'}
          transition={{
            duration: prefersReducedMotion ? 0 : motionDurations.fast,
            ease: easing.standard,
          }}
        >
          <Check className="size-3.5" aria-hidden="true" />
        </motion.div>
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
