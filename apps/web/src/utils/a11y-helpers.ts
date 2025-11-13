/**
 * Accessibility Helper Utilities
 * Utilities for generating accessible props and managing focus/ARIA attributes
 */

import type { ReactNode } from 'react';

/**
 * Props for creating accessible button-like elements
 */
export interface AccessibleButtonProps {
  role?: 'button' | 'link';
  tabIndex: number;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  'aria-pressed'?: boolean | 'mixed';
  'aria-expanded'?: boolean;
  'aria-controls'?: string;
  'aria-disabled'?: boolean;
  onKeyDown: (event: React.KeyboardEvent) => void;
}

/**
 * Create accessible button props for non-button elements
 * @param options - Configuration options
 * @returns Props object for accessible button-like element
 * 
 * @example
 * ```tsx
 * const buttonProps = createAccessibleButtonProps({
 *   label: 'Close dialog',
 *   onClick: handleClose,
 *   disabled: false,
 * });
 * 
 * <div {...buttonProps}>Close</div>
 * ```
 */
export function createAccessibleButtonProps(options: {
  label?: string;
  labelledBy?: string;
  describedBy?: string;
  onClick?: () => void;
  disabled?: boolean;
  pressed?: boolean | 'mixed';
  expanded?: boolean;
  controls?: string;
  role?: 'button' | 'link';
}): AccessibleButtonProps {
  const {
    label,
    labelledBy,
    describedBy,
    onClick,
    disabled = false,
    pressed,
    expanded,
    controls,
    role = 'button',
  } = options;

  const handleKeyDown = (event: React.KeyboardEvent): void => {
    // Handle Enter and Space keys
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (!disabled && onClick) {
        onClick();
      }
    }
  };

  const props: AccessibleButtonProps = {
    role,
    tabIndex: disabled ? -1 : 0,
    onKeyDown: handleKeyDown,
  };

  if (label) {
    props['aria-label'] = label;
  }

  if (labelledBy) {
    props['aria-labelledby'] = labelledBy;
  }

  if (describedBy) {
    props['aria-describedby'] = describedBy;
  }

  if (pressed !== undefined) {
    props['aria-pressed'] = pressed;
  }

  if (expanded !== undefined) {
    props['aria-expanded'] = expanded;
  }

  if (controls) {
    props['aria-controls'] = controls;
  }

  if (disabled) {
    props['aria-disabled'] = true;
  }

  return props;
}

/**
 * Generate ARIA label for icon-only buttons
 * @param icon - Icon component or description
 * @param action - Action description (e.g., 'Close', 'Open menu')
 * @returns ARIA label string
 * 
 * @example
 * ```tsx
 * const label = getIconButtonLabel('X', 'Close');
 * // Returns: "Close"
 * ```
 */
export function getIconButtonLabel(icon: ReactNode | string, action: string): string {
  return action;
}

/**
 * Generate ARIA describedby ID
 * @param baseId - Base identifier
 * @param suffix - Suffix to append
 * @returns Unique ID string
 */
export function generateAriaId(baseId: string, suffix: string): string {
  return `${baseId}-${suffix}`;
}

/**
 * Focus management utilities
 */
export const focusManagement = {
  /**
   * Trap focus within an element
   * @param container - Container element to trap focus in
   * @param firstFocusable - First focusable element (optional)
   * @param lastFocusable - Last focusable element (optional)
   */
  trap: (
    container: HTMLElement,
    firstFocusable?: HTMLElement | null,
    lastFocusable?: HTMLElement | null
  ): void => {
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const first = firstFocusable ?? focusableElements[0];
    const last = lastFocusable ?? focusableElements[focusableElements.length - 1];

    const handleTab = (e: KeyboardEvent): void => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleTab);
  },

  /**
   * Focus first focusable element in container
   * @param container - Container element
   */
  focusFirst: (container: HTMLElement): void => {
    const firstFocusable = container.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    firstFocusable?.focus();
  },

  /**
   * Restore focus to previously focused element
   * @param element - Element to restore focus to
   */
  restore: (element: HTMLElement | null): void => {
    element?.focus();
  },
};

/**
 * Check if element is focusable
 * @param element - Element to check
 * @returns true if element is focusable
 */
export function isFocusable(element: HTMLElement): boolean {
  const tagName = element.tagName.toLowerCase();
  const tabIndex = element.getAttribute('tabindex');
  
  if (tabIndex === '-1') {
    return false;
  }
  
  if (['input', 'select', 'textarea', 'button', 'a'].includes(tagName)) {
    return !element.hasAttribute('disabled');
  }
  
  if (tabIndex !== null) {
    return true;
  }
  
  return false;
}

