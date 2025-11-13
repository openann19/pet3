/**
 * Accessibility Audit Utilities
 * Tools for auditing and improving accessibility compliance
 */

import type { ReactNode } from 'react';

/**
 * Accessibility violation types
 */
export type A11yViolationType =
  | 'missing-aria-label'
  | 'missing-aria-labelledby'
  | 'missing-role'
  | 'invalid-aria-attribute'
  | 'missing-focus-handler'
  | 'missing-keyboard-handler'
  | 'insufficient-contrast'
  | 'missing-semantic-element'
  | 'missing-alt-text'
  | 'invalid-tabindex'
  | 'missing-heading-hierarchy'
  | 'missing-landmark'
  | 'missing-live-region';

/**
 * Accessibility violation severity
 */
export type A11yViolationSeverity = 'error' | 'warning' | 'info';

/**
 * Accessibility violation
 */
export interface A11yViolation {
  type: A11yViolationType;
  severity: A11yViolationSeverity;
  message: string;
  element?: string;
  recommendation: string;
}

/**
 * Accessibility audit result
 */
export interface A11yAuditResult {
  violations: A11yViolation[];
  score: number;
  passed: boolean;
}

/**
 * Check if element has accessible label
 */
export function hasAccessibleLabel(element: HTMLElement): boolean {
  const ariaLabel = element.getAttribute('aria-label');
  const ariaLabelledBy = element.getAttribute('aria-labelledby');
  const label = element.querySelector('label');
  const textContent = element.textContent?.trim();

  return Boolean(ariaLabel || ariaLabelledBy || label || textContent);
}

/**
 * Check if interactive element has keyboard handler
 */
export function hasKeyboardHandler(element: HTMLElement): boolean {
  const hasOnKeyDown = element.hasAttribute('onkeydown') || 
    (element as unknown as { onKeyDown?: unknown }).onKeyDown !== undefined;
  const isNativeButton = element.tagName === 'BUTTON' || element.tagName === 'A';
  const hasTabIndex = element.hasAttribute('tabindex');

  return hasOnKeyDown || isNativeButton || hasTabIndex;
}

/**
 * Check if element has focus handler
 */
export function hasFocusHandler(element: HTMLElement): boolean {
  const hasOnFocus = element.hasAttribute('onfocus') ||
    (element as unknown as { onFocus?: unknown }).onFocus !== undefined;
  const hasOnBlur = element.hasAttribute('onblur') ||
    (element as unknown as { onBlur?: unknown }).onBlur !== undefined;

  return hasOnFocus || hasOnBlur;
}

/**
 * Check if image has alt text
 */
export function hasAltText(element: HTMLImageElement): boolean {
  const alt = element.getAttribute('alt');
  const ariaHidden = element.getAttribute('aria-hidden') === 'true';
  
  // Decorative images should have alt=""
  if (ariaHidden) {
    return alt === '';
  }
  
  return alt !== null && alt !== undefined;
}

/**
 * Check if heading hierarchy is valid
 */
export function validateHeadingHierarchy(headings: HTMLHeadingElement[]): A11yViolation[] {
  const violations: A11yViolation[] = [];
  let previousLevel = 0;

  for (const heading of headings) {
    const level = Number.parseInt(heading.tagName.substring(1), 10);
    
    if (previousLevel > 0 && level > previousLevel + 1) {
      violations.push({
        type: 'missing-heading-hierarchy',
        severity: 'warning',
        message: `Heading level skipped from h${previousLevel} to h${level}`,
        element: heading.tagName,
        recommendation: `Use h${previousLevel + 1} instead of h${level}, or restructure your heading hierarchy`,
      });
    }
    
    previousLevel = level;
  }

  return violations;
}

/**
 * Check if page has main landmark
 */
export function hasMainLandmark(): boolean {
  if (typeof document === 'undefined') return false;
  const main = document.querySelector('main');
  const mainRole = document.querySelector('[role="main"]');
  
  return Boolean(main || mainRole);
}

/**
 * Check if modal has proper ARIA attributes
 */
