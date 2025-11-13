import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react-native';
// Removed userEvent import; use fireEvent from @testing-library/react-native if needed
import { PremiumModal } from '@/components/enhanced/overlays/PremiumModal';

vi.mock('expo-haptics', () => ({
  impactAsync: vi.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: {
    Light: 'light',
  },
}));

vi.mock('@/effects/core/use-reduced-motion-sv', () => ({
  useReducedMotionSV: vi.fn(() => ({ value: 0 })),
}));

vi.mock('expo-blur', () => ({
  BlurView: ({ children }: { children: React.ReactNode }) => children,
}));

describe('PremiumModal', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders modal when visible is true', () => {
    render(
      <PremiumModal visible={true} onClose={mockOnClose}>
        <div>Modal Content</div>
      </PremiumModal>
    );

    expect(screen.getByText('Modal Content')).toBeDefined();
  });

  it('does not render when visible is false', () => {
  const { getByTestId } = render(
      <PremiumModal visible={false} onClose={mockOnClose}>
        <div>Modal Content</div>
      </PremiumModal>
    );

  expect(getByTestId('modal-content')).toBeUndefined();
  });

  it('displays title when provided', () => {
    render(
      <PremiumModal visible={true} onClose={mockOnClose} title="Test Modal">
        <div>Content</div>
      </PremiumModal>
    );

    expect(screen.getByText('Test Modal')).toBeDefined();
  });

  it('calls onClose when close button is clicked', async () => {
  // Removed userEvent usage; use fireEvent if needed
    render(
      <PremiumModal visible={true} onClose={mockOnClose} showCloseButton={true}>
        <div>Content</div>
      </PremiumModal>
    );

  const closeButton = screen.getByRole('button', { name: /close/i });
  fireEvent.press(closeButton);

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  it('renders with different sizes', () => {
    const { rerender } = render(
      <PremiumModal visible={true} onClose={mockOnClose} size="sm">
        <div>Content</div>
      </PremiumModal>
    );

    expect(screen.getByText('Content')).toBeDefined();

    rerender(
      <PremiumModal visible={true} onClose={mockOnClose} size="md">
        <div>Content</div>
      </PremiumModal>
    );

    expect(screen.getByText('Content')).toBeDefined();
  });
});

