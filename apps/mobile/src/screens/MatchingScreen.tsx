import { PullableContainer } from '@mobile/components/PullableContainer'
import { MatchCelebration } from '@mobile/components/swipe/MatchCelebration'
import { SwipeCardStack } from '@mobile/components/swipe/SwipeCardStack'
import { PremiumErrorState } from '@mobile/components/enhanced/states/PremiumErrorState'
import { PremiumEmptyState } from '@mobile/components/enhanced/states/PremiumEmptyState'
import { useSwipeLogic } from '@mobile/hooks/matching/useSwipeLogic'
import { useMatchingData } from '@mobile/hooks/matching/useMatchingData'
import { colors } from '@mobile/theme/colors'
import { typography, spacing } from '@mobile/theme/tokens'
import React, { useCallback } from 'react'
import { ActivityIndicator, StyleSheet, Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as Haptics from 'expo-haptics'
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated'

export function MatchingScreen(): React.JSX.Element {
  const { pets, isLoading, error, refetch } = useMatchingData()
  const { showMatch, matchPetNames, handleSwipeLeft, handleSwipeRight, handleMatchComplete } =
    useSwipeLogic(pets)

  const handleRefresh = useCallback(async (): Promise<void> => {
    await refetch()
  }, [refetch])

  if (isLoading === true) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
          style={styles.centerContainer}
          accessible={true}
          accessibilityRole="progressbar"
          accessibilityLabel="Loading pets"
        >
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText} accessibilityLiveRegion="polite">Loading pets...</Text>
        </Animated.View>
      </SafeAreaView>
    )
  }

  if (error !== null && error !== undefined) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(150)}>
          <PremiumErrorState
            title="Failed to load pets"
            message="Unable to fetch pets for matching. Please check your connection and try again."
            error={error instanceof Error ? error : new Error('Failed to load pets')}
            onRetry={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
              void refetch()
            }}
            retryLabel="Retry"
            variant="default"
          />
        </Animated.View>
      </SafeAreaView>
    )
  }

  if (pets.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(150)} style={styles.centerContainer}>
          <PremiumEmptyState
            title="No pets available"
            description="There are no pets available for matching right now. Pull down to refresh."
            variant="minimal"
          />
        </Animated.View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View
        accessible={true}
        accessibilityRole="main"
        accessibilityLabel="Pet matching screen"
        style={styles.mainContainer}
      >
        <PullableContainer onRefresh={handleRefresh} refreshOptions={{ threshold: 100 }}>
          <>
            <Animated.View entering={FadeIn.duration(300)} exiting={FadeOut.duration(200)} style={styles.container}>
              <SwipeCardStack
                pets={pets}
                onSwipeLeft={handleSwipeLeft}
                onSwipeRight={handleSwipeRight}
              />
              <Animated.View entering={SlideInDown.springify()} exiting={SlideOutDown.duration(200)}>
                <MatchCelebration
                  visible={showMatch}
                  petNames={matchPetNames}
                  onComplete={handleMatchComplete}
                />
              </Animated.View>
            </Animated.View>
          </>
        </PullableContainer>
      </View>
    </SafeAreaView>
  )
}

MatchingScreen.displayName = 'MatchingScreen'

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  mainContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  loadingText: {
    marginTop: spacing.lg,
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
    color: colors.textSecondary,
  },
})

MatchingScreen.displayName = 'MatchingScreen'
