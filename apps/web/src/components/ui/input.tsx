import type { ComponentProps } from "react"
import { forwardRef } from "react"
import { motion, type HTMLMotionProps } from "framer-motion"

import { cn } from "@/lib/utils"
import { getTypographyClasses, getSpacingClassesFromConfig } from "@/lib/typography"
import { useReducedMotion } from "@/hooks/useReducedMotion"
import { useMotionTokens } from "@/hooks/useMotionTokens"

export interface InputProps extends Omit<ComponentProps<"input">, "ref"> {
  label?: string
  error?: string
  helperText?: string
  "aria-label"?: string
  "aria-describedby"?: string
  "aria-invalid"?: boolean
  enableAnimations?: boolean
}

const inputVariants = {
  rest: {
    borderColor: "rgb(209, 213, 219)",
    boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
  },
  hover: {
    borderColor: "rgb(156, 163, 175)",
    boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1)",
  },
  focus: {
    borderColor: "rgb(59, 130, 246)",
    boxShadow: "0 0 0 2px rgb(59, 130, 246 / 0.2), 0 1px 3px 0 rgb(0 0 0 / 0.1)",
  },
  error: {
    borderColor: "rgb(239, 68, 68)",
    boxShadow: "0 0 0 2px rgb(239, 68, 68 / 0.2)",
  },
} as const

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, helperText, id, "aria-label": ariaLabel, "aria-describedby": ariaDescribedBy, "aria-invalid": ariaInvalid, enableAnimations = true, ...props }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).slice(2, 11)}`
    const errorId = error ? `${inputId}-error` : undefined
    const helperId = helperText ? `${inputId}-helper` : undefined
    const describedBy = [errorId, helperId, ariaDescribedBy].filter(Boolean).join(' ') || undefined
    const isInvalid = ariaInvalid !== undefined ? ariaInvalid : Boolean(error)
    const reducedMotion = useReducedMotion()
    const tokens = useMotionTokens()
    const shouldAnimate = enableAnimations && !reducedMotion

    const baseClassName = cn(
      "flex w-full min-w-0 rounded-lg border bg-background text-foreground outline-none",
      getTypographyClasses('body'),
      getSpacingClassesFromConfig({ paddingX: 'md', paddingY: 'xs' }),
      "placeholder:text-muted-foreground",
      "selection:bg-primary selection:text-primary-foreground",
      "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
      "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted/30",
      "read-only:bg-muted/20 read-only:cursor-default",
      isInvalid && "ring-2 ring-red-500/20",
      className
    )

    const motionProps: Partial<HTMLMotionProps<"input">> = shouldAnimate
      ? {
          variants: inputVariants,
          initial: "rest",
          whileHover: !isInvalid ? "hover" : undefined,
          whileFocus: !isInvalid ? "focus" : "error",
          animate: isInvalid ? "error" : "rest",
          transition: {
            duration: tokens.durations.fast,
            ease: tokens.easing.standard,
          },
        }
      : {}

    const inputProps = {
      ref,
      type,
      id: inputId,
      "data-slot": "input",
      className: baseClassName,
      "aria-label": ariaLabel || (label ? undefined : 'Input field'),
      "aria-describedby": describedBy,
      "aria-invalid": isInvalid,
      "aria-errormessage": errorId,
      ...props,
    }

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
        {shouldAnimate ? (
          <motion.input
            {...motionProps}
            {...inputProps}
          />
        ) : (
          <input {...inputProps} />
        )}
        {error && (
          <motion.p
            id={errorId}
            className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center gap-1"
            role="alert"
            aria-live="polite"
            initial={shouldAnimate ? { opacity: 0, y: -4 } : false}
            animate={shouldAnimate ? { opacity: 1, y: 0 } : false}
            transition={shouldAnimate ? {
              duration: tokens.durations.fast,
              ease: tokens.easing.standard,
            } : undefined}
          >
            <span aria-hidden="true">⚠</span>
            {error}
          </motion.p>
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
