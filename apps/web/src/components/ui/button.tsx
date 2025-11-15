import type { ComponentProps } from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { getTypographyClasses, getSpacingClassesFromConfig } from "@/lib/typography"

const buttonVariants = cva(
  cn(
    'inline-flex items-center justify-center whitespace-nowrap rounded-[var(--radius-xl)] transition-all duration-200 disabled:pointer-events-none disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg:not([class*="size-"])]:size-5 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background aria-invalid:ring-destructive/30 aria-invalid:border-destructive min-h-[44px] min-w-[44px] shadow-sm hover:shadow-md active:shadow-none',
    getTypographyClasses('body'),
    getSpacingClassesFromConfig({ gap: 'sm' })
  ),
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/90 active:bg-secondary/80',
        destructive:
          'bg-destructive text-destructive-foreground hover:bg-destructive/90 active:bg-destructive/80',
        outline:
          'border border-border bg-background text-foreground hover:bg-card hover:text-foreground focus-visible:ring-ring',
        muted:
          'bg-muted text-muted-foreground hover:bg-muted/80',
        ghost:
          'bg-transparent text-foreground hover:bg-muted/40',
        link: 'text-primary underline-offset-4 hover:underline bg-transparent shadow-none px-0',
      },
      size: {
        default:
          'h-11 px-5 has-[>svg]:px-4 [&_svg]:size-5',
        sm: 'h-9 rounded-lg gap-1.5 px-3 has-[>svg]:px-2.5 [&_svg]:size-4',
        lg: 'h-14 rounded-2xl px-7 has-[>svg]:px-5 [&_svg]:size-6',
        icon: 'size-11 min-w-[44px] min-h-[44px]',
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