export function validateModal(element: HTMLElement): A11yViolation[] {
  const violations: A11yViolation[] = [];
  
  const role = element.getAttribute('role');
  const ariaModal = element.getAttribute('aria-modal');
  const ariaLabel = element.getAttribute('aria-label');
  const ariaLabelledBy = element.getAttribute('aria-labelledby');
  
  if (role !== 'dialog' && role !== 'alertdialog') {
    violations.push({
      type: 'missing-role',
      severity: 'error',
      message: 'Modal should have role="dialog" or role="alertdialog"',
      element: element.tagName,
      recommendation: 'Add role="dialog" to the modal element',
    });
  }
  
  if (ariaModal !== 'true') {
    violations.push({
      type: 'invalid-aria-attribute',
      severity: 'error',
      message: 'Modal should have aria-modal="true"',
      element: element.tagName,
      recommendation: 'Add aria-modal="true" to the modal element',
    });
  }
  
  if (!ariaLabel && !ariaLabelledBy) {
    violations.push({
      type: 'missing-aria-label',
      severity: 'error',
      message: 'Modal should have aria-label or aria-labelledby',
      element: element.tagName,
      recommendation: 'Add aria-label or aria-labelledby pointing to the modal title',
    });
  }
  
  return violations;
}

/**
 * Check if button has accessible label
 */
export function validateButton(element: HTMLButtonElement | HTMLElement): A11yViolation[] {
  const violations: A11yViolation[] = [];
  
  const ariaLabel = element.getAttribute('aria-label');
  const ariaLabelledBy = element.getAttribute('aria-labelledby');
  const textContent = element.textContent?.trim();
  const hasIcon = element.querySelector('svg, img, [role="img"]');
  
  // Icon-only buttons must have aria-label
  if (hasIcon && !textContent && !ariaLabel && !ariaLabelledBy) {
    violations.push({
      type: 'missing-aria-label',
      severity: 'error',
      message: 'Icon-only button must have aria-label',
      element: element.tagName,
      recommendation: 'Add aria-label describing the button action',
    });
  }
  
  return violations;
}

/**
 * Check if form field has accessible label
 */
export function validateFormField(element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement): A11yViolation[] {
  const violations: A11yViolation[] = [];
  
  const id = element.id;
  const ariaLabel = element.getAttribute('aria-label');
  const ariaLabelledBy = element.getAttribute('aria-labelledby');
  const label = id ? document.querySelector(`label[for="${id}"]`) : null;
  
  if (!ariaLabel && !ariaLabelledBy && !label) {
    violations.push({
      type: 'missing-aria-label',
      severity: 'error',
      message: 'Form field must have accessible label',
      element: element.tagName,
      recommendation: 'Add aria-label, aria-labelledby, or associate with a <label> element',
    });
  }
  
  const ariaInvalid = element.getAttribute('aria-invalid');
  const hasError = element.classList.contains('error') || 
    element.classList.contains('invalid') ||
    element.getAttribute('data-invalid') === 'true';
  
  if (hasError && ariaInvalid !== 'true') {
    violations.push({
      type: 'invalid-aria-attribute',
      severity: 'warning',
      message: 'Form field with error should have aria-invalid="true"',
      element: element.tagName,
      recommendation: 'Add aria-invalid="true" when field has validation errors',
    });
  }
  
  return violations;
}

/**
 * Check tabindex values
 */
export function validateTabIndex(element: HTMLElement): A11yViolation[] {
  const violations: A11yViolation[] = [];
  
  const tabIndex = element.getAttribute('tabindex');
  
  if (tabIndex !== null) {
    const value = Number.parseInt(tabIndex, 10);
    
    if (Number.isNaN(value)) {
      violations.push({
        type: 'invalid-tabindex',
        severity: 'error',
        message: 'tabindex must be a number',
        element: element.tagName,
        recommendation: 'Use tabindex="0" for programmatic focus or tabindex="-1" to remove from tab order',
      });
    } else if (value > 0) {
      violations.push({
        type: 'invalid-tabindex',
        severity: 'warning',
        message: 'tabindex > 0 breaks natural tab order',
        element: element.tagName,
        recommendation: 'Avoid tabindex > 0. Use tabindex="0" or "-1" only',
      });
    }
  }
  
  return violations;
}

