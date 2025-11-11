import type { ComponentProps } from 'react';

import { cn } from '@/lib/utils';
import { FocusRing } from '@/core/tokens';

function Input({ className, type, ...props }: ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'flex h-[50px] w-full min-w-0 rounded-[var(--radius-md)] border border-[var(--border-light)] bg-white px-4 text-[var(--text-md)] text-[var(--text-primary)] transition-colors duration-200 outline-none',
        'placeholder:text-[var(--text-tertiary)]',
        'selection:bg-primary selection:text-primary-foreground',
        'file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground',
        `focus:border-[var(--coral-primary)] ${FocusRing.input}`,
        'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-[var(--muted)] disabled:text-[var(--disabled)]',
        'aria-invalid:border-[var(--error)] aria-invalid:ring-2 aria-invalid:ring-[var(--error)]/20',
        'read-only:bg-muted/20 read-only:cursor-default',
        className
      )}
      {...props}
    />
  );
}

export { Input };
