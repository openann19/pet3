import React, { memo, useCallback } from 'react'

import { FeatureCard } from '@mobile/components/FeatureCard'
import { PullableContainer } from '@mobile/components/PullableContainer'
import { RouteErrorBoundary } from '@mobile/components/RouteErrorBoundary'
import { OfflineIndicator } from '@mobile/components/OfflineIndicator'
import { useNetworkStatus } from '@mobile/hooks/use-network-status'
import { SectionHeader } from '@mobile/components/SectionHeader'
import { getTranslations } from '@mobile/i18n/translations'
import { samplePets } from '@mobile/data/mock-data'
import { colors } from '@mobile/theme/colors'
import { createLogger } from '@mobile/utils/logger'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Animated, { FadeIn } from 'react-native-reanimated'

const logger = createLogger('ProfileScreen')

// Default language (can be made dynamic later)
const language = 'en'
const t = getTranslations(language)

function ProfileScreenContent(): React.JSX.Element {
  const networkStatus = useNetworkStatus()

  const handleRefresh = useCallback(async (): Promise<void> => {
    try {
      // Simulate network delay for better UX
      await new Promise(resolve => setTimeout(resolve, 500))
    } catch (error) {
      logger.warn('ProfileScreen refresh failed', {
        error: error instanceof Error ? error : new Error(String(error)),
      })
    }
  }, [])

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={['top', 'left', 'right']}
      accessible
      accessibilityLabel={t.profile.title}
    >
      {!networkStatus.isConnected && (
        <Animated.View entering={FadeIn.duration(300)}>
          <OfflineIndicator message={t.chat.offlineMessage} />
        </Animated.View>
      )}
      <PullableContainer onRefresh={handleRefresh}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          accessible
          accessibilityLabel={`${t.profile.title}. ${t.profile.description}`}
        >
          <SectionHeader
            title={t.profile.title}
            description={t.profile.description}
          />

          {samplePets.map(pet => (
            <FeatureCard
              key={pet.id}
              title={pet.name}
              subtitle={`${pet.breedName} • ${pet.location.city}`}
              accessible
              accessibilityLabel={`${pet.name}, ${pet.breedName}, ${pet.location.city}`}
            >
              <InfoRow label={t.profile.lifeStage} value={pet.lifeStage} />
              <InfoRow
                label={t.profile.intents}
                value={
                  Array.isArray(pet.intents) && pet.intents.length
                    ? pet.intents.join(', ')
                    : t.profile.noValue
                }
              />
              <InfoRow
                label={t.profile.kyc}
                value={pet.kycVerified ? t.profile.kycVerified : t.profile.kycPending}
                tone={pet.kycVerified ? 'success' : 'warning'}
              />
              <InfoRow
                label={t.profile.vetDocs}
                value={pet.vetVerified ? t.profile.vetVerified : t.profile.vetMissing}
                tone={pet.vetVerified ? 'success' : 'warning'}
              />
            </FeatureCard>
          ))}
        </ScrollView>
      </PullableContainer>
    </SafeAreaView>
  )
}

export function ProfileScreen(): React.JSX.Element {
  return (
    <RouteErrorBoundary
      onError={(error) => {
        logger.warn('ProfileScreen error', {
          error: error instanceof Error ? error.message : String(error),
        })
      }}
    >
      <ProfileScreenContent />
    </RouteErrorBoundary>
  )
}

type Tone = 'default' | 'success' | 'warning'

const InfoRow = memo(
  ({ label, value, tone = 'default' }: { label: string; value: string; tone?: Tone }) => {
    const valueStyle =
      tone === 'success' ? styles.success : tone === 'warning' ? styles.warning : styles.value
    return (
      <View
        style={styles.row}
        accessible
        accessibilityRole="summary"
        accessibilityLabel={`${label}: ${value}`}
      >
        <Text
          style={styles.label}
          accessible
          accessibilityLabel={label}
        >
          {label}
        </Text>
        <Text
          style={valueStyle}
          numberOfLines={1}
          ellipsizeMode="tail"
          accessible
          accessibilityLabel={value}
        >
          {value}
        </Text>
      </View>
    )
  }
)

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 28 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  label: { color: colors.textPrimary, fontWeight: '600' },
  value: { color: colors.textSecondary, textTransform: 'capitalize' },
  success: { color: colors.success, textTransform: 'capitalize' },
  warning: { color: colors.warning, textTransform: 'capitalize' },
})
