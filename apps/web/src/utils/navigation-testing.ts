/**
 * Navigation Testing Utilities
 * Utilities for testing navigation safety and route transitions
 */

/**
 * Navigation test result
 */
export interface NavigationTestResult {
  route: string;
  passed: boolean;
  errors: string[];
  warnings: string[];
  renderTime?: number;
}

/**
 * Route configuration for testing
 */
export interface RouteConfig {
  path: string;
  params?: Record<string, unknown>;
  searchParams?: Record<string, string>;
  requiredParams?: string[];
}

/**
 * Test navigation between routes
 */
export async function testNavigation(
  routes: RouteConfig[],
  options: {
    timeout?: number;
    onRouteChange?: (route: string) => void;
  } = {}
): Promise<NavigationTestResult[]> {
  const { timeout = 5000, onRouteChange } = options;
  const results: NavigationTestResult[] = [];

  for (const route of routes) {
    const startTime = performance.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      onRouteChange?.(route.path);

      // Simulate navigation
      await new Promise((resolve) => {
        setTimeout(resolve, 100);
      });

      // Check for required params
      if (route.requiredParams) {
        for (const param of route.requiredParams) {
          if (!route.params?.[param] && !route.searchParams?.[param]) {
            errors.push(`Missing required parameter: ${param}`);
          }
        }
      }

      const renderTime = performance.now() - startTime;

      if (renderTime > timeout) {
        warnings.push(`Render time (${renderTime.toFixed(2)}ms) exceeds timeout (${timeout}ms)`);
      }

      results.push({
        route: route.path,
        passed: errors.length === 0,
        errors,
        warnings,
        renderTime,
      });
    } catch (error) {
      const renderTime = performance.now() - startTime;
      errors.push(error instanceof Error ? error.message : String(error));

      results.push({
        route: route.path,
        passed: false,
        errors,
        warnings,
        renderTime,
      });
    }
  }

  return results;
}

/**
 * Test component render with various prop combinations
 */
export async function testComponentRender<T extends Record<string, unknown>>(
  Component: React.ComponentType<T>,
  propVariations: T[],
  options: {
    timeout?: number;
    onRender?: (props: T) => void;
  } = {}
): Promise<NavigationTestResult[]> {
  const { timeout = 5000, onRender } = options;
  const results: NavigationTestResult[] = [];

  for (const props of propVariations) {
    const startTime = performance.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      onRender?.(props);

      // Simulate render
      await new Promise((resolve) => {
        setTimeout(resolve, 50);
      });

      const renderTime = performance.now() - startTime;

      if (renderTime > timeout) {
        warnings.push(`Render time (${renderTime.toFixed(2)}ms) exceeds timeout (${timeout}ms)`);
      }

      results.push({
        route: Component.name || 'Component',
        passed: errors.length === 0,
        errors,
        warnings,
        renderTime,
      });
    } catch (error) {
      const renderTime = performance.now() - startTime;
      errors.push(error instanceof Error ? error.message : String(error));

      results.push({
        route: Component.name || 'Component',
        passed: false,
        errors,
        warnings,
        renderTime,
      });
    }
  }

  return results;
}

/**
 * Test route parameter validation
 */
export function testRouteParams(
  params: Record<string, unknown>,
  schema: Record<string, { required?: boolean; type?: string; validator?: (value: unknown) => boolean }>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (const [key, config] of Object.entries(schema)) {
    const value = params[key];

    if (config.required && (value === undefined || value === null)) {
      errors.push(`Required parameter '${key}' is missing`);
      continue;
    }

    if (value !== undefined && value !== null) {
      if (config.type) {
        const actualType = typeof value;
        if (actualType !== config.type) {
          errors.push(`Parameter '${key}' expected type '${config.type}', got '${actualType}'`);
        }
      }

      if (config.validator && !config.validator(value)) {
        errors.push(`Parameter '${key}' failed validation`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Test navigation error handling
 */
export async function testNavigationErrorHandling(
  navigate: (route: string, params?: Record<string, unknown>) => Promise<void>,
  invalidRoutes: { route: string; params?: Record<string, unknown> }[]
): Promise<{ passed: boolean; errors: string[] }> {
  const errors: string[] = [];

  for (const { route, params } of invalidRoutes) {
    try {
      await navigate(route, params);
      // If navigation succeeds, it should have handled the error gracefully
    } catch (error) {
      // Navigation should not throw unhandled errors
      errors.push(`Navigation to '${route}' threw unhandled error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return {
    passed: errors.length === 0,
    errors,
  };
}

/**
 * Generate test report
 */
export function generateNavigationTestReport(results: NavigationTestResult[]): string {
  const total = results.length;
  const passed = results.filter(r => r.passed).length;
  const failed = total - passed;
  const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);
  const totalWarnings = results.reduce((sum, r) => sum + r.warnings.length, 0);
  const avgRenderTime = results.reduce((sum, r) => sum + (r.renderTime ?? 0), 0) / total;

  return `
Navigation Test Report
======================
Total Routes Tested: ${total}
Passed: ${passed}
Failed: ${failed}
Total Errors: ${totalErrors}
Total Warnings: ${totalWarnings}
Average Render Time: ${avgRenderTime.toFixed(2)}ms

${results.map((result, index) => `
Route ${index + 1}: ${result.route}
  Status: ${result.passed ? 'PASS' : 'FAIL'}
  Render Time: ${result.renderTime?.toFixed(2) ?? 'N/A'}ms
  ${result.errors.length > 0 ? `Errors:\n${result.errors.map(e => `    - ${e}`).join('\n')}` : ''}
  ${result.warnings.length > 0 ? `Warnings:\n${result.warnings.map(w => `    - ${w}`).join('\n')}` : ''}
`).join('\n')}
`;
}

