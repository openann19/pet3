import React from 'react';
import { TouchableOpacity, Text } from 'react-native';

export interface PaymentButtonProps {
  readonly onPress: () => void;
  readonly title?: string;
  readonly accessibilityLabel?: string;
}

export const PaymentButton: React.FC<PaymentButtonProps> = ({ onPress, title = 'Pay', accessibilityLabel }) => (
  <TouchableOpacity
    onPress={onPress}
    accessibilityLabel={accessibilityLabel || title}
    style={{ padding: 16, backgroundColor: '#007AFF', borderRadius: 8 }}
    activeOpacity={0.8}
  >
    <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>{title}</Text>
  </TouchableOpacity>
);

PaymentButton.displayName = 'PaymentButton';
