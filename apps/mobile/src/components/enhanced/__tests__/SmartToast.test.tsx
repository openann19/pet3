import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react-native';
import { SmartToast } from '@/components/enhanced/SmartToast';

vi.mock('expo-haptics', () => ({
  impactAsync: vi.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: {
    Light: 'light',
  },
}));

vi.mock('@/effects/core/use-reduced-motion-sv', () => ({
  useReducedMotionSV: vi.fn(() => ({ value: 0 })),
}));

describe('SmartToast', () => {
  const mockOnDismiss = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders toast with title', () => {
    render(
      <SmartToast
        id="toast1"
        type="success"
        title="Success!"
        onDismiss={mockOnDismiss}
      />
    );

    expect(screen.getByText('Success!')).toBeDefined();
  });

  it('renders description when provided', () => {
    render(
      <SmartToast
        id="toast1"
        type="info"
        title="Info"
        description="This is a description"
        onDismiss={mockOnDismiss}
      />
    );

    expect(screen.getByText('This is a description')).toBeDefined();
  });

  it('renders with different types', () => {
    const { getByText: getByText1 } = render(
      <SmartToast
        id="toast1"
        type="success"
        title="Success"
        onDismiss={mockOnDismiss}
      />
    );

    expect(getByText1('Success')).toBeDefined();

    const { getByText: getByText2 } = render(
      <SmartToast
        id="toast1"
        type="error"
        title="Error"
        onDismiss={mockOnDismiss}
      />
    );

    expect(getByText2('Error')).toBeDefined();
  });

  it('calls action onClick when action button is clicked', async () => {
  // Simulate timer advancement using vi.advanceTimersByTime directly
    const mockAction = vi.fn();

    render(
      <SmartToast
        id="toast1"
        type="info"
        title="Info"
        action={{ label: 'Action', onClick: mockAction }}
        onDismiss={mockOnDismiss}
      />
    );

  const actionButton = screen.getByText('Action');
  fireEvent.press(actionButton);

    await waitFor(() => {
      expect(mockAction).toHaveBeenCalledTimes(1);
    });
  });

  it('calls onDismiss when dismiss button is clicked', async () => {
  // Simulate timer advancement using vi.advanceTimersByTime directly
    render(
      <SmartToast
        id="toast1"
        type="success"
        title="Success"
        onDismiss={mockOnDismiss}
      />
    );

  const dismissButton = screen.getByRole('button', { name: /close|dismiss/i });
  fireEvent.press(dismissButton);

    await waitFor(() => {
      expect(mockOnDismiss).toHaveBeenCalledWith('toast1');
    });
  });

  it('renders at different positions', () => {
    const { getByText: getByText1 } = render(
      <SmartToast
        id="toast1"
        type="success"
        title="Top"
        position="top"
        onDismiss={mockOnDismiss}
      />
    );

    expect(getByText1('Top')).toBeDefined();

    const { getByText: getByText2 } = render(
      <SmartToast
        id="toast1"
        type="success"
        title="Bottom"
        position="bottom"
        onDismiss={mockOnDismiss}
      />
    );

    expect(getByText2('Bottom')).toBeDefined();
  });
});

