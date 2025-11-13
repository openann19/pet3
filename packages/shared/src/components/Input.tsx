import type { InputHTMLAttributes, ReactNode } from 'react';
import { cn } from '../utils/cn';
import { FocusRing } from '../tokens/focusRing';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  readonly label: string;
  readonly helperText?: ReactNode;
  readonly errorText?: ReactNode;
  readonly ariaLabel?: string;
}

export function Input({ label, helperText, errorText, ariaLabel, className, id, ...props }: InputProps) {
  const inputId = id || `input-${label.replace(/\s+/g, '-').toLowerCase()}`;
  const isError = Boolean(errorText);
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={inputId} className="text-sm font-medium text-primary">
        {label}
      </label>
      <input
        id={inputId}
        aria-label={ariaLabel || label}
        aria-invalid={isError}
        className={cn(
          'min-h-[44px] px-3 py-2 rounded-lg border border-input bg-background text-primary placeholder:text-muted-foreground transition-all duration-150 ease-out',
          FocusRing.input,
          isError && 'border-destructive',
          className
        )}
        {...props}
      />
      {helperText && !isError && (
        <span className="text-xs text-muted-foreground">{helperText}</span>
      )}
      {isError && (
        <span className="text-xs text-destructive flex items-center gap-1">
          <svg aria-hidden="true" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01"/></svg>
          {errorText}
        </span>
      )}
    </div>
  );
}
