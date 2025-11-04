import { createRoot } from 'react-dom/client'
import { ErrorBoundary } from "react-error-boundary";
import { BrowserRouter } from 'react-router-dom'

// Initialize storage service
import './lib/storage'

// Initialize Spark compatibility layer for any remaining direct calls
import './lib/spark-compat'

import './lib/theme-init'

import App from './App.tsx'
import { ErrorFallback } from './ErrorFallback.tsx'
import { AppProvider } from './contexts/AppContext.tsx'

import "./main.css"
import "./styles/theme.css"
import "./index.css"

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary FallbackComponent={ErrorFallback}>
    <BrowserRouter>
      <AppProvider>
        <App />
      </AppProvider>
    </BrowserRouter>
   </ErrorBoundary>
)
