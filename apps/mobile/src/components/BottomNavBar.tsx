import { usePressAnimation } from '@mobile/hooks/use-press-animation'
import { colors } from '@mobile/theme/colors'
import * as Haptics from 'expo-haptics'
import React, { memo, useCallback } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import Animated from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'

export type TabKey = 'community' | 'chat' | 'feed' | 'adopt' | 'matches' | 'profile'

export interface BottomItem {
  key: TabKey
  label: string
  badge?: number
}

interface BottomNavBarProps {
  active: TabKey
  items: BottomItem[]
  onChange: (key: TabKey) => void
}

export function BottomNavBar({
  active,
  items,
  onChange,
}: BottomNavBarProps): React.ReactElement {
  const handlePress = useCallback(
    (key: TabKey): void => {
      if (key !== active) {
        onChange(key)
      }
    },
    [active, onChange]
  )

  return (
    <SafeAreaView edges={['bottom']} style={styles.safe} accessibilityRole="tablist">
      <View style={styles.bar}>
        {items.map((it) => {
          const selected = it.key === active
          return (
            <TabItem
              key={it.key}
              item={it}
              selected={selected}
              onPress={() => {
                handlePress(it.key)
              }}
            />
          )
        })}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 10,
  },
  item: {
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 12,
  },
  itemActive: {
    backgroundColor: colors.card,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  labelActive: {
    color: colors.textPrimary,
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 16,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    backgroundColor: colors.danger,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
})

interface TabItemProps {
  item: BottomItem
  selected: boolean
  onPress: () => void
}

function TabItem({ item, selected, onPress }: TabItemProps): React.ReactElement {
  const { animatedStyle, handlePressIn, handlePressOut } = usePressAnimation({
    scaleAmount: 0.9,
    hapticFeedback: true,
    hapticStyle: Haptics.ImpactFeedbackStyle.Light,
    enableBounce: true,
  })

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.item, selected && styles.itemActive]}
        accessibilityRole="tab"
        accessibilityState={{ selected }}
        accessibilityLabel={item.label}
      >
        <Text style={[styles.label, selected && styles.labelActive]} numberOfLines={1}>
          {item.label}
        </Text>
        {typeof item.badge === 'number' && item.badge > 0 ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {item.badge > 9 ? '9+' : String(item.badge)}
            </Text>
          </View>
        ) : null}
      </Pressable>
    </Animated.View>
  )
}

export default memo(BottomNavBar)

