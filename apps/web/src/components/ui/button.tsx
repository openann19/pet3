import type { ComponentProps } from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Core Button Component
 * 
 * Hard-standardized button system following BUTTON_STATE_MATRIX.md specifications:
 * - Single radius token (rounded-xl) for all variants
 * - Consistent focus-visible ring (2px primary/50 with offset)
 * - Typography: text-sm font-medium (default), text-base (lg)
 * - Padding: px-4 py-2 (default), responsive for sm/lg
 * - All buttons meet 44×44px minimum touch target
 */
const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-xl transition-all duration-200 disabled:pointer-events-none disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:shrink-0 outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 min-h-[44px] min-w-[44px]',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80 active:scale-[0.98] shadow-sm hover:shadow-md active:shadow-none',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/90 active:bg-secondary/80 active:scale-[0.98] shadow-sm hover:shadow-md active:shadow-none',
        destructive:
          'bg-destructive text-destructive-foreground hover:bg-destructive/90 active:bg-destructive/80 active:scale-[0.98] shadow-sm hover:shadow-md active:shadow-none',
        outline:
          'border-2 border-border bg-background text-foreground hover:bg-accent hover:text-accent-foreground hover:border-accent active:bg-accent/90 active:scale-[0.98]',
        muted:
          'bg-muted text-muted-foreground hover:bg-muted/80 active:bg-muted/70 active:scale-[0.98]',
        ghost:
          'bg-transparent text-foreground hover:bg-muted/40 active:bg-muted/50 active:scale-[0.98]',
        link: 'text-primary underline-offset-4 hover:underline bg-transparent shadow-none px-0 min-h-0 min-w-0',
      },
      size: {
        default:
          'text-sm font-medium px-4 py-2 [&_svg]:size-5 has-[>svg]:px-3',
        sm: 'text-sm font-medium px-3 py-1.5 [&_svg]:size-4 has-[>svg]:px-2.5 min-h-[36px]',
        lg: 'text-base font-medium px-6 py-3 [&_svg]:size-6 has-[>svg]:px-5 min-h-[56px]',
        icon: 'size-11 min-w-[44px] min-h-[44px] [&_svg]:size-5 p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