/**
 * Audit a component for accessibility violations
 */
export function auditComponent(
  element: HTMLElement,
  options: {
    checkKeyboard?: boolean;
    checkFocus?: boolean;
    checkLabels?: boolean;
    checkTabIndex?: boolean;
  } = {}
): A11yAuditResult {
  const violations: A11yViolation[] = [];
  const {
    checkKeyboard = true,
    checkFocus = true,
    checkLabels = true,
    checkTabIndex = true,
  } = options;

  // Check labels for interactive elements
  if (checkLabels) {
    const isInteractive = element.hasAttribute('onclick') ||
      element.getAttribute('role') === 'button' ||
      element.tagName === 'BUTTON' ||
      element.tagName === 'A';
    
    if (isInteractive && !hasAccessibleLabel(element)) {
      violations.push({
        type: 'missing-aria-label',
        severity: 'error',
        message: 'Interactive element must have accessible label',
        element: element.tagName,
        recommendation: 'Add aria-label, aria-labelledby, or visible text content',
      });
    }
  }

  // Check keyboard handlers
  if (checkKeyboard && element.hasAttribute('onclick')) {
    if (!hasKeyboardHandler(element)) {
      violations.push({
        type: 'missing-keyboard-handler',
        severity: 'error',
        message: 'Element with onClick must have keyboard handler',
        element: element.tagName,
        recommendation: 'Add onKeyDown handler for Enter/Space keys or use <button> element',
      });
    }
  }

  // Check tabindex
  if (checkTabIndex) {
    violations.push(...validateTabIndex(element));
  }

  // Check form fields
  if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA' || element.tagName === 'SELECT') {
    violations.push(...validateFormField(element as HTMLInputElement));
  }

  // Check buttons
  if (element.tagName === 'BUTTON' || element.getAttribute('role') === 'button') {
    violations.push(...validateButton(element));
  }

  // Check images
  if (element.tagName === 'IMG') {
    if (!hasAltText(element as HTMLImageElement)) {
      violations.push({
        type: 'missing-alt-text',
        severity: 'error',
        message: 'Image must have alt text',
        element: 'IMG',
        recommendation: 'Add alt attribute. Use alt="" for decorative images',
      });
    }
  }

  // Calculate score
  const errorCount = violations.filter(v => v.severity === 'error').length;
  const warningCount = violations.filter(v => v.severity === 'warning').length;
  const totalIssues = errorCount * 3 + warningCount;
  const maxScore = 100;
  const score = Math.max(0, maxScore - totalIssues);
  const passed = errorCount === 0;

  return {
    violations,
    score,
    passed,
  };
}

/**
 * Generate accessibility report
 */
export function generateA11yReport(results: A11yAuditResult[]): string {
  const totalViolations = results.reduce((sum, r) => sum + r.violations.length, 0);
  const totalErrors = results.reduce((sum, r) => 
    sum + r.violations.filter(v => v.severity === 'error').length, 0);
  const totalWarnings = results.reduce((sum, r) => 
    sum + r.violations.filter(v => v.severity === 'warning').length, 0);
  const averageScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;

  return `
Accessibility Audit Report
==========================
Total Components Audited: ${results.length}
Total Violations: ${totalViolations}
  - Errors: ${totalErrors}
  - Warnings: ${totalWarnings}
Average Score: ${averageScore.toFixed(1)}/100
Overall Status: ${totalErrors === 0 ? 'PASS' : 'FAIL'}

${results.map((result, index) => `
Component ${index + 1}:
  Score: ${result.score}/100
  Status: ${result.passed ? 'PASS' : 'FAIL'}
  Violations: ${result.violations.length}
${result.violations.map(v => `  [${v.severity.toUpperCase()}] ${v.type}: ${v.message}`).join('\n')}
`).join('\n')}
`;
}

