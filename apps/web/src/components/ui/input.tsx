import type { ComponentProps } from "react"

import { cn } from "@/lib/utils"
import { getTypographyClasses, getSpacingClassesFromConfig } from "@/lib/typography"

function Input({ className, type, ...props }: ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex w-full min-w-0 rounded-xl border border-border bg-card text-foreground shadow-sm transition-all duration-150 outline-none",
        getTypographyClasses('body'),
        getSpacingClassesFromConfig({ paddingX: 'md', paddingY: 'xs' }),
        "placeholder:text-muted-foreground placeholder:transition-opacity",
        "selection:bg-primary selection:text-primary-foreground",
        "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
        "focus:border-ring focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background focus:placeholder:opacity-60",
        "hover:border-muted-foreground/50",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-muted/30",
        "aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/30",
        "read-only:bg-muted/20 read-only:text-muted-foreground read-only:cursor-default",
        className
      )}
      {...props}
    />
  )
}

export { Input }
