import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PremiumModal } from '@/components/enhanced/overlays/PremiumModal';

vi.mock('@/hooks/use-ui-config', () => ({
  useUIConfig: vi.fn(() => ({})),
}));

vi.mock('@/hooks/use-animated-style-value', () => ({
  useAnimatedStyleValue: vi.fn((style) => style),
}));

vi.mock('@/lib/haptics', () => ({
  haptics: {
    impact: vi.fn(),
  },
}));

describe('PremiumModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders modal when open is true', () => {
    render(
      <PremiumModal open={true} onOpenChange={vi.fn()}>
        <div>Modal Content</div>
      </PremiumModal>
    );

    expect(screen.getByText('Modal Content')).toBeInTheDocument();
  });

  it('does not render modal when open is false', () => {
    render(
      <PremiumModal open={false} onOpenChange={vi.fn()}>
        <div>Modal Content</div>
      </PremiumModal>
    );

    expect(screen.queryByText('Modal Content')).not.toBeInTheDocument();
  });

  it('displays title when provided', () => {
    render(
      <PremiumModal open={true} onOpenChange={vi.fn()} title="Test Modal">
        <div>Content</div>
      </PremiumModal>
    );

    expect(screen.getByText('Test Modal')).toBeInTheDocument();
  });

  it('displays description when provided', () => {
    render(
      <PremiumModal
        open={true}
        onOpenChange={vi.fn()}
        description="Test description"
      >
        <div>Content</div>
      </PremiumModal>
    );

    expect(screen.getByText('Test description')).toBeInTheDocument();
  });

  it('calls onOpenChange when close button is clicked', async () => {
    const user = userEvent.setup();
    const mockOnOpenChange = vi.fn();

    render(
      <PremiumModal
        open={true}
        onOpenChange={mockOnOpenChange}
        showCloseButton={true}
      >
        <div>Content</div>
      </PremiumModal>
    );

    const closeButton = screen.getByRole('button', { name: /close/i });
    await user.click(closeButton);

    await waitFor(() => {
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it('renders with different variants', () => {
    const { rerender } = render(
      <PremiumModal open={true} onOpenChange={vi.fn()} variant="default">
        <div>Content</div>
      </PremiumModal>
    );

    expect(screen.getByText('Content')).toBeInTheDocument();

    rerender(
      <PremiumModal open={true} onOpenChange={vi.fn()} variant="glass">
        <div>Content</div>
      </PremiumModal>
    );

    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('renders with different sizes', () => {
    const { rerender } = render(
      <PremiumModal open={true} onOpenChange={vi.fn()} size="sm">
        <div>Content</div>
      </PremiumModal>
    );

    expect(screen.getByText('Content')).toBeInTheDocument();

    rerender(
      <PremiumModal open={true} onOpenChange={vi.fn()} size="md">
        <div>Content</div>
      </PremiumModal>
    );

    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <PremiumModal
        open={true}
        onOpenChange={vi.fn()}
        className="custom-modal"
      >
        <div>Content</div>
      </PremiumModal>
    );

    const modal = container.querySelector('[role="dialog"]');
    expect(modal).toBeInTheDocument();
  });
});

