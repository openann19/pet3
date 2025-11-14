import React, { memo, useCallback, useState } from 'react'

import { FeatureCard } from '@mobile/components/FeatureCard'
import { PullableContainer } from '@mobile/components/PullableContainer'
import { RouteErrorBoundary } from '@mobile/components/RouteErrorBoundary'
import { SectionHeader } from '@mobile/components/SectionHeader'
import { ErrorScreen } from '@mobile/components/ErrorScreen'
import { OfflineIndicator } from '@mobile/components/OfflineIndicator'
import { useDomainSnapshots } from '@mobile/hooks/use-domain-snapshots'
import { useNetworkStatus } from '@mobile/hooks/use-network-status'
import { colors } from '@mobile/theme/colors'
import { getTranslations } from '@mobile/i18n/translations'
import { createLogger } from '@mobile/utils/logger'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const logger = createLogger('CommunityScreen')

// Default language (can be made dynamic later)
const language = 'en'
const t = getTranslations(language)

function CommunityScreenContent(): React.JSX.Element {
  const { data, isLoading, error, refetch } = useDomainSnapshots()
  const networkStatus = useNetworkStatus()
  const [retryCount, setRetryCount] = useState(0)
  const community = data.community

  const handleRefresh = useCallback(async (): Promise<void> => {
    try {
      await refetch()
      setRetryCount(0)
      // Simulate network delay for better UX
      await new Promise(resolve => setTimeout(resolve, 500))
    } catch (refreshError) {
      logger.warn('CommunityScreen refresh failed', {
        error: refreshError instanceof Error ? refreshError.message : String(refreshError),
        retryCount,
      })
      setRetryCount(prev => prev + 1)
    }
  }, [refetch, retryCount])

  const handleRetry = useCallback((): void => {
    // Handle retry asynchronously without returning promise
    handleRefresh().catch((retryError) => {
      logger.warn('CommunityScreen retry failed', {
        error: retryError instanceof Error ? retryError.message : String(retryError),
      })
    })
  }, [handleRefresh])

  // Show error screen if error and no valid data
  if (error && !community.canEditPendingPost && !isLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <ErrorScreen error={error} onRetry={handleRetry} />
      </SafeAreaView>
    )
  }

  // Show loading state only on initial load
  if (isLoading && !community.canEditPendingPost) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.content}>
          <Text style={styles.bodyText}>{t.common.loading}</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={['top', 'left', 'right']}
      accessible
      accessibilityLabel={t.community.title}
    >
      <PullableContainer onRefresh={handleRefresh}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          accessible
          accessibilityLabel={`${t.community.title}. ${t.community.description}`}
        >
          {!networkStatus.isConnected && (
            <OfflineIndicator />
          )}

          <SectionHeader title={t.community.title} description={t.community.description} />

          <FeatureCard
            title={t.community.moderation.title}
            accessible
            accessibilityLabel={t.community.moderation.title}
            accessibilityRole="summary"
            accessibilityHint="Community post moderation settings"
          >
            <BodyLine
              text={`${t.community.moderation.pendingPostsEditable} ${community.canEditPendingPost ? t.common.yes : t.common.no}`}
              accessibilityLabel={`${t.community.moderation.pendingPostsEditable} ${community.canEditPendingPost ? t.common.yes : t.common.no}`}
            />
            <BodyLine
              text={`${t.community.moderation.commentsOnActivePosts} ${community.canReceiveCommentsOnActivePost ? t.common.yes : t.common.no}`}
              accessibilityLabel={`${t.community.moderation.commentsOnActivePosts} ${community.canReceiveCommentsOnActivePost ? t.common.yes : t.common.no}`}
            />
          </FeatureCard>

          <FeatureCard
            title={t.community.transitions.post}
            accessible
            accessibilityLabel={t.community.transitions.post}
            accessibilityRole="summary"
            accessibilityHint="Post status transition rules"
          >
            {community.postTransitions.map((item: { status: string; allowed: boolean }) => (
              <StatusRow
                key={`post:${item.status}`}
                label={item.status}
                allowed={item.allowed}
                permittedText={t.community.transitions.permitted}
                blockedText={t.community.transitions.blocked}
              />
            ))}
          </FeatureCard>

          <FeatureCard
            title={t.community.transitions.comment}
            accessible
            accessibilityLabel={t.community.transitions.comment}
            accessibilityRole="summary"
            accessibilityHint="Comment status transition rules"
          >
            {community.commentTransitions.map((item: { status: string; allowed: boolean }) => (
              <StatusRow
                key={`comment:${item.status}`}
                label={item.status}
                allowed={item.allowed}
                permittedText={t.community.transitions.permitted}
                blockedText={t.community.transitions.blocked}
              />
            ))}
          </FeatureCard>
        </ScrollView>
      </PullableContainer>
    </SafeAreaView>
  )
}

export function CommunityScreen(): React.JSX.Element {
  return (
    <RouteErrorBoundary
      onError={(error) => {
        logger.warn('CommunityScreen error', {
          error: error instanceof Error ? error.message : String(error),
        })
      }}
    >
      <CommunityScreenContent />
    </RouteErrorBoundary>
  )
}

const BodyLine = memo(({ text, accessibilityLabel }: { text: string; accessibilityLabel?: string }) => (
  <Text
    style={styles.bodyText}
    accessible
    accessibilityRole="text"
    accessibilityLabel={accessibilityLabel ?? text}
  >
    {text}
  </Text>
))

const StatusRow = memo(({
  label,
  allowed,
  permittedText,
  blockedText,
}: {
  label: string
  allowed: boolean
  permittedText: string
  blockedText: string
}) => {
  const statusText = allowed ? permittedText : blockedText
  return (
    <View
      style={styles.row}
      accessible
      accessibilityRole="text"
      accessibilityLabel={`${label} transition: ${statusText}`}
    >
      <Text style={styles.label} accessible={false}>{label}</Text>
      <Text style={[styles.value, allowed ? styles.success : styles.blocked]} accessible={false}>
        {statusText}
      </Text>
    </View>
  )
})

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 28 },
  bodyText: { color: colors.textSecondary, fontSize: 14, lineHeight: 20 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  label: { color: colors.textPrimary, fontWeight: '600' },
  value: { textTransform: 'uppercase', fontSize: 12 },
  success: { color: colors.success },
  blocked: { color: colors.danger },
})
