/**
 * Performance Optimization Utilities
 * Utilities for code splitting, lazy loading, memoization, and performance monitoring
 */

import type React from 'react';

/**
 * Performance metrics
 */
export interface PerformanceMetrics {
  renderTime: number;
  memoryUsage?: number;
  componentCount?: number;
}

/**
 * Performance budget configuration
 */
export interface PerformanceBudget {
  maxRenderTime: number;
  maxBundleSize?: number;
  maxMemoryUsage?: number;
}

/**
 * Lazy load component with error boundary
 */
export function createLazyComponent<T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback?: React.ReactNode
): React.LazyExoticComponent<T> {
  return React.lazy(async () => {
    try {
      return await importFn();
    } catch (error) {
      // Log error for monitoring
      if (typeof window !== 'undefined' && window.console) {
        console.error('[Performance] Failed to lazy load component:', error);
      }
      throw error;
    }
  });
}

/**
 * Memoize function with cache size limit
 */
export function memoizeWithLimit<T extends (...args: any[]) => any>(
  fn: T,
  maxCacheSize = 100
): T {
  const cache = new Map<string, ReturnType<T>>();
  const keys: string[] = [];

  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const result = fn(...args);
    
    // Limit cache size
    if (cache.size >= maxCacheSize) {
      const oldestKey = keys.shift();
      if (oldestKey) {
        cache.delete(oldestKey);
      }
    }

    cache.set(key, result);
    keys.push(key);

    return result;
  }) as T;
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = null;
    }, delay);
  };
}

/**
 * Throttle function
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * Measure component render performance
 */
export function measureRenderPerformance(
  componentName: string,
  renderFn: () => void
): PerformanceMetrics {
  const startTime = performance.now();
  const startMemory = performance.memory?.usedJSHeapSize;

  renderFn();

  const endTime = performance.now();
  const endMemory = performance.memory?.usedJSHeapSize;

  const metrics: PerformanceMetrics = {
    renderTime: endTime - startTime,
  };

  if (startMemory && endMemory) {
    metrics.memoryUsage = endMemory - startMemory;
  }

  // Log if exceeds budget
  if (metrics.renderTime > 16) {
    // 16ms = 60fps threshold
    if (typeof window !== 'undefined' && window.console) {
      console.warn(
        `[Performance] ${componentName} render time (${metrics.renderTime.toFixed(2)}ms) exceeds 16ms threshold`
      );
    }
  }

  return metrics;
}

/**
 * Check if performance budget is exceeded
 */
export function checkPerformanceBudget(
  metrics: PerformanceMetrics,
  budget: PerformanceBudget
): { passed: boolean; violations: string[] } {
  const violations: string[] = [];

  if (metrics.renderTime > budget.maxRenderTime) {
    violations.push(
      `Render time (${metrics.renderTime.toFixed(2)}ms) exceeds budget (${budget.maxRenderTime}ms)`
    );
  }

  if (budget.maxMemoryUsage && metrics.memoryUsage && metrics.memoryUsage > budget.maxMemoryUsage) {
    violations.push(
      `Memory usage (${(metrics.memoryUsage / 1024 / 1024).toFixed(2)}MB) exceeds budget (${(budget.maxMemoryUsage / 1024 / 1024).toFixed(2)}MB)`
    );
  }

  return {
    passed: violations.length === 0,
    violations,
  };
}

/**
 * Intersection Observer for lazy loading
 */
export function createLazyLoadObserver(
  callback: (entry: IntersectionObserverEntry) => void,
  options: IntersectionObserverInit = {}
): IntersectionObserver {
  const defaultOptions: IntersectionObserverInit = {
    rootMargin: '50px',
    threshold: 0.01,
    ...options,
  };

  return new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        callback(entry);
      }
    });
  }, defaultOptions);
}

/**
 * Preload resource
 */
export function preloadResource(
  href: string,
  as: 'script' | 'style' | 'image' | 'font' | 'fetch'
): void {
  if (typeof document === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = href;
  link.as = as;
  
  if (as === 'font') {
    link.crossOrigin = 'anonymous';
  }

  document.head.appendChild(link);
}

/**
 * Prefetch resource
 */
export function prefetchResource(href: string): void {
  if (typeof document === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = href;
  document.head.appendChild(link);
}

/**
 * Get bundle size estimate (client-side only)
 */
export function getBundleSizeEstimate(): number | null {
  if (typeof performance === 'undefined' || !performance.getEntriesByType) {
    return null;
  }

  const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  const scriptResources = resources.filter(
    (entry) => entry.initiatorType === 'script' || entry.name.includes('.js')
  );

  const totalSize = scriptResources.reduce((sum, entry) => {
    return sum + (entry.transferSize ?? 0);
  }, 0);

  return totalSize;
}

/**
 * Monitor long tasks (tasks > 50ms)
 */
export function monitorLongTasks(callback: (duration: number) => void): () => void {
  if (typeof PerformanceObserver === 'undefined') {
    return () => {};
  }

  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration > 50) {
          callback(entry.duration);
        }
      }
    });

    observer.observe({ entryTypes: ['longtask'] });

    return () => {
      observer.disconnect();
    };
  } catch {
    return () => {};
  }
}

/**
 * Request idle callback with fallback
 */
export function requestIdleCallback(
  callback: () => void,
  options?: { timeout?: number }
): number {
  if (typeof window !== 'undefined' && window.requestIdleCallback) {
    return window.requestIdleCallback(callback, options);
  }

  // Fallback to setTimeout
  return setTimeout(callback, options?.timeout ?? 1000) as unknown as number;
}

/**
 * Cancel idle callback
 */
export function cancelIdleCallback(handle: number): void {
  if (typeof window !== 'undefined' && window.cancelIdleCallback) {
    window.cancelIdleCallback(handle);
  } else {
    clearTimeout(handle);
  }
}

