/**
 * MatchesScreen Component
 *
 * Matches screen with video calling integration
 * Location: apps/mobile/src/screens/MatchesScreen.tsx
 */
import { SectionHeader } from '@mobile/components/SectionHeader'
import { PremiumEmptyState } from '@mobile/components/enhanced/states/PremiumEmptyState'
import { CallModals } from '@mobile/components/matches/CallModals'
import { useMatchesCallManager } from '@mobile/hooks/matches/useMatchesCallManager'
import { useValidatedRouteParam } from '@mobile/hooks/use-validated-route-params'
import { colors } from '@mobile/theme/colors'
import { spacing } from '@mobile/theme/tokens'
import React, { useState } from 'react'
import { StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Animated, { FadeIn, FadeOut, SlideInUp } from 'react-native-reanimated'

export function MatchesScreen(): React.ReactElement {
  // Validate and extract route params safely
  const matchIdParam = useValidatedRouteParam('Matches', 'matchId')
  
  // Type-safe extraction: validate that param is a string
  const matchId = typeof matchIdParam === 'string' ? matchIdParam : undefined
  
  const [selectedMatchUserName] = useState<string>('Match User')
  const [selectedMatchUserPhoto] = useState<string | undefined>()

  // Use call manager hook
  const { callManager, handleEndCall, handleAcceptCall, handleDeclineCall } = useMatchesCallManager({
    matchId,
    selectedMatchUserName,
    selectedMatchUserPhoto,
  })

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View
        accessible={true}
        accessibilityRole="main"
        accessibilityLabel="Matches screen"
        style={styles.mainContainer}
      >
        <Animated.View entering={FadeIn.duration(300)} exiting={FadeOut.duration(200)} style={styles.container}>
          <Animated.View entering={SlideInUp.springify().delay(100)} accessible={false}>
            <SectionHeader title="Matches" description="Signal-driven pairing results." />
          </Animated.View>
          <Animated.View
            entering={SlideInUp.springify().delay(200)}
            style={styles.emptyStateContainer}
            accessible={true}
            accessibilityRole="alert"
            accessibilityLabel="No matches yet"
          >
            <PremiumEmptyState
              title="No matches yet"
              description="Keep swiping to find your perfect match! When you match with someone, they'll appear here."
              variant="minimal"
            />
          </Animated.View>
        </Animated.View>
      </View>

      <CallModals
        callManager={callManager}
        onEndCall={handleEndCall}
        onAcceptCall={handleAcceptCall}
        onDeclineCall={handleDeclineCall}
      />
    </SafeAreaView>
  )
}

MatchesScreen.displayName = 'MatchesScreen'

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  mainContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: spacing.lg,
    paddingBottom: spacing['2xl'],
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
  },
})
