import type { ComponentProps } from "react"
import { forwardRef } from "react"
import { motion, type HTMLMotionProps } from "framer-motion"

import { cn } from "@/lib/utils"
import { getTypographyClasses, getSpacingClassesFromConfig } from "@/lib/typography"
import { useReducedMotion } from "@/hooks/useReducedMotion"
import { useMotionTokens } from "@/hooks/useMotionTokens"

export interface TextareaProps extends Omit<ComponentProps<"textarea">, "ref"> {
  enableAnimations?: boolean
}

const textareaVariants = {
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

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, enableAnimations = true, ...props }, ref) => {
    const reducedMotion = useReducedMotion()
    const tokens = useMotionTokens()
    const shouldAnimate = enableAnimations && !reducedMotion
    const isInvalid = props["aria-invalid"] === true

    const baseClassName = cn(
      "flex field-sizing-content min-h-16 w-full rounded-lg border bg-background text-foreground outline-none",
      getTypographyClasses('body'),
      getSpacingClassesFromConfig({ paddingX: 'md', paddingY: 'sm' }),
      "placeholder:text-muted-foreground",
      "selection:bg-primary selection:text-primary-foreground",
      "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted/30",
      "read-only:bg-muted/20 read-only:cursor-default",
      isInvalid && "ring-2 ring-red-500/20",
      className
    )

    const motionProps: Partial<HTMLMotionProps<"textarea">> = shouldAnimate
      ? {
          variants: textareaVariants,
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

    const textareaProps = {
      ref,
      "data-slot": "textarea",
      className: baseClassName,
      ...props,
    }

    return shouldAnimate ? (
      <motion.textarea
        {...motionProps}
        {...textareaProps}
      />
    ) : (
      <textarea {...textareaProps} />
    )
  }
)

Textarea.displayName = "Textarea"

export { Textarea }
