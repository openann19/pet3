/**
 * PetProfileCard Component
 * Displays a single pet profile card with details
 * Location: apps/mobile/src/components/profile/PetProfileCard.tsx
 */

import React, { memo } from 'react'
import { View, StyleSheet, Text } from 'react-native'
import { FeatureCard } from '@mobile/components/FeatureCard'
import { colors } from '@mobile/theme/colors'
import { typography, spacing } from '@mobile/theme/tokens'
import type { PetProfile } from '@pet/domain/pet-model'

interface PetProfileCardProps {
  pet: PetProfile
}

type Tone = 'default' | 'success' | 'warning'

interface InfoRowProps {
  label: string
  value: string
  tone?: Tone
}

const InfoRow = memo(({ label, value, tone = 'default' }: InfoRowProps): React.ReactElement => {
  const valueStyle =
    tone === 'success' ? styles.success : tone === 'warning' ? styles.warning : styles.value
  return (
    <View style={styles.row} accessible accessibilityRole="summary">
      <Text style={styles.label}>{label}</Text>
      <Text style={valueStyle} numberOfLines={1} ellipsizeMode="tail">
        {value}
      </Text>
    </View>
  )
})

InfoRow.displayName = 'InfoRow'

export const PetProfileCard = memo(({ pet }: PetProfileCardProps): React.ReactElement => {
  return (
    <View style={styles.cardContainer}>
      <FeatureCard
        title={pet.name}
        subtitle={`${pet.breedName ?? ''} • ${pet.location.city ?? ''}`}
      >
        <InfoRow label="Life stage" value={pet.lifeStage} />
        <InfoRow
          label="Intents"
          value={
            Array.isArray(pet.intents) && pet.intents.length ? pet.intents.join(', ') : '—'
          }
        />
        <InfoRow
          label="KYC"
          value={pet.kycVerified ? 'verified' : 'pending'}
          tone={pet.kycVerified ? 'success' : 'warning'}
        />
        <InfoRow
          label="Vet docs"
          value={pet.vetVerified ? 'verified' : 'missing'}
          tone={pet.vetVerified ? 'success' : 'warning'}
        />
      </FeatureCard>
    </View>
  )
})

PetProfileCard.displayName = 'PetProfileCard'

const styles = StyleSheet.create({
  cardContainer: {
    marginBottom: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  label: {
    color: colors.textPrimary,
    fontWeight: typography.h3.fontWeight,
    fontSize: typography.bodySm.fontSize,
    lineHeight: typography.bodySm.lineHeight,
  },
  value: {
    color: colors.textSecondary,
    textTransform: 'capitalize',
    fontSize: typography.bodySm.fontSize,
    lineHeight: typography.bodySm.lineHeight,
  },
  success: {
    color: colors.success,
    textTransform: 'capitalize',
    fontSize: typography.bodySm.fontSize,
    lineHeight: typography.bodySm.lineHeight,
  },
  warning: {
    color: colors.warning,
    textTransform: 'capitalize',
    fontSize: typography.bodySm.fontSize,
    lineHeight: typography.bodySm.lineHeight,
  },
})

