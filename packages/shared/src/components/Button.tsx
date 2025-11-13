import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '../utils/cn';
import { FocusRing } from '../tokens/focusRing';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly children: ReactNode;
  readonly variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  readonly ariaLabel?: string;
}

const variantClasses: Record<string, string> = {
  primary: 'bg-primary text-primary-foreground border border-primary shadow-base',
  secondary: 'bg-secondary text-secondary-foreground border border-secondary shadow-base',
  ghost: 'bg-transparent text-primary border border-transparent shadow-none',
  destructive: 'bg-destructive text-destructive-foreground border border-destructive shadow-base',
};

export function Button({ children, className, variant = 'primary', ariaLabel, disabled, ...props }: ButtonProps) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      disabled={disabled}
      className={cn(
        'min-w-[44px] min-h-[44px] px-4 py-2 rounded-xl font-semibold transition-all duration-150 ease-out focus-visible:outline-none',
        FocusRing.button,
        variantClasses[variant],
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
