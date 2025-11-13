'use client';

import { useRef, useEffect } from 'react';
import { usePrefersReducedMotion } from '@/utils/reduced-motion';
import { useFeatureFlags } from '@/config/feature-flags';
import { useUIConfig } from "@/hooks/use-ui-config";
import { isBrowser } from '@/utils/ssr-safe';
import { getMotionDuration } from '@/lib/design-tokens';

/**
 * GlowTrail Component
 *
 * Subtle cursor trail effect with particle pool
 * Respects reduced motion preferences
 */
export default function GlowTrail() {
    const _uiConfig = useUIConfig();
    const r = useRef<HTMLDivElement>(null);
  const reducedMotion = usePrefersReducedMotion();
  const { enableGlowTrail } = useFeatureFlags();

  useEffect(() => {
    if (!enableGlowTrail || reducedMotion || !isBrowser()) {
      return;
    }

    const el = r.current;
    if (!el) return;

    const pts: { x: number; y: number; el: HTMLDivElement }[] = [];
    const pool: HTMLDivElement[] = [];

    // Use motion duration token for fade timeout
    const fadeDuration = Number.parseInt(getMotionDuration('fast').replace('ms', ''), 10) || 200;

    const mk = () => {
      if (!isBrowser() || typeof document === 'undefined') return null;
      const d = document.createElement('div');
      d.className = 'pointer-events-none fixed w-3 h-3 rounded-full blur-[6px] bg-primary/40';
      document.body.appendChild(d);
      return d;
    };

    const onMove = (e: MouseEvent) => {
      const d = pool.pop() ?? mk();
      if (!d) return;
      d.style.left = `${e.clientX - 6}px`;
      d.style.top = `${e.clientY - 6}px`;
      d.style.opacity = '1';

      pts.push({ x: e.clientX, y: e.clientY, el: d });

      setTimeout(() => {
        d.style.opacity = '0';
        pool.push(d);
      }, fadeDuration);

      if (pts.length > 40) {
        const removed = pts.shift();
        if (removed) {
          removed.el.style.opacity = '0';
          pool.push(removed.el);
        }
      }
    };

    window.addEventListener('mousemove', onMove, { passive: true });

    return () => {
      window.removeEventListener('mousemove', onMove);
      pts.forEach((p) => p.el.remove());
      pool.forEach((p) => p.remove());
    };
  }, [reducedMotion, enableGlowTrail]);

  return <div ref={r} aria-hidden="true" />;
}
