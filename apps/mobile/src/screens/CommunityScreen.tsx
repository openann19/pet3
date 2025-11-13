import React, { memo, useCallback } from 'react'

import { FeatureCard } from '@mobile/components/FeatureCard'
import { PullableContainer } from '@mobile/components/PullableContainer'
import { SectionHeader } from '@mobile/components/SectionHeader'
import { useDomainSnapshots } from '@mobile/hooks/use-domain-snapshots'
import { useValidatedRouteParam } from '@mobile/hooks/use-validated-route-params'
import { colors } from '@mobile/theme/colors'
import { typography, spacing } from '@mobile/theme/tokens'
import { REFRESH_DELAY_MS } from '@mobile/constants/timing'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Animated, { FadeIn, SlideInUp } from 'react-native-reanimated'

export function CommunityScreen(): React.JSX.Element {
  // Validate and extract route params safely
  // Note: postId and userId are available for future filtering logic
  // Currently unused but kept for future implementation
  const _postId = useValidatedRouteParam('Community', 'postId')
  const _userId = useValidatedRouteParam('Community', 'userId')

  const { community } = useDomainSnapshots()

  const handleRefresh = useCallback(async (): Promise<void> => {
    // Simulate network delay for better UX
    await new Promise(resolve => setTimeout(resolve, REFRESH_DELAY_MS))
  }, [])

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <PullableContainer onRefresh={handleRefresh}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={SlideInUp.springify().delay(100)}>
            <SectionHeader
              title="Community safety rails"
              description="Moderation and engagement policies mirrored from the web app ensure identical enforcement."
            />
          </Animated.View>

          <Animated.View entering={FadeIn.duration(300).delay(200)}>
            <FeatureCard title="Post moderation">
            <BodyLine
              text={`Pending posts can be edited: ${community.canEditPendingPost ? 'Yes' : 'No'}`}
            />
            <BodyLine
              text={`Comments allowed on active posts: ${
                community.canReceiveCommentsOnActivePost ? 'Yes' : 'No'
              }`}
            />
          </FeatureCard>
          </Animated.View>

          <Animated.View entering={FadeIn.duration(300).delay(300)}>
            <FeatureCard title="Post transitions">
            {community.postTransitions.map(item => (
              <StatusRow key={`post:${item.status}`} label={item.status} allowed={item.allowed} />
            ))}
          </FeatureCard>
          </Animated.View>

          <Animated.View entering={FadeIn.duration(300).delay(400)}>
            <FeatureCard title="Comment transitions">
            {community.commentTransitions.map(item => (
              <StatusRow
                key={`comment:${item.status}`}
                label={item.status}
                allowed={item.allowed}
              />
            ))}
          </FeatureCard>
          </Animated.View>
        </ScrollView>
      </PullableContainer>
    </SafeAreaView>
  )
}

CommunityScreen.displayName = 'CommunityScreen'

const BodyLine = memo(({ text }: { text: string }) => (
  <Text style={styles.bodyText} accessible={true} accessibilityRole="text">
    {text}
  </Text>
))

BodyLine.displayName = 'BodyLine'

const StatusRow = memo(({ label, allowed }: { label: string; allowed: boolean }) => {
  return (
    <View
      style={styles.row}
      accessible={true}
      accessibilityRole="summary"
      accessibilityLabel={`${label}: ${allowed ? 'permitted' : 'blocked'}`}
    >
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, allowed ? styles.success : styles.blocked]}>
        {allowed ? 'permitted' : 'blocked'}
      </Text>
    </View>
  )
})

StatusRow.displayName = 'StatusRow'

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing['2xl'] },
  bodyText: { 
    color: colors.textSecondary, 
    fontSize: typography.bodySm.fontSize, 
    lineHeight: typography.bodySm.lineHeight 
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
    textTransform: 'uppercase', 
    fontSize: typography.caption.fontSize,
    lineHeight: typography.caption.lineHeight,
  },
  success: { 
    color: colors.success,
    fontSize: typography.caption.fontSize,
    lineHeight: typography.caption.lineHeight,
  },
  blocked: { 
    color: colors.danger,
    fontSize: typography.caption.fontSize,
    lineHeight: typography.caption.lineHeight,
  },
})
