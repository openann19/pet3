'use client';

import * as React from 'react';
import * as SwitchPrimitives from '@radix-ui/react-switch';
import { cn } from '@/lib/utils';

export interface SwitchProps
  extends Omit<
    React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>,
    'checked' | 'onCheckedChange'
  > {
  checked: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  SwitchProps
>(({ className, checked, onCheckedChange, ...props }, ref) => (
  <SwitchPrimitives.Root
    ref={ref}
    checked={checked}
    onCheckedChange={onCheckedChange}
    className={cn(
      'peer inline-flex h-[20px] w-[36px] shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent bg-input shadow-sm transition-colors data-[state=checked]:bg-primary data-[state=unchecked]:bg-input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
      className,
    )}
    {...props}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        'pointer-events-none block h-[14px] w-[14px] rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-[16px] data-[state=unchecked]:translate-x-0',
      )}
    />
  </SwitchPrimitives.Root>
));

Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
