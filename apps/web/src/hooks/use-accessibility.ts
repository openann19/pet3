/**
 * Accessibility Hooks
 * React hooks for managing accessibility features
 */

import { useEffect, useRef, useCallback } from 'react';
import { focusManagement } from '@/utils/a11y-helpers';

/**
 * Hook for managing focus trap in modals/dialogs
 */
export function useFocusTrap(isActive: boolean) {
  const containerRef = useRef<HTMLElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    // Store the previously focused element
    previousFocusRef.current = document.activeElement as HTMLElement;

    // Focus first element in container
    focusManagement.focusFirst(containerRef.current);

    // Trap focus
    focusManagement.trap(containerRef.current);

    return () => {
      // Restore focus when trap is removed
      if (previousFocusRef.current) {
        focusManagement.restore(previousFocusRef.current);
      }
    };
  }, [isActive]);

  return containerRef;
}

/**
 * Hook for managing ARIA live regions
 */
export function useAriaLive(
  message: string | null,
  options: {
    priority?: 'polite' | 'assertive';
    clearOnUnmount?: boolean;
  } = {}
) {
  const { priority = 'polite', clearOnUnmount = true } = options;
  const liveRegionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof document === 'undefined') return;

    // Create or get live region
    let liveRegion = document.getElementById('aria-live-region') as HTMLDivElement;

    if (!liveRegion) {
      liveRegion = document.createElement('div');
      liveRegion.id = 'aria-live-region';
      liveRegion.setAttribute('aria-live', priority);
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.className = 'sr-only';
      liveRegion.style.position = 'absolute';
      liveRegion.style.left = '-10000px';
      liveRegion.style.width = '1px';
      liveRegion.style.height = '1px';
      liveRegion.style.overflow = 'hidden';
      document.body.appendChild(liveRegion);
    }

    liveRegionRef.current = liveRegion;

    // Update message
    if (message) {
      liveRegion.textContent = message;
    }

    return () => {
      if (clearOnUnmount && liveRegion) {
        liveRegion.textContent = '';
      }
    };
  }, [message, priority, clearOnUnmount]);

  return liveRegionRef;
}

/**
 * Hook for managing keyboard navigation
 */
export function useKeyboardNavigation(
  onNavigate: (direction: 'up' | 'down' | 'left' | 'right') => void,
  options: {
    enabled?: boolean;
    preventDefault?: boolean;
  } = {}
) {
  const { enabled = true, preventDefault = true } = options;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      let direction: 'up' | 'down' | 'left' | 'right' | null = null;

      switch (event.key) {
        case 'ArrowUp':
          direction = 'up';
          break;
        case 'ArrowDown':
          direction = 'down';
          break;
        case 'ArrowLeft':
          direction = 'left';
          break;
        case 'ArrowRight':
          direction = 'right';
          break;
        default:
          return;
      }

      if (direction && preventDefault) {
        event.preventDefault();
      }

      if (direction) {
        onNavigate(direction);
      }
    },
    [enabled, preventDefault, onNavigate]
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, handleKeyDown]);
}

/**
 * Hook for managing skip links
 */
export function useSkipLink(targetId: string, label = 'Skip to main content') {
  const skipLinkRef = useRef<HTMLAnchorElement | null>(null);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      const target = document.getElementById(targetId);
      if (target) {
        target.focus();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    },
    [targetId]
  );

  return {
    ref: skipLinkRef,
    href: `#${targetId}`,
    onClick: handleClick,
    'aria-label': label,
    className: 'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md',
  };
}

/**
 * Hook for managing ARIA expanded state
 */
export function useAriaExpanded(
  isExpanded: boolean,
  options: {
    controls?: string;
    onToggle?: (expanded: boolean) => void;
  } = {}
) {
  const { controls, onToggle } = options;

  const toggle = useCallback(() => {
    const newState = !isExpanded;
    onToggle?.(newState);
  }, [isExpanded, onToggle]);

  return {
    'aria-expanded': isExpanded,
    'aria-controls': controls,
    onClick: toggle,
  };
}

/**
 * Hook for managing ARIA busy state
 */
export function useAriaBusy(isBusy: boolean) {
  return {
    'aria-busy': isBusy,
    'aria-live': isBusy ? 'polite' : 'off',
  };
}

/**
 * Hook for managing form field accessibility
 */
export function useFormFieldAccessibility(
  id: string,
  options: {
    label?: string;
    error?: string;
    helperText?: string;
    required?: boolean;
    invalid?: boolean;
  } = {}
) {
  const { label, error, helperText, required, invalid } = options;

  const labelId = label ? `${id}-label` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const helperTextId = helperText ? `${id}-helper` : undefined;

  const describedBy = [helperTextId, errorId].filter(Boolean).join(' ') || undefined;

  return {
    inputProps: {
      id,
      'aria-labelledby': labelId,
      'aria-describedby': describedBy,
      'aria-required': required,
      'aria-invalid': invalid,
      'aria-errormessage': errorId,
    },
    labelProps: labelId
      ? {
          id: labelId,
          htmlFor: id,
        }
      : undefined,
    errorProps: errorId
      ? {
          id: errorId,
          role: 'alert',
          'aria-live': 'polite',
        }
      : undefined,
    helperTextProps: helperTextId
      ? {
          id: helperTextId,
        }
      : undefined,
  };
}

