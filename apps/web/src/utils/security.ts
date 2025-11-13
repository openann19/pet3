/**
 * Security Utilities
 * Input validation, XSS prevention, secure API calls, and security helpers
 */

/**
 * Sanitize HTML string to prevent XSS
 */
export function sanitizeHTML(html: string): string {
  if (typeof document === 'undefined') {
    return html;
  }

  const div = document.createElement('div');
  div.textContent = html;
  return div.innerHTML;
}

/**
 * Escape HTML special characters
 */
export function escapeHTML(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };

  return text.replace(/[&<>"']/g, (m) => map[m] ?? m);
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate URL format
 */
export function isValidURL(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Validate phone number format (basic)
 */
export function isValidPhoneNumber(phone: string): boolean {
  const phoneRegex = /^[\d\s\-\+\(\)]+$/;
  const digitsOnly = phone.replace(/\D/g, '');
  return phoneRegex.test(phone) && digitsOnly.length >= 10 && digitsOnly.length <= 15;
}

/**
 * Sanitize filename to prevent path traversal
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/\.\./g, '_')
    .replace(/^\./, '_')
    .substring(0, 255);
}

/**
 * Validate and sanitize user input
 */
export interface InputValidationResult {
  valid: boolean;
  sanitized: string;
  errors: string[];
}

export function validateAndSanitizeInput(
  input: string,
  options: {
    maxLength?: number;
    minLength?: number;
    pattern?: RegExp;
    required?: boolean;
    allowHTML?: boolean;
    trim?: boolean;
  } = {}
): InputValidationResult {
  const {
    maxLength = 10000,
    minLength = 0,
    pattern,
    required = false,
    allowHTML = false,
    trim = true,
  } = options;

  const errors: string[] = [];
  let sanitized = input;

  // Trim if requested
  if (trim) {
    sanitized = sanitized.trim();
  }

  // Check required
  if (required && sanitized.length === 0) {
    errors.push('Input is required');
    return { valid: false, sanitized, errors };
  }

  // Check min length
  if (sanitized.length < minLength) {
    errors.push(`Input must be at least ${minLength} characters`);
  }

  // Check max length
  if (sanitized.length > maxLength) {
    errors.push(`Input must be no more than ${maxLength} characters`);
    sanitized = sanitized.substring(0, maxLength);
  }

  // Check pattern
  if (pattern && !pattern.test(sanitized)) {
    errors.push('Input does not match required pattern');
  }

  // Sanitize HTML if not allowed
  if (!allowHTML) {
    sanitized = escapeHTML(sanitized);
  }

  return {
    valid: errors.length === 0,
    sanitized,
    errors,
  };
}

/**
 * Generate secure random token
 */
export function generateSecureToken(length = 32): string {
  const array = new Uint8Array(length);
  
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array);
  } else {
    // Fallback for environments without crypto
    for (let i = 0; i < length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }

  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Hash string (simple, not cryptographically secure)
 */
export function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Validate CSRF token format
 */
export function isValidCSRFToken(token: string): boolean {
  return /^[a-zA-Z0-9_-]{32,}$/.test(token);
}

/**
 * Sanitize object keys to prevent prototype pollution
 */
export function sanitizeObjectKeys<T extends Record<string, unknown>>(obj: T): T {
  const sanitized = {} as T;

  for (const [key, value] of Object.entries(obj)) {
    // Prevent prototype pollution
    if (key !== '__proto__' && key !== 'constructor' && key !== 'prototype') {
      sanitized[key as keyof T] = value as T[keyof T];
    }
  }

  return sanitized;
}

/**
 * Validate API response structure
 */
export function validateAPIResponse<T>(
  response: unknown,
  schema: {
    required?: string[];
    type?: 'object' | 'array';
    properties?: Record<string, (value: unknown) => boolean>;
  }
): { valid: boolean; data?: T; errors: string[] } {
  const errors: string[] = [];

  if (schema.type === 'object' && !(typeof response === 'object' && response !== null && !Array.isArray(response))) {
    errors.push('Response must be an object');
    return { valid: false, errors };
  }

  if (schema.type === 'array' && !Array.isArray(response)) {
    errors.push('Response must be an array');
    return { valid: false, errors };
  }

  if (schema.required) {
    for (const field of schema.required) {
      if (!(response as Record<string, unknown>)[field]) {
        errors.push(`Required field '${field}' is missing`);
      }
    }
  }

  if (schema.properties && typeof response === 'object' && response !== null) {
    for (const [field, validator] of Object.entries(schema.properties)) {
      const value = (response as Record<string, unknown>)[field];
      if (value !== undefined && !validator(value)) {
        errors.push(`Field '${field}' failed validation`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    data: response as T,
    errors,
  };
}

/**
 * Create secure headers for API requests
 */
export function createSecureHeaders(
  options: {
    csrfToken?: string;
    contentType?: string;
    authorization?: string;
  } = {}
): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': options.contentType ?? 'application/json',
  };

  if (options.csrfToken) {
    headers['X-CSRF-Token'] = options.csrfToken;
  }

  if (options.authorization) {
    headers['Authorization'] = options.authorization;
  }

  // Security headers
  headers['X-Requested-With'] = 'XMLHttpRequest';

  return headers;
}

/**
 * Check if string contains potentially dangerous content
 */
export function containsDangerousContent(text: string): boolean {
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i, // Event handlers like onclick=
    /data:text\/html/i,
    /vbscript:/i,
  ];

  return dangerousPatterns.some((pattern) => pattern.test(text));
}

/**
 * Sanitize user-generated content
 */
export function sanitizeUserContent(content: string, options: { allowLinks?: boolean } = {}): string {
  let sanitized = escapeHTML(content);

  // Allow safe links if requested
  if (options.allowLinks) {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    sanitized = sanitized.replace(urlRegex, (url) => {
      if (isValidURL(url)) {
        return `<a href="${escapeHTML(url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(url)}</a>`;
      }
      return escapeHTML(url);
    });
  }

  return sanitized;
}

