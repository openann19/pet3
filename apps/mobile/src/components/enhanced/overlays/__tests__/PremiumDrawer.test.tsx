import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react-native';
// Removed userEvent import; use fireEvent from @testing-library/react-native if needed
import { PremiumDrawer } from '@/components/enhanced/overlays/PremiumDrawer';

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

describe('PremiumDrawer', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders drawer when visible is true', () => {
    render(
      <PremiumDrawer visible={true} onClose={mockOnClose}>
        <div>Drawer Content</div>
      </PremiumDrawer>
    );

    expect(screen.getByText('Drawer Content')).toBeDefined();
  });

  it('does not render when visible is false', () => {
  const { getByTestId } = render(
      <PremiumDrawer visible={false} onClose={mockOnClose}>
        <div>Drawer Content</div>
      </PremiumDrawer>
    );

  expect(getByTestId('drawer-content')).toBeUndefined();
  });

  it('displays title when provided', () => {
    render(
      <PremiumDrawer visible={true} onClose={mockOnClose} title="Test Drawer">
        <div>Content</div>
      </PremiumDrawer>
    );

    expect(screen.getByText('Test Drawer')).toBeDefined();
  });

  it('calls onClose when close button is clicked', async () => {
  // Removed userEvent usage; use fireEvent if needed
    render(
      <PremiumDrawer visible={true} onClose={mockOnClose} showCloseButton={true}>
        <div>Content</div>
      </PremiumDrawer>
    );

  const closeButton = screen.getByRole('button', { name: /close/i });
  fireEvent.press(closeButton);

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  it('renders with different sides', () => {
    const { rerender } = render(
      <PremiumDrawer visible={true} onClose={mockOnClose} side="right">
        <div>Content</div>
      </PremiumDrawer>
    );

    expect(screen.getByText('Content')).toBeDefined();

    rerender(
      <PremiumDrawer visible={true} onClose={mockOnClose} side="left">
        <div>Content</div>
      </PremiumDrawer>
    );

    expect(screen.getByText('Content')).toBeDefined();
  });
});

