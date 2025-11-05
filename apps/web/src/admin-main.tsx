import { createRoot } from 'react-dom/client';
import { ErrorBoundary } from "react-error-boundary";

import './lib/theme-init';

import AdminConsole from './components/AdminConsole';
import { AppProvider } from './contexts/AppContext';
import { ErrorFallback } from './ErrorFallback';

import "./index.css";
import "./main.css";
import "./styles/theme.css";

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary FallbackComponent={ErrorFallback}>
    <AppProvider>
      <div className="min-h-screen bg-background text-foreground">
        <AdminConsole />
      </div>
    </AppProvider>
   </ErrorBoundary>
)
