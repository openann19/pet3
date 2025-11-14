'use client';

import type { ComponentProps } from 'react';
import { useContext } from 'react';
import { OTPInput, OTPInputContext } from 'input-otp';
import { Minus } from 'lucide-react';
import { motion } from 'framer-motion';

import { cn } from '@/lib/utils';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useMotionTokens } from '@/hooks/useMotionTokens';

function InputOTP({
  className,
  containerClassName,
  ...props
}: ComponentProps<typeof OTPInput> & {
  containerClassName?: string;
}) {
  return (
    <OTPInput
      data-slot="input-otp"
      containerClassName={cn('flex items-center gap-2 has-disabled:opacity-50', containerClassName)}
      className={cn('disabled:cursor-not-allowed', className)}
      {...props}
    />
  );
}

function InputOTPGroup({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div data-slot="input-otp-group" className={cn('flex items-center', className)} {...props} />
  );
}

const slotVariants = {
  inactive: {
    borderColor: "rgb(229, 231, 235)",
    boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
    scale: 1,
  },
  active: {
    borderColor: "rgb(59, 130, 246)",
    boxShadow: "0 0 0 2px rgb(59, 130, 246 / 0.2), 0 1px 3px 0 rgb(0 0 0 / 0.1)",
    scale: 1.02,
  },
  error: {
    borderColor: "rgb(239, 68, 68)",
    boxShadow: "0 0 0 2px rgb(239, 68, 68 / 0.2)",
    scale: 1,
  },
} as const;

function InputOTPSlot({
  index,
  className,
  enableAnimations = true,
  ...props
}: ComponentProps<'div'> & {
  index: number;
  enableAnimations?: boolean;
}) {
  const inputOTPContext = useContext(OTPInputContext);
  const { char, hasFakeCaret, isActive } = inputOTPContext?.slots[index] ?? {};
  const reducedMotion = useReducedMotion();
  const tokens = useMotionTokens();
  const shouldAnimate = enableAnimations && !reducedMotion;
  const isInvalid = props["aria-invalid"] === true || props["aria-invalid"] === "true";

  const baseClassName = cn(
    'data-[active=true]:border-ring data-[active=true]:ring-ring/50 data-[active=true]:aria-invalid:ring-destructive/20 dark:data-[active=true]:aria-invalid:ring-destructive/40 aria-invalid:border-destructive data-[active=true]:aria-invalid:border-destructive dark:bg-input/30 border-input relative flex h-9 w-9 items-center justify-center border-y border-r text-sm shadow-xs outline-none first:rounded-l-md first:border-l last:rounded-r-md data-[active=true]:z-10 data-[active=true]:ring-[3px]',
    className
  );

  const motionProps = shouldAnimate
    ? {
        variants: slotVariants,
        initial: "inactive",
        animate: isInvalid ? "error" : isActive ? "active" : "inactive",
        transition: {
          duration: tokens.durations.fast,
          ease: tokens.easing.standard,
        },
      }
    : {};

  const slotContent = (
    <>
      {char}
      {hasFakeCaret && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="animate-caret-blink bg-foreground h-4 w-px duration-1000" />
        </div>
      )}
    </>
  );

  if (shouldAnimate) {
    return (
      <motion.div
        data-slot="input-otp-slot"
        data-active={isActive}
        className={baseClassName}
        {...motionProps}
        {...props}
      >
        {slotContent}
      </motion.div>
    );
  }

  return (
    <div
      data-slot="input-otp-slot"
      data-active={isActive}
      className={baseClassName}
      {...props}
    >
      {slotContent}
    </div>
  );
}

function InputOTPSeparator({ ...props }: ComponentProps<'div'>) {
  return (
    <div data-slot="input-otp-separator" role="separator" {...props}>
      <Minus />
    </div>
  );
}

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator };
