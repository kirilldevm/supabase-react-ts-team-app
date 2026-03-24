import { cn } from '@/lib/utils';
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog';
import { X } from 'lucide-react';
import * as React from 'react';

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogPortal = DialogPrimitive.Portal;
const DialogClose = DialogPrimitive.Close;

function DialogBackdrop({ className, ...props }: DialogPrimitive.Backdrop.Props) {
  return (
    <DialogPrimitive.Backdrop
      className={cn(
        'fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity duration-200',
        'data-ending-style:opacity-0 data-starting-style:opacity-0',
        className,
      )}
      {...props}
    />
  );
}

function DialogPopup({
  className,
  children,
  ...props
}: DialogPrimitive.Popup.Props) {
  return (
    <DialogPrimitive.Popup
      className={cn(
        'fixed top-1/2 left-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2',
        'rounded-xl border border-border bg-background p-6 shadow-xl',
        'transition-all duration-200',
        'data-ending-style:scale-95 data-ending-style:opacity-0',
        'data-starting-style:scale-95 data-starting-style:opacity-0',
        className,
      )}
      {...props}
    >
      {children}
    </DialogPrimitive.Popup>
  );
}

function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex flex-col gap-1.5 pb-4', className)}
      {...props}
    />
  );
}

function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex justify-end gap-2 pt-4', className)}
      {...props}
    />
  );
}

function DialogTitle({ className, ...props }: DialogPrimitive.Title.Props) {
  return (
    <DialogPrimitive.Title
      className={cn('text-lg font-semibold leading-none tracking-tight', className)}
      {...props}
    />
  );
}

function DialogDescription({ className, ...props }: DialogPrimitive.Description.Props) {
  return (
    <DialogPrimitive.Description
      className={cn('text-muted-foreground text-sm', className)}
      {...props}
    />
  );
}

function DialogCloseButton({ className, ...props }: DialogPrimitive.Close.Props) {
  return (
    <DialogPrimitive.Close
      aria-label='Close'
      className={cn(
        'absolute top-4 right-4 rounded-md p-1 opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className,
      )}
      {...props}
    >
      <X className='size-4' />
    </DialogPrimitive.Close>
  );
}

export {
  Dialog,
  DialogBackdrop,
  DialogClose,
  DialogCloseButton,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPopup,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};
