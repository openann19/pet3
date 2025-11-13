import { AgeVerification, isAgeVerified } from './components/compliance'
import { ErrorBoundary } from './components/ErrorBoundary'
import { OfflineIndicator } from './components/OfflineIndicator'
import { AppNavigator } from './navigation/AppNavigator'
import { QueryProvider } from './providers/QueryProvider'
import { colors } from './theme/colors'
import { initBackgroundUploads } from './utils/background-uploads'
import { createLogger } from './utils/logger'
import { initializeSecurity } from './utils/security-init'
import { StatusBar } from 'expo-status-bar'
import React, { useEffect, useState } from 'react'
import { SafeAreaProvider } from 'react-native-safe-area-context'

const logger = createLogger('App')

// Global error handler for production
if (__DEV__ === false) {
  const ErrorUtils = require('react-native').ErrorUtils
  const origHandler = ErrorUtils?.getGlobalHandler?.()

  ErrorUtils?.setGlobalHandler?.((error: Error, isFatal?: boolean) => {
    logger.error('RNGlobalError', error, {
      isFatal,
      message: error?.message,
      stack: error?.stack,
    })

    origHandler?.(error, isFatal)
  })
}

export default function App(): React.JSX.Element {
  const [ageVerified, setAgeVerified] = useState<boolean | null>(null)

  useEffect(() => {
    // Initialize security
    initializeSecurity({
      allowEmulator: __DEV__,
      allowDevMode: __DEV__,
      strictMode: false,
    }).catch((error: unknown) => {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to initialize security', err)
    })

    initBackgroundUploads().catch((error: unknown) => {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to initialize background uploads', err)
    })

    // Check age verification
    isAgeVerified().then((verified: boolean) => {
      setAgeVerified(verified)
    }).catch((error: unknown) => {
      logger.warn('Failed to check age verification', { error })
      setAgeVerified(true) // Allow access if check fails
    })
  }, [])

  // Show age verification if not verified
  if (ageVerified === false) {
    return (
      <ErrorBoundary>
        <SafeAreaProvider>
          <AgeVerification
            onVerified={(verified: boolean) => setAgeVerified(verified)}
            requiredAge={13}
          />
        </SafeAreaProvider>
      </ErrorBoundary>
    )
  }

  // Show loading while checking age verification
  if (ageVerified === null) {
    return <></>
  }

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <QueryProvider>
          <StatusBar style="light" backgroundColor={colors.card} />
          <OfflineIndicator />
          <AppNavigator />
        </QueryProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  )
}
