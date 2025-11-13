import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react-native';
import { PremiumButton } from '@/components/enhanced/PremiumButton';

vi.mock('expo-haptics', () => ({
  impactAsync: vi.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: {
    Light: 'light',
  },
}));

vi.mock('@petspark/motion', () => ({
  usePressBounce: vi.fn(() => ({
    animatedStyle: {},
    onPressIn: vi.fn(),
    onPressOut: vi.fn(),
  })),
}));

describe('PremiumButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders button with children', () => {
    render(
      <PremiumButton>
        Click Me
      </PremiumButton>
    );

    expect(screen.getByText('Click Me')).toBeDefined();
  });

  it('calls onPress when clicked', async () => {
    const mockOnPress = vi.fn();

    render(
      <PremiumButton onPress={mockOnPress}>
        Click Me
      </PremiumButton>
    );

    const button = screen.getByText('Click Me');
    // Simulate press using fireEvent
    button.props.onPress();

    await waitFor(() => {
      expect(mockOnPress).toHaveBeenCalledTimes(1);
    });
  });

  it('shows loading state', () => {
    render(
      <PremiumButton loading={true}>
        Loading
      </PremiumButton>
    );

    expect(screen.getByText('Loading')).toBeDefined();
  });

  it('disables button when disabled is true', () => {
    render(
      <PremiumButton disabled={true}>
        Disabled
      </PremiumButton>
    );

    const button = screen.getByText('Disabled');
    expect(button).toBeDisabled();
  });

  it('renders with different variants', () => {
    const { getByText: getByText1 } = render(
      <PremiumButton variant="primary">
        Button
      </PremiumButton>
    );

    expect(getByText1('Button')).toBeDefined();

    const { getByText: getByText2 } = render(
      <PremiumButton variant="secondary">
        Button
      </PremiumButton>
    );

    expect(getByText2('Button')).toBeDefined();
  });

  it('renders with icon', () => {
    render(
      <PremiumButton icon={<span data-testid="icon">Icon</span>}>
        Button
      </PremiumButton>
    );

    expect(screen.getByTestId('icon')).toBeDefined();
  });
});

