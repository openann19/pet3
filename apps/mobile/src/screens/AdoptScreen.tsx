import { SectionHeader } from '@mobile/components/SectionHeader'
import { PremiumEmptyState } from '@mobile/components/enhanced/states/PremiumEmptyState'
import { useValidatedRouteParam } from '@mobile/hooks/use-validated-route-params'
import { colors } from '@mobile/theme/colors'
import { spacing } from '@mobile/theme/tokens'
import React, { useMemo } from 'react'
import { StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export function AdoptScreen(): React.ReactElement {
  // Validate and extract route params safely
  const petId = useValidatedRouteParam('Adopt', 'petId')
  const listingId = useValidatedRouteParam('Adopt', 'listingId')

  // In production, use petId/listingId to fetch specific adoption data
  // For now, we just validate they exist if provided
  const hasSpecificListing = useMemo(() => {
    return (
      (petId !== null && petId !== undefined && petId !== '') ||
      (listingId !== null && listingId !== undefined && listingId !== '')
    )
  }, [petId, listingId])

  const petIdStr = petId as string | undefined
  const listingIdStr = listingId as string | undefined

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        <SectionHeader title="Adopt" description="Browse and apply for adoptions." />
        <View style={styles.emptyStateContainer}>
          <PremiumEmptyState
            title="Adoption marketplace"
            description={
              hasSpecificListing
                ? `Viewing ${typeof petIdStr === 'string' && petIdStr !== '' ? `pet ${petIdStr}` : ''}${typeof listingIdStr === 'string' && listingIdStr !== '' ? ` listing ${listingIdStr}` : ''}. Browse available pets and apply for adoption.`
                : 'Browse available pets and apply for adoption. Listings and filters coming soon!'
            }
            variant="minimal"
          />
        </View>
      </View>
    </SafeAreaView>
  )
}

AdoptScreen.displayName = 'AdoptScreen'

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, padding: spacing.lg },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
  },
})
