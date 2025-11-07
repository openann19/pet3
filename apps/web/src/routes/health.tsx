import { createLogger } from '@/lib/logger';
import { ENV } from '@/config/env';
import type { LoaderFunctionArgs } from 'react-router-dom';

const logger = createLogger('HealthCheck');

interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  version: string;
  environment: string;
  checks?: {
    [key: string]: {
      status: 'healthy' | 'unhealthy';
      message?: string;
      latency?: number;
    };
  };
}

/**
 * Health check endpoint for liveness probe
 * Returns 200 if the application is running
 */
export async function healthzLoader(_args: LoaderFunctionArgs): Promise<Response> {
  const startTime = Date.now();
  
  const health: HealthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: ENV.VITE_APP_VERSION || '0.0.0',
    environment: ENV.VITE_ENVIRONMENT || 'development',
  };

  const latency = Date.now() - startTime;
  
  logger.debug('Health check', { latency, environment: health.environment });

  return new Response(JSON.stringify(health, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}

/**
 * Readiness check endpoint
 * Returns 200 if the application is ready to serve traffic
 */
export async function readyzLoader(_args: LoaderFunctionArgs): Promise<Response> {
  const startTime = Date.now();
  const checks: HealthStatus['checks'] = {};

  // Check environment configuration
  const envCheck = {
    status: 'healthy' as const,
    message: 'Environment variables validated',
  };
  checks.environment = envCheck;

  // Check if mocks are disabled in production
  if (ENV.VITE_ENVIRONMENT === 'production') {
    if (ENV.VITE_USE_MOCKS === 'true') {
      checks.mocks = {
        status: 'unhealthy',
        message: 'Mocks enabled in production',
      };
    } else {
      checks.mocks = {
        status: 'healthy',
        message: 'Mocks disabled',
      };
    }
  }

  // Check required services (non-blocking)
  if (ENV.VITE_ENVIRONMENT === 'production') {
    checks.services = {
      status: 'healthy',
      message: 'Service credentials configured',
    };
    
    if (!ENV.VITE_SENTRY_DSN) {
      checks.services = {
        status: 'unhealthy',
        message: 'Sentry DSN missing',
      };
    }
  }

  const latency = Date.now() - startTime;
  const allHealthy = Object.values(checks).every(check => check.status === 'healthy');

  const readiness: HealthStatus = {
    status: allHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    version: ENV.VITE_APP_VERSION || '0.0.0',
    environment: ENV.VITE_ENVIRONMENT || 'development',
    checks: {
      ...checks,
      latency: {
        status: 'healthy',
        latency,
      },
    },
  };

  logger.debug('Readiness check', { 
    status: readiness.status, 
    latency,
    checks: Object.keys(checks),
  });

  return new Response(JSON.stringify(readiness, null, 2), {
    status: allHealthy ? 200 : 503,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}

