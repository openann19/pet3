/**
import { motion } from 'framer-motion';
 * Link Preview — Web
 * - Skeleton shimmer → content crossfade
 * - Reduced motion instant crossfade (≤120ms)
 * - No duplicate style props; accessible & trimmed
 *
 * Location: apps/web/src/components/chat/LinkPreview.tsx
 */

import { useMemo, useEffect, memo } from 'react';
import { motion, useMotionValue, animate, useTransform } from 'framer-motion';
import { usePrefersReducedMotion } from '@/utils/reduced-motion';
import { motionDurations } from '@/effects/framer-motion/variants';
import { safeHref } from '@/lib/url-safety';
import { SmartImage } from '@/components/media/SmartImage';
import { useUIConfig } from "@/hooks/use-ui-config";

export interface LinkPreviewProps {
  url: string;
  title?: string;
  description?: string;
  image?: string;
  isLoading?: boolean;
  className?: string;
}

export function LinkPreview({
  url,
  title,
  description,
  image,
  isLoading = false,
  className,
}: LinkPreviewProps) {
  const _uiConfig = useUIConfig();
  const prefersReducedMotion = usePrefersReducedMotion();
  const safeUrl = useMemo(() => safeHref(url), [url]);
  const showContent = !isLoading && (title != null || image != null) && safeUrl !== null;

  const s = useMotionValue(showContent ? 1 : 0);
  const dur = prefersReducedMotion ? motionDurations.fast : motionDurations.smooth;

  useEffect(() => {
    void animate(s, showContent ? 1 : 0, {
      duration: dur,
      ease: [0.2, 0, 0, 1],
    });
  }, [showContent, dur, s]);

  const skeletonOpacity = useTransform(s, (value) => 1 - value);
  const contentOpacity = useTransform(s, (value) => value);

  if (!safeUrl) return null;

  return (
    <div
      className={`relative overflow-hidden rounded-lg ${className ?? ''}`}
      aria-busy={isLoading}
      aria-live="polite"
    >
      {/* Skeleton */}
      <motion.div
        style={{ opacity: skeletonOpacity }}
        className="absolute inset-0"
      >
        <div className="flex gap-3 p-3">
          {image && (
            <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          )}
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full animate-pulse" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3 animate-pulse" />
          </div>
        </div>
      </motion.div>

      {/* Content */}
      {showContent && (
        <motion.div
          style={{ opacity: contentOpacity }}
          className="relative"
        >
          <a
            href={safeUrl}
            target="_blank"
            rel="noopener noreferrer nofollow ugc"
            className="flex gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            aria-label={title ? `Open link: ${title}` : `Open link from ${new URL(url).hostname}`}
          >
            {image && (
              <SmartImage
                src={image}
                alt={title ?? new URL(url).hostname}
                className="w-20 h-20 object-cover rounded"
                width={80}
                height={80}
              />
            )}
            <div className="flex-1 min-w-0">
              {title && (
                <h4 className="text-sm font-semibold text-foreground line-clamp-1">{title}</h4>
              )}
              {description && (
                <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{description}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1 truncate">{new URL(url).hostname}</p>
            </div>
          </a>
        </motion.div>
      )}
    </div>
  );
}

// Memoize to prevent unnecessary re-renders
export const MemoizedLinkPreview = memo(LinkPreview);
