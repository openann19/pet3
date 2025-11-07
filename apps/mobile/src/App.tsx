import { ErrorBoundary } from '@mobile/components/ErrorBoundary'
import { OfflineIndicator } from '@mobile/components/OfflineIndicator'
import { AppNavigator } from '@mobile/navigation/AppNavigator'
import { QueryProvider } from '@mobile/providers/QueryProvider'
import { colors } from '@mobile/theme/colors'
import { initBackgroundUploads } from '@mobile/utils/background-uploads'
import { createLogger } from '@mobile/utils/logger'
import { errorTracking } from '@mobile/utils/error-tracking'
import { AgeVerification, isAgeVerified } from '@mobile/components/compliance/AgeVerification'
import { StatusBar } from 'expo-status-bar'
import React, { useEffect, useState } from 'react'
import { SafeAreaProvider } from 'react-native-safe-area-context'

const logger = createLogger('App')

export default function App(): React.JSX.Element {
  const [ageVerified, setAgeVerified] = useState<boolean | null>(null)

  useEffect(() => {
    initBackgroundUploads().catch((error) => {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to initialize background uploads', err)
    })

    // Check age verification
    isAgeVerified().then((verified) => {
      setAgeVerified(verified)
    }).catch((error) => {
      logger.warn('Failed to check age verification', { error })
      setAgeVerified(true) // Allow access if check fails
    })

    // Initialize error tracking
    errorTracking.setUserContext('anonymous')
  }, [])

  // Show age verification if not verified
  if (ageVerified === false) {
    return (
      <ErrorBoundary>
        <SafeAreaProvider>
          <AgeVerification
            onVerified={(verified) => setAgeVerified(verified)}
            requiredAge={13}
          />
        </SafeAreaProvider>
      </ErrorBoundary>
    )
  }

  // Show loading while checking age verification
  if (ageVerified === null) {
    return null // Or show a loading screen
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
