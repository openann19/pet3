'use client';
import { motion } from 'framer-motion';

import React, { useCallback, useState } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { springConfigs, motionDurations } from '@/effects/framer-motion/variants';
import { haptics } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import { PremiumButton } from '../PremiumButton';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useUIConfig } from "@/hooks/use-ui-config";
import { getTypographyClasses } from '@/lib/typography';
import { getMotionDuration } from '@/lib/design-tokens';

export interface PremiumErrorStateProps {
  title?: string;
  message?: string;
  error?: Error | string;
  onRetry?: () => void;
  retryLabel?: string;
  variant?: 'default' | 'minimal' | 'detailed';
  showDetails?: boolean;
  className?: string;
}

export function PremiumErrorState({
  title = 'Something went wrong',
  message,
  error,
  onRetry,
  retryLabel = 'Try Again',
  variant = 'default',
  showDetails = false,
  className,
}: PremiumErrorStateProps): React.JSX.Element {
  const _uiConfig = useUIConfig();
  const reducedMotion = useReducedMotion();
  const [shakeX, setShakeX] = useState(0);

  const handleRetry = useCallback(() => {
    if (!reducedMotion) {
      // Use motion duration token for shake animation timing
      const shakeDuration = Number.parseInt(getMotionDuration('fast').replace('ms', ''), 10) || 100;
      setShakeX(10);
      setTimeout(() => {
        setShakeX(-10);
        setTimeout(() => {
          setShakeX(0);
        }, shakeDuration);
      }, shakeDuration);
    }

    haptics.impact('medium');
    onRetry?.();
  }, [onRetry, reducedMotion]);

  const errorMessage = typeof error === 'string' ? error : error?.message ?? message;
  const errorDetails = typeof error === 'object' && error?.stack ? error.stack : undefined;

  const variants = {
    default: 'text-center py-12 px-4',
    minimal: 'text-center py-8 px-4',
    detailed: 'text-center py-12 px-4',
  };

  return (
    <motion.div
      className={cn('flex flex-col items-center', variants[variant], className)}
      initial={reducedMotion ? undefined : { opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1, x: shakeX }}
      transition={reducedMotion ? undefined : {
        ...springConfigs.smooth,
        duration: motionDurations.smooth,
      }}
    >
      <div className="mb-4 text-(--danger)" aria-hidden="true">
        <AlertCircle size={48} />
      </div>
      <h3 className={cn(getTypographyClasses('h2'), 'mb-2 text-(--text-primary)')}>
        {title}
      </h3>
      {errorMessage && (
        <p className={cn(getTypographyClasses('body'), 'mb-6 max-w-[60ch] text-(--text-muted)')}>
          {errorMessage}
        </p>
      )}
      {showDetails && errorDetails && variant === 'detailed' && (
        <details className="mb-6 max-w-[60ch] text-left">
          <summary className={cn(getTypographyClasses('caption'), 'cursor-pointer mb-2 text-(--text-muted)')}>
            Error Details
          </summary>
          <pre className={cn(getTypographyClasses('body-sm'), 'p-4 bg-(--surface) rounded-md overflow-auto text-(--text-muted)')}>
            {errorDetails}
          </pre>
        </details>
      )}
      {onRetry && (
        <PremiumButton
          onClick={handleRetry}
          variant="primary"
          size="md"
          icon={<RefreshCw size={16} />}
        >
          {retryLabel}
        </PremiumButton>
      )}
    </motion.div>
  );
}
