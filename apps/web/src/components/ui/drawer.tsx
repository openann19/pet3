import type { ComponentProps } from 'react';
import { Drawer as VaulDrawer, Root as VaulRoot, Trigger as VaulTrigger, Portal as VaulPortal, Close as VaulClose, Overlay as VaulOverlay, Content as VaulContent, Handle as VaulHandle, Title as VaulTitle, Description as VaulDescription } from 'vaul';

import { cn } from '@/lib/utils';

function Drawer({ ...props }: ComponentProps<typeof VaulRoot>) {
  return <VaulRoot data-slot="drawer" {...props} />;
}

function DrawerTrigger({ ...props }: ComponentProps<typeof VaulTrigger>) {
  return <VaulTrigger data-slot="drawer-trigger" {...props} />;
}

function DrawerPortal({ ...props }: ComponentProps<typeof VaulPortal>) {
  return <VaulPortal data-slot="drawer-portal" {...props} />;
}

function DrawerClose({ ...props }: ComponentProps<typeof VaulClose>) {
  return <VaulClose data-slot="drawer-close" {...props} />;
}

function DrawerOverlay({ className, ...props }: ComponentProps<typeof VaulOverlay>) {
  return (
    <VaulOverlay
      data-slot="drawer-overlay"
      className={cn(
        'fixed inset-0 z-50 bg-background/80 backdrop-blur-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        className
      )}
      {...props}
    />
  );
}

function DrawerContent({
  className,
  children,
  ...props
}: ComponentProps<typeof VaulContent>) {
  return (
    <DrawerPortal data-slot="drawer-portal">
      <DrawerOverlay />
      <VaulContent
        data-slot="drawer-content"
        className={cn(
          'group/drawer-content fixed z-50 flex h-auto flex-col rounded-none border border-border bg-card text-card-foreground shadow-2xl',
          'data-[vaul-drawer-direction=top]:inset-x-0 data-[vaul-drawer-direction=top]:top-0 data-[vaul-drawer-direction=top]:mb-24 data-[vaul-drawer-direction=top]:max-h-[80vh] data-[vaul-drawer-direction=top]:rounded-b-lg data-[vaul-drawer-direction=top]:border-b',
          'data-[vaul-drawer-direction=bottom]:inset-x-0 data-[vaul-drawer-direction=bottom]:bottom-0 data-[vaul-drawer-direction=bottom]:mt-24 data-[vaul-drawer-direction=bottom]:max-h-[80vh] data-[vaul-drawer-direction=bottom]:rounded-t-lg data-[vaul-drawer-direction=bottom]:border-t',
          'data-[vaul-drawer-direction=right]:inset-y-0 data-[vaul-drawer-direction=right]:right-0 data-[vaul-drawer-direction=right]:w-3/4 data-[vaul-drawer-direction=right]:border-l data-[vaul-drawer-direction=right]:sm:max-w-sm',
          'data-[vaul-drawer-direction=left]:inset-y-0 data-[vaul-drawer-direction=left]:left-0 data-[vaul-drawer-direction=left]:w-3/4 data-[vaul-drawer-direction=left]:border-r data-[vaul-drawer-direction=left]:sm:max-w-sm',
          className
        )}
        {...props}
      >
        <div className="mx-auto mt-4 hidden h-2 w-16 shrink-0 rounded-full bg-muted/60 group-data-[vaul-drawer-direction=bottom]/drawer-content:block" />
        {children}
      </VaulContent>
    </DrawerPortal>
  );
}

function DrawerHeader({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="drawer-header"
      className={cn('flex flex-col gap-1.5 p-4', className)}
      {...props}
    />
  );
}

function DrawerFooter({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="drawer-footer"
      className={cn('mt-auto flex flex-col gap-2 p-4', className)}
      {...props}
    />
  );
}

function DrawerTitle({ className, ...props }: ComponentProps<typeof VaulTitle>) {
  return (
    <VaulTitle
      data-slot="drawer-title"
      className={cn('text-foreground font-semibold', className)}
      {...props}
    />
  );
}

function DrawerDescription({
  className,
  ...props
}: ComponentProps<typeof VaulDescription>) {
  return (
    <VaulDescription
      data-slot="drawer-description"
      className={cn('text-muted-foreground text-sm', className)}
      {...props}
    />
  );
}

export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
};
