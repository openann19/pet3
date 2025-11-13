/**
 * AdoptionListingCard Component
 * Displays adoption listing information
 * Location: apps/mobile/src/components/adoption/AdoptionListingCard.tsx
 */

import React, { memo } from 'react'
import { Text, StyleSheet } from 'react-native'
import { FeatureCard } from '@mobile/components/FeatureCard'
import { colors } from '@mobile/theme/colors'
import { typography } from '@mobile/theme/tokens'
import type { PetProfile } from '@pet/domain/pet-model'

interface AdoptionListingCardProps {
  pet: PetProfile
  canEditActiveListing: boolean
  canReceiveApplications: boolean
}

export const AdoptionListingCard = memo(
  ({ pet, canEditActiveListing, canReceiveApplications }: AdoptionListingCardProps): React.ReactElement => {
    return (
      <FeatureCard
        title={`Listing: ${pet.name}`}
        subtitle={`${pet.location.city}, ${pet.location.country}`}
      >
        <Text style={styles.bodyText}>Status: active</Text>
        <Text style={styles.bodyText}>Owner can edit: {canEditActiveListing ? 'Yes' : 'No'}</Text>
        <Text style={styles.bodyText}>
          Applications accepted: {canReceiveApplications ? 'Yes' : 'No'}
        </Text>
      </FeatureCard>
    )
  }
)

AdoptionListingCard.displayName = 'AdoptionListingCard'

const styles = StyleSheet.create({
  bodyText: {
    color: colors.textSecondary,
    fontSize: typography.bodySm.fontSize,
    lineHeight: typography.bodySm.lineHeight,
  },
})

