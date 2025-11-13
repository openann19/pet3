import React, { useCallback } from 'react'
import { PullableContainer } from '@mobile/components/PullableContainer'
import { SectionHeader } from '@mobile/components/SectionHeader'
import { PremiumEmptyState } from '@mobile/components/enhanced/states/PremiumEmptyState'
import { AdoptionListingCard } from '@mobile/components/adoption/AdoptionListingCard'
import { StatusTransitionList } from '@mobile/components/adoption/StatusTransitionList'
import { useAdoptionData } from '@mobile/hooks/useAdoptionData'
import { colors } from '@mobile/theme/colors'
import { spacing } from '@mobile/theme/tokens'
import { REFRESH_DELAY_MS } from '@mobile/constants/timing'
import { ScrollView, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Animated, { FadeIn, SlideInUp } from 'react-native-reanimated'

export function AdoptionScreen(): React.JSX.Element {
  const { primaryPet, adoption } = useAdoptionData()

  const handleRefresh = useCallback(async (): Promise<void> => {
    // Force re-render by updating key, which will re-run useDomainSnapshots
    // Simulate network delay for better UX
    await new Promise(resolve => setTimeout(resolve, REFRESH_DELAY_MS))
  }, [])

  if (primaryPet === null || primaryPet === undefined) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View
          accessible={true}
          accessibilityRole="main"
          accessibilityLabel="Adoption screen"
        >
          <View
            accessible={true}
            accessibilityRole="alert"
            accessibilityLabel="No pet data available"
          >
            <PremiumEmptyState
              title="No pet data available"
              description="Please check your connection and try refreshing."
              variant="minimal"
            />
          </View>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View
        accessible={true}
        accessibilityRole="main"
        accessibilityLabel="Adoption domain parity screen"
        style={styles.mainContainer}
      >
        <PullableContainer onRefresh={handleRefresh}>
          <ScrollView
            contentContainerStyle={styles.content}
            accessible={false}
            keyboardShouldPersistTaps="handled"
          >
            <Animated.View entering={SlideInUp.springify().delay(100)} accessible={false}>
              <SectionHeader
                title="Adoption domain parity"
                description="Shared rules ensure that marketplace moderation behaves consistently across platforms."
              />
            </Animated.View>

            <Animated.View entering={FadeIn.duration(300).delay(200)} accessible={false}>
              <AdoptionListingCard
                pet={primaryPet}
                canEditActiveListing={adoption.canEditActiveListing}
                canReceiveApplications={adoption.canReceiveApplications}
              />
            </Animated.View>

            <Animated.View entering={FadeIn.duration(300).delay(300)} accessible={false}>
              <StatusTransitionList title="Allowed listing transitions" transitions={adoption.statusTransitions} />
            </Animated.View>

            <Animated.View entering={FadeIn.duration(300).delay(400)} accessible={false}>
              <StatusTransitionList
                title="Application workflow"
                transitions={adoption.applicationTransitions}
              />
            </Animated.View>
          </ScrollView>
        </PullableContainer>
      </View>
    </SafeAreaView>
  )
}

AdoptionScreen.displayName = 'AdoptionScreen'

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  mainContainer: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
  },
})
