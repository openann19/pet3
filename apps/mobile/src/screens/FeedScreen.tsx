/**
 * FeedScreen Component
 * Main feed screen with discovery list and map view
 * Location: apps/mobile/src/screens/FeedScreen.tsx
 */

import { SectionHeader } from '@mobile/components/SectionHeader'
import { SegmentButton } from '@mobile/components/feed/SegmentButton'
import { MapPane } from '@mobile/components/feed/MapPane'
import { DiscoveryList } from '@mobile/components/feed/DiscoveryList'
import { colors } from '@mobile/theme/colors'
import { spacing, radius, component, motion } from '@mobile/theme/tokens'
import * as Haptics from 'expo-haptics'
import React, { useCallback, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs'
import type { RootTabParamList } from '@mobile/navigation/types'

type Tab = 'discovery' | 'map'

type FeedScreenProps = BottomTabScreenProps<RootTabParamList, 'Feed'>

export function FeedScreen(_props: FeedScreenProps): React.ReactElement {
  // Feed screen doesn't use route params, but we validate for consistency
  // Route params are validated by the navigation system
  const [tab, setTab] = useState<Tab>('discovery')
  const x = useSharedValue(0)

  const handleTabChange = useCallback(
    (next: Tab): void => {
      if (next === tab) return
      try {
        void Haptics.selectionAsync()
      } catch {
        // Haptics may not be available
      }
      setTab(next)
      x.value = withTiming(next === 'discovery' ? 0 : 1, { duration: motion.normal })
    },
    [tab, x]
  )

  const indicator = useAnimatedStyle(() => {
    const translateX = x.value * 100
    return {
      transform: [{ translateX }],
    }
  })

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.container} accessible={false}>
        <View
          accessible={true}
          accessibilityRole="header"
          accessibilityLabel="Discover pets"
          accessibilityHint="Main heading for the feed screen"
        >
          <SectionHeader title="Discover" description="Browse nearby pets or switch to map view." />
        </View>

        <View style={styles.segment} accessibilityRole="tablist" accessibilityLabel="View selection tabs">
          <View style={styles.segmentTrack} accessible={false}>
            <Animated.View style={[styles.segmentIndicator, indicator]} accessible={false} />
            <SegmentButton
              label="Discover"
              selected={tab === 'discovery'}
              onPress={() => {
                handleTabChange('discovery')
              }}
            />
            <SegmentButton
              label="Map"
              selected={tab === 'map'}
              onPress={() => {
                handleTabChange('map')
              }}
            />
          </View>
        </View>

        <View
          accessible={true}
          accessibilityRole="main"
          accessibilityLabel={tab === 'discovery' ? 'Pet discovery list' : 'Pet map view'}
        >
          {tab === 'discovery' ? <DiscoveryList /> : <MapPane />}
        </View>
      </View>
    </SafeAreaView>
  )
}

FeedScreen.displayName = 'FeedScreen'

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  segment: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  segmentTrack: {
    height: component.buttonHeight.md,
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'space-between',
    flexDirection: 'row',
    paddingHorizontal: spacing.sm,
    overflow: 'hidden',
  },
  segmentIndicator: {
    position: 'absolute',
    height: component.buttonHeight.md - spacing.xs,
    width: '50%',
    left: spacing.xs / 2,
    top: spacing.xs / 2,
    borderRadius: radius.full,
    backgroundColor: colors.card,
  },
})
