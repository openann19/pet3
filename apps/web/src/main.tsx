// Polyfill for react-native-reanimated on web (backup - primary polyfill is in index.html)
// Fixes "Cannot read properties of undefined (reading 'JEST_WORKER_ID')" error
// This is a safety check in case the index.html polyfill didn't run
if (typeof window !== 'undefined') {
  // Ensure process exists (should already be set by index.html, but check anyway)
  if (typeof process === 'undefined') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).process = {};
  }
  
  // Ensure process.env exists
  if (typeof process !== 'undefined' && !process.env) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (process as any).env = {};
  }
  
  // Ensure JEST_WORKER_ID exists (even if undefined) to prevent errors
  if (typeof process !== 'undefined' && process.env && !('JEST_WORKER_ID' in process.env)) {
    process.env.JEST_WORKER_ID = undefined;
  }
}

import { createRoot } from 'react-dom/client';
import { ErrorBoundary } from 'react-error-boundary';
import { BrowserRouter } from 'react-router-dom';

// Initialize storage service
import './lib/storage';

import './lib/theme-init';

// Initialize PWA service worker in production
import { createLogger } from './lib/logger';
import { registerServiceWorker } from './lib/pwa/service-worker-registration';

import App from './App';
import { ErrorFallback } from './ErrorFallback';
import GlobalNavErrorTrap from './components/GlobalNavErrorTrap';
import { AppProvider } from './contexts/AppContext';
import { AuthProvider } from './contexts/AuthContext';
import { UIProvider } from './contexts/UIContext';
import { QueryProvider } from './providers/QueryProvider';
import { ThemeProvider } from './contexts/ThemeContext';

import './index.css';
import './main.css';
import './styles/theme.css';

const rootLogger = createLogger('web.main');

// Register service worker for PWA functionality
if (import.meta.env.PROD) {
  void registerServiceWorker({
    onError: (error) => {
      rootLogger.error('Service worker registration failed', error);
    },
  });
}

// Initialize refresh rate detection
import { detectRefreshRate } from './lib/refresh-rate';
let _refreshRateCleanup: (() => void) | null = null;
if (typeof window !== 'undefined') {
  try {
    _refreshRateCleanup = detectRefreshRate();
    if (_refreshRateCleanup) {
      window.addEventListener('beforeunload', _refreshRateCleanup);
    }
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    rootLogger.error('Refresh rate detection failed', err);
  }
}

// Initialize Web Vitals collection
import { initWebVitals } from './lib/web-vitals';

if (import.meta.env.PROD) {
  try {
    initWebVitals();
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    rootLogger.error('Web Vitals initialization failed', err);
  }
}

// Initialize error reporting
import { initErrorReporting } from './lib/error-reporting';
try {
  initErrorReporting({
    enabled: import.meta.env.PROD,
  });
} catch (error) {
  const err = error instanceof Error ? error : new Error(String(error));
  rootLogger.error('Error reporting initialization failed', err);
}

// Initialize worldwide scale features
import { initializeWorldwideScale } from './lib/worldwide-scale-init';

// Initialize worldwide scale features after a short delay to ensure other services are ready
setTimeout(() => {
  void initializeWorldwideScale({
    enableServiceWorker: import.meta.env.PROD,
    enableErrorTracking: true,
    enableWebVitals: import.meta.env.PROD,
  })
}, 100)

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found. Make sure <div id="root"></div> exists in index.html');
}

createRoot(rootElement).render(
  <ErrorBoundary FallbackComponent={ErrorFallback}>
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <GlobalNavErrorTrap />
      <QueryProvider>
        <ThemeProvider>
          <AppProvider>
            <UIProvider>
              <AuthProvider>
                <App />
              </AuthProvider>
            </UIProvider>
          </AppProvider>
        </ThemeProvider>
      </QueryProvider>
    </BrowserRouter>
  </ErrorBoundary>
);

// --- ultra: sw register ---
if ('serviceWorker' in navigator) {
  void navigator.serviceWorker.register('/sw.js').catch((error: unknown) => {
    const err = error instanceof Error ? error : new Error(String(error));
    rootLogger.warn('Fallback service worker registration failed', {
      message: err.message,
      stack: err.stack,
    });
  });
}
