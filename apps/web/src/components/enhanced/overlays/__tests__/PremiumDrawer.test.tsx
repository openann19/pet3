import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PremiumDrawer } from '@/components/enhanced/overlays/PremiumDrawer';

vi.mock('@/hooks/use-ui-config', () => ({
  useUIConfig: vi.fn(() => ({})),
}));

vi.mock('@/hooks/use-animated-style-value', () => ({
  useAnimatedStyleValue: vi.fn((style) => style),
}));

describe('PremiumDrawer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders drawer when open is true', () => {
    render(
      <PremiumDrawer open={true} onOpenChange={vi.fn()}>
        <div>Drawer Content</div>
      </PremiumDrawer>
    );

    expect(screen.getByText('Drawer Content')).toBeInTheDocument();
  });

  it('does not render drawer when open is false', () => {
    render(
      <PremiumDrawer open={false} onOpenChange={vi.fn()}>
        <div>Drawer Content</div>
      </PremiumDrawer>
    );

    expect(screen.queryByText('Drawer Content')).not.toBeInTheDocument();
  });

  it('displays title when provided', () => {
    render(
      <PremiumDrawer open={true} onOpenChange={vi.fn()} title="Test Drawer">
        <div>Content</div>
      </PremiumDrawer>
    );

    expect(screen.getByText('Test Drawer')).toBeInTheDocument();
  });

  it('displays description when provided', () => {
    render(
      <PremiumDrawer
        open={true}
        onOpenChange={vi.fn()}
        description="Test description"
      >
        <div>Content</div>
      </PremiumDrawer>
    );

    expect(screen.getByText('Test description')).toBeInTheDocument();
  });

  it('calls onOpenChange when close button is clicked', async () => {
    const user = userEvent.setup();
    const mockOnOpenChange = vi.fn();

    render(
      <PremiumDrawer
        open={true}
        onOpenChange={mockOnOpenChange}
        showCloseButton={true}
      >
        <div>Content</div>
      </PremiumDrawer>
    );

    const closeButton = screen.getByRole('button', { name: /close/i });
    await user.click(closeButton);

    await waitFor(() => {
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });

  it('renders with different sides', () => {
    const { rerender } = render(
      <PremiumDrawer open={true} onOpenChange={vi.fn()} side="right">
        <div>Content</div>
      </PremiumDrawer>
    );

    expect(screen.getByText('Content')).toBeInTheDocument();

    rerender(
      <PremiumDrawer open={true} onOpenChange={vi.fn()} side="left">
        <div>Content</div>
      </PremiumDrawer>
    );

    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('renders with different sizes', () => {
    const { rerender } = render(
      <PremiumDrawer open={true} onOpenChange={vi.fn()} size="sm">
        <div>Content</div>
      </PremiumDrawer>
    );

    expect(screen.getByText('Content')).toBeInTheDocument();

    rerender(
      <PremiumDrawer open={true} onOpenChange={vi.fn()} size="md">
        <div>Content</div>
      </PremiumDrawer>
    );

    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <PremiumDrawer
        open={true}
        onOpenChange={vi.fn()}
        className="custom-drawer"
      >
        <div>Content</div>
      </PremiumDrawer>
    );

    const drawer = container.querySelector('[role="dialog"]');
    expect(drawer).toBeInTheDocument();
  });
});

