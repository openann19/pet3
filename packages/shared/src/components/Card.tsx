
import type { ReactNode, HTMLAttributes } from 'react';
import { cn } from '../utils/cn';
import { FocusRing } from '../tokens/focusRing';

interface CardProps extends HTMLAttributes<HTMLElement> {
  readonly ariaLabel?: string;
  readonly children: ReactNode;
  readonly tabIndex?: number;
}

export function Card({ className, ariaLabel, children, tabIndex = -1, ...props }: CardProps) {
  return (
    <section
      role="region"
      aria-label={ariaLabel}
      tabIndex={tabIndex}
      data-slot="card"
      className={cn(
        'bg-card text-card-foreground flex flex-col gap-6 rounded-xl border border-border/60 shadow-lg hover:shadow-xl hover:border-border/80 hover:-translate-y-0.5 transition-all duration-200 ease-out backdrop-blur-sm',
        FocusRing.button,
        className
      )}
      {...props}
    >
      {children}
    </section>
  );
}


interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  readonly children: ReactNode;
}
export function CardHeader({ className, children, ...props }: CardHeaderProps) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        '@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}


interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  readonly children: ReactNode;
}
export function CardTitle({ className, children, ...props }: CardTitleProps) {
  return (
    <h2
      data-slot="card-title"
      className={cn('leading-none font-semibold text-[clamp(1.5rem,2vw,2rem)]', className)}
      {...props}
    >
      {children}
    </h2>
  );
}


interface CardDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {
  readonly children: ReactNode;
}
export function CardDescription({ className, children, ...props }: CardDescriptionProps) {
  return (
    <p
      data-slot="card-description"
      className={cn('text-muted-foreground text-sm', className)}
      {...props}
    >
      {children}
    </p>
  );
}


interface CardActionProps extends HTMLAttributes<HTMLDivElement> {
  readonly children: ReactNode;
}
export function CardAction({ className, children, ...props }: CardActionProps) {
  return (
    <div
      data-slot="card-action"
      className={cn('col-start-2 row-span-2 row-start-1 self-start justify-self-end', className)}
      {...props}
    >
      {children}
    </div>
  );
}


interface CardContentProps extends HTMLAttributes<HTMLDivElement> {
  readonly children: ReactNode;
}
export function CardContent({ className, children, ...props }: CardContentProps) {
  return (
    <div data-slot="card-content" className={cn('px-6', className)} {...props}>
      {children}
    </div>
  );
}


interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  readonly children: ReactNode;
}
export function CardFooter({ className, children, ...props }: CardFooterProps) {
  return (
    <div
      data-slot="card-footer"
      className={cn('flex items-center px-6 [.border-t]:pt-6', className)}
      {...props}
    >
      {children}
    </div>
  );
}


// Export all components
// Card, CardHeader, CardFooter, CardTitle, CardAction, CardDescription, CardContent
