import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { EnhancedButton } from '@/components/enhanced/EnhancedButton';

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
  useReducedMotionSV: vi.fn(() => ({ value: 0 })),
}));

describe('EnhancedButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders button with children', () => {
    render(
      <EnhancedButton>
        Click Me
      </EnhancedButton>
    );

    expect(screen.getByText('Click Me')).toBeDefined();
  });

  it('calls onPress when pressed', async () => {
    const mockOnPress = vi.fn();

    const { getByText } = render(
      <EnhancedButton {...({ onPress: mockOnPress } as Record<string, unknown>)}>
        Click Me
      </EnhancedButton>
    );

    const button = getByText('Click Me');
    fireEvent.press(button);

    await waitFor(() => {
      expect(mockOnPress).toHaveBeenCalledTimes(1);
    });
  });

  it('shows loading state', () => {
    render(
      <EnhancedButton {...({ loading: true } as Record<string, unknown>)}>
        Loading
      </EnhancedButton>
    );

    expect(screen.getByText('Loading')).toBeDefined();
  });

  it('disables button when disabled is true', () => {
    const mockOnPress = vi.fn();
    render(
      <EnhancedButton {...({ disabled: true, onPress: mockOnPress } as Record<string, unknown>)}>
        Disabled
      </EnhancedButton>
    );

    const button = screen.getByText('Disabled');
    fireEvent.press(button);

    expect(mockOnPress).not.toHaveBeenCalled();
  });

  it('renders with different variants', () => {
    const { getByText: getByText1 } = render(
      <EnhancedButton {...({ variant: 'default' } as Record<string, unknown>)}>
        Button
      </EnhancedButton>
    );

    expect(getByText1('Button')).toBeDefined();

    const { getByText: getByText2 } = render(
      <EnhancedButton {...({ variant: 'destructive' } as Record<string, unknown>)}>
        Button
      </EnhancedButton>
    );

    expect(getByText2('Button')).toBeDefined();
  });
});

