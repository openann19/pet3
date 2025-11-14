import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { colors } from '@mobile/theme/colors'

interface OfflineIndicatorProps {
  message?: string
}

export function OfflineIndicator({
  message = 'You are currently offline. Some features may not be available.',
}: OfflineIndicatorProps): React.JSX.Element {
  return (
    <View style={styles.container} accessible accessibilityRole="alert" accessibilityLiveRegion="polite">
      <Text style={styles.message}>{message}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.danger,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  message: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
})
