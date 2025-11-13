/**
 * Discovery List Component
 * 
 * Displays list of pets in discovery view with loading, error, and empty states.
 * 
 * Location: apps/mobile/src/components/feed/DiscoveryList.tsx
 */

import React, { memo, useCallback, useMemo } from 'react'
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native'
import { FlashList } from '@shopify/flash-list'
import { FeatureCard } from '@mobile/components/FeatureCard'
import { PremiumErrorState } from '@mobile/components/enhanced/states/PremiumErrorState'
import { PremiumEmptyState } from '@mobile/components/enhanced/states/PremiumEmptyState'
import type { PetProfile } from '@mobile/types/pet'
import { useFeedData } from '@mobile/hooks/feed/useFeedData'
import { colors } from '@mobile/theme/colors'
import { typography, spacing } from '@mobile/theme/tokens'

export const DiscoveryList = memo((): React.ReactElement => {
  const { pets, loading, error, loadPets } = useFeedData()

  // Memoize pet item component to prevent unnecessary re-renders
  const PetItem = memo(({ item }: { item: PetProfile }): React.ReactElement => {
    const subtitle = useMemo(
      () => `${item.breed ?? ''} • ${item.age ?? 0} years old`,
      [item.breed, item.age]
    )
    const speciesLabel = useMemo(() => `Species: ${item.species}`, [item.species])
    const photosLabel = useMemo(() => `Photos: ${item.photos.length}`, [item.photos.length])

    return (
      <FeatureCard title={item.name} subtitle={subtitle}>
        <View
          style={styles.row}
          accessible={true}
          accessibilityRole="summary"
          accessibilityLabel={speciesLabel}
        >
          <Text style={styles.label}>Species</Text>
          <Text style={styles.value}>{item.species}</Text>
        </View>
        <View
          style={styles.row}
          accessible={true}
          accessibilityRole="summary"
          accessibilityLabel={photosLabel}
        >
          <Text style={styles.label}>Photos</Text>
          <Text style={styles.value}>{item.photos.length}</Text>
        </View>
      </FeatureCard>
    )
  })

  PetItem.displayName = 'PetItem'

  // Define callbacks before early returns (React hooks rules)
  const renderItem = useCallback(
    ({ item }: { item: PetProfile }) => <PetItem item={item} />,
    []
  )

  const keyExtractor = useCallback((item: PetProfile) => item.id, [])

  const listFooterComponent = useMemo(() => {
    if (pets.length === 0) return null
    return <View style={styles.listFooter} />
  }, [pets.length])

  if (loading === true) {
    return (
      <View style={styles.loadingContainer} accessible accessibilityRole="progressbar" accessibilityLabel="Loading pets">
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.loadingText} accessibilityLiveRegion="polite">Loading pets...</Text>
      </View>
    )
  }

  if (error !== null && error !== undefined && error !== '') {
    return (
      <PremiumErrorState
        title="Failed to load pets"
        message={error}
        onRetry={() => {
          void loadPets()
        }}
        retryLabel="Retry"
        variant="default"
      />
    )
  }

  if (pets.length === 0) {
    return (
      <PremiumEmptyState
        title="No pets found"
        description="Try adjusting your search filters or check back later"
        variant="minimal"
      />
    )
  }

  return (
    <FlashList
      data={pets}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      ListFooterComponent={listFooterComponent}
      estimatedItemSize={200}
      contentContainerStyle={styles.listContent}
      accessibilityRole="list"
      accessibilityLabel="List of available pets"
    />
  )
})

DiscoveryList.displayName = 'DiscoveryList'

const styles = StyleSheet.create({
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing['2xl'],
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
    color: colors.textSecondary,
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: spacing['2xl'],
  },
  listFooter: {
    height: spacing['2xl'],
  },
})

