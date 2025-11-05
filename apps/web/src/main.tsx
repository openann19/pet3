import { createRoot } from 'react-dom/client';
import { ErrorBoundary } from "react-error-boundary";
import { BrowserRouter } from 'react-router-dom';

// Initialize storage service
import './lib/storage';

import './lib/theme-init';

import App from './App.tsx';
import { ErrorFallback } from './ErrorFallback.tsx';
import { AppProvider } from './contexts/AppContext.tsx';
import { AuthProvider } from './contexts/AuthContext.tsx';
import { UIProvider } from './contexts/UIContext.tsx';

import "./index.css";
import "./main.css";
import "./styles/theme.css";

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary FallbackComponent={ErrorFallback}>
    <BrowserRouter>
      <AppProvider>
        <UIProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </UIProvider>
      </AppProvider>
    </BrowserRouter>
   </ErrorBoundary>
)
