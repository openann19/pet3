import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react-native';
// Removed userEvent import; use fireEvent from @testing-library/react-native if needed
import { PremiumChip } from '@/components/enhanced/display/PremiumChip';

vi.mock('expo-haptics', () => ({
  impactAsync: vi.fn(() => Promise.resolve()),
  selectionAsync: vi.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: {
    Light: 'light',
  },
}));

describe('PremiumChip', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  it('renders chip with label', () => {
    render(
      <PremiumChip label="Test Chip" accessibilityLabel="Test chip" />
    );

    expect(screen.getByText('Test Chip')).toBeDefined();
  });

  it('calls onClose when close button is clicked', async () => {
    const mockOnClose = vi.fn();

    render(
      <PremiumChip
        label="Test Chip"
        onClose={mockOnClose}
        accessibilityLabel="Test chip"
      />
    );

    const closeButton = screen.getByRole('button');
    // Simulate button press using fireEvent
    import { fireEvent } from '@testing-library/react-native';
    fireEvent.press(closeButton);

    vi.advanceTimersByTime(200);

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  it('renders with different variants', () => {
    const { rerender } = render(
      <PremiumChip label="Chip" variant="default" accessibilityLabel="Chip" />
    );

    expect(screen.getByText('Chip')).toBeDefined();

    rerender(
      <PremiumChip label="Chip" variant="outlined" accessibilityLabel="Chip" />
    );

    expect(screen.getByText('Chip')).toBeDefined();
  });

  it('disables interaction when disabled is true', async () => {
    const mockOnClose = vi.fn();

    render(
      <PremiumChip
        label="Chip"
        disabled={true}
        onClose={mockOnClose}
        accessibilityLabel="Chip"
      />
    );

    const chip = screen.getByText('Chip');
    import { fireEvent } from '@testing-library/react-native';
    fireEvent.press(chip);

    expect(mockOnClose).not.toHaveBeenCalled();
  });
});

