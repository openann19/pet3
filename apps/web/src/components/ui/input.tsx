import type { ComponentProps } from "react"
import { forwardRef } from "react"

import { cn } from "@/lib/utils"
import { getTypographyClasses, getSpacingClassesFromConfig } from "@/lib/typography"

export interface InputProps extends ComponentProps<"input"> {
  label?: string
  error?: string
  helperText?: string
  "aria-label"?: string
  "aria-describedby"?: string
  "aria-invalid"?: boolean
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, helperText, id, "aria-label": ariaLabel, "aria-describedby": ariaDescribedBy, "aria-invalid": ariaInvalid, ...props }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).slice(2, 11)}`
    const errorId = error ? `${inputId}-error` : undefined
    const helperId = helperText ? `${inputId}-helper` : undefined
    const describedBy = [errorId, helperId, ariaDescribedBy].filter(Boolean).join(' ') || undefined
    const isInvalid = ariaInvalid !== undefined ? ariaInvalid : Boolean(error)

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-foreground mb-1.5"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          type={type}
          id={inputId}
          data-slot="input"
          className={cn(
            "flex w-full min-w-0 rounded-lg border border-gray-300 bg-background text-foreground shadow-sm transition-all duration-200 outline-none",
            "motion-reduce:transition-none",
            getTypographyClasses('body'),
            getSpacingClassesFromConfig({ paddingX: 'md', paddingY: 'xs' }),
            "placeholder:text-muted-foreground placeholder:transition-opacity",
            "selection:bg-primary selection:text-primary-foreground",
            "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
            "focus:border-blue-500 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:placeholder:opacity-50 focus:shadow-md",
            "hover:border-gray-400 hover:shadow-md",
            "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted/30",
            isInvalid && "border-red-500 ring-2 ring-red-500/20",
            "read-only:bg-muted/20 read-only:cursor-default",
            className
          )}
          aria-label={ariaLabel || (label ? undefined : 'Input field')}
          aria-describedby={describedBy}
          aria-invalid={isInvalid}
          aria-errormessage={errorId}
          {...props}
        />
        {error && (
          <p
            id={errorId}
            className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1"
            role="alert"
            aria-live="polite"
          >
            <span aria-hidden="true">⚠</span>
            {error}
          </p>
        )}
        {helperText && !error && (
          <p
            id={helperId}
            className="mt-1.5 text-sm text-muted-foreground"
          >
            {helperText}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = "Input"

export { Input }
