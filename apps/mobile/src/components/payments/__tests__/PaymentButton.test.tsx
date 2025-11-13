import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react-native';
// Removed userEvent import; use fireEvent from @testing-library/react-native if needed

// Mock payment component - adjust import path as needed
vi.mock('@mobile/components/payments', () => ({
  PaymentButton: ({ onPress }: { onPress: () => void }) => (
  <Button onPress={onPress} title="Pay" />
  ),
}));

describe('PaymentButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders payment button', () => {
    const mockOnPress = vi.fn();
  render(<PaymentButton onPress={mockOnPress} />);

  expect(screen.getByText('Pay')).toBeTruthy();
  });

  it('calls onPress when clicked', async () => {
  // Removed userEvent usage; use fireEvent if needed
    const mockOnPress = vi.fn();
  render(<PaymentButton onPress={mockOnPress} />);

  const button = screen.getByText('Pay');
  fireEvent.press(button);

    await waitFor(() => {
      expect(mockOnPress).toHaveBeenCalledTimes(1);
    });
  });
});

