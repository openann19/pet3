import type { ComponentProps } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center justify-center rounded-[var(--radius-sm)] border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-[var(--coral-primary)] focus-visible:ring-[var(--coral-primary)]/50 focus-visible:ring-[3px] aria-invalid:ring-[var(--error)]/20 dark:aria-invalid:ring-[var(--error)]/40 aria-invalid:border-[var(--error)] transition-[color,box-shadow] overflow-hidden',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-[var(--coral-primary)] text-white [a&]:hover:bg-[var(--coral-hover)]',
        secondary:
          'border-transparent bg-[var(--secondary-accent-orange)] text-[var(--text-primary)] [a&]:hover:bg-[var(--secondary-accent-yellow)]',
        destructive:
          'border-transparent bg-[var(--error)] text-white [a&]:hover:bg-[var(--coral-hover)] focus-visible:ring-[var(--error)]/20 dark:focus-visible:ring-[var(--error)]/40',
        outline: 'text-[var(--text-primary)] border-[var(--border-light)] [a&]:hover:bg-[var(--secondary-accent-orange)] [a&]:hover:text-[var(--text-primary)]',
        success: 'border-transparent bg-[var(--success)] text-white [a&]:hover:bg-[var(--success)]/90',
        warning: 'border-transparent bg-[var(--warning)] text-[var(--text-primary)] [a&]:hover:bg-[var(--warning)]/90',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: ComponentProps<'span'> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : 'span';

  return (
    <Comp data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
