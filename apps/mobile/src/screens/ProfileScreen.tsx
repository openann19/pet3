import React, { useCallback } from 'react'

import { PullableContainer } from '@mobile/components/PullableContainer'
import { SectionHeader } from '@mobile/components/SectionHeader'
import { PremiumEmptyState } from '@mobile/components/enhanced/states/PremiumEmptyState'
import { PetProfileCard } from '@mobile/components/profile/PetProfileCard'
import { useProfileData } from '@mobile/hooks/useProfileData'
import { useValidatedRouteParam } from '@mobile/hooks/use-validated-route-params'
import { colors } from '@mobile/theme/colors'
import { spacing } from '@mobile/theme/tokens'
import { REFRESH_DELAY_MS } from '@mobile/constants/timing'
import { ScrollView, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export function ProfileScreen(): React.JSX.Element {
  // Validate and extract route params safely
  const petIdParam = useValidatedRouteParam('Profile', 'petId')
  const userIdParam = useValidatedRouteParam('Profile', 'userId')

  // Type-safe extraction: validate that params are strings
  const petId = typeof petIdParam === 'string' ? petIdParam : undefined
  const userId = typeof userIdParam === 'string' ? userIdParam : undefined

  const handleRefresh = useCallback(async (): Promise<void> => {
    // Simulate network delay for better UX
    await new Promise(resolve => setTimeout(resolve, REFRESH_DELAY_MS))
  }, [])

  // Fetch profile data
  const { displayedPets } = useProfileData({ petId, userId })

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View
        accessible={true}
        accessibilityRole="main"
        accessibilityLabel="Pet profile screen"
        style={styles.mainContainer}
      >
        <PullableContainer onRefresh={handleRefresh}>
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            accessible={false}
          >
            <SectionHeader
              title="Operator overview"
              description="Snapshot of mobile-ready records pulled directly from the shared domain schema."
            />

            {displayedPets.length === 0 ? (
              <View
                style={styles.emptyStateContainer}
                accessible={true}
                accessibilityRole="alert"
                accessibilityLabel="No pets found"
              >
                <PremiumEmptyState
                  title="No pets found"
                  description={
                    petId !== null && petId !== undefined && petId !== ''
                      ? `Pet with ID ${petId} not found`
                      : 'Add a pet to get started'
                  }
                  variant="minimal"
                />
              </View>
            ) : (
              <View
                accessible={true}
                accessibilityRole="list"
                accessibilityLabel={`List of ${displayedPets.length} pet profile${displayedPets.length === 1 ? '' : 's'}`}
              >
                {displayedPets.map((pet) => (
                  <PetProfileCard key={pet.id} pet={pet} />
                ))}
              </View>
            )}
          </ScrollView>
        </PullableContainer>
      </View>
    </SafeAreaView>
  )
}

ProfileScreen.displayName = 'ProfileScreen'

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  mainContainer: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing['2xl'] },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    minHeight: 300,
  },
})
