/**
 * Chat Header Component
 * 
 * Header for chat screen with title and call button.
 * 
 * Location: apps/mobile/src/components/chat/ChatHeader.tsx
 */

import React, { memo } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { colors } from '@mobile/theme/colors'
import { typography, spacing, radius, component } from '@mobile/theme/tokens'

export interface ChatHeaderProps {
  isInCall: boolean
  onStartCall: () => void | Promise<void>
}

export const ChatHeader = memo(({ isInCall, onStartCall }: ChatHeaderProps): React.ReactElement => {
  return (
    <View style={styles.header} accessible={false}>
      <Text
        style={styles.headerTitle}
        accessible={true}
        accessibilityRole="header"
        accessibilityLabel="Chat screen"
      >
        Chat
      </Text>
      {!isInCall && (
        <Pressable
          onPress={() => {
            void onStartCall()
          }}
          style={styles.callButton}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Start video call"
          accessibilityHint="Initiates a video call with the current chat participant"
        >
          <Text style={styles.callButtonText} accessible={false}>
            📹 Call
          </Text>
        </Pressable>
      )}
    </View>
  )
})

ChatHeader.displayName = 'ChatHeader'

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: typography.h2.fontSize,
    fontWeight: typography.h2.fontWeight,
    lineHeight: typography.h2.lineHeight,
    color: colors.textPrimary,
  },
  callButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    minHeight: component.touchTargetMin,
    minWidth: component.touchTargetMin,
    justifyContent: 'center',
    alignItems: 'center',
  },
  callButtonText: {
    color: colors.textPrimary,
    fontWeight: typography.body.fontWeight,
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
  },
})

