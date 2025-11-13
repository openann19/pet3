import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PremiumToggle } from '@/components/enhanced/forms/PremiumToggle';

vi.mock('@/hooks/use-ui-config', () => ({
  useUIConfig: vi.fn(() => ({})),
}));

vi.mock('@/lib/haptics', () => ({
  haptics: {
    impact: vi.fn(),
  },
}));

describe('PremiumToggle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders toggle', () => {
    render(
      <PremiumToggle aria-label="Test toggle" />
    );

    const toggle = screen.getByRole('switch');
    expect(toggle).toBeInTheDocument();
  });

  it('calls onCheckedChange when clicked', async () => {
    const user = userEvent.setup();
    const mockOnCheckedChange = vi.fn();

    render(
      <PremiumToggle
        checked={false}
        onCheckedChange={mockOnCheckedChange}
        aria-label="Test toggle"
      />
    );

    const toggle = screen.getByRole('switch');
    await user.click(toggle);

    await waitFor(() => {
      expect(mockOnCheckedChange).toHaveBeenCalledWith(true);
    });
  });

  it('toggles from checked to unchecked', async () => {
    const user = userEvent.setup();
    const mockOnCheckedChange = vi.fn();

    render(
      <PremiumToggle
        checked={true}
        onCheckedChange={mockOnCheckedChange}
        aria-label="Test toggle"
      />
    );

    const toggle = screen.getByRole('switch');
    await user.click(toggle);

    await waitFor(() => {
      expect(mockOnCheckedChange).toHaveBeenCalledWith(false);
    });
  });

  it('displays label when provided', () => {
    render(
      <PremiumToggle label="Enable Feature" aria-label="Toggle" />
    );

    expect(screen.getByText('Enable Feature')).toBeInTheDocument();
  });

  it('disables toggle when disabled is true', () => {
    render(
      <PremiumToggle disabled={true} aria-label="Toggle" />
    );

    const toggle = screen.getByRole('switch');
    expect(toggle).toBeDisabled();
  });

  it('does not call onCheckedChange when disabled', async () => {
    const user = userEvent.setup();
    const mockOnCheckedChange = vi.fn();

    render(
      <PremiumToggle
        disabled={true}
        onCheckedChange={mockOnCheckedChange}
        aria-label="Toggle"
      />
    );

    const toggle = screen.getByRole('switch');
    await user.click(toggle);

    expect(mockOnCheckedChange).not.toHaveBeenCalled();
  });

  it('renders with different sizes', () => {
    const { rerender } = render(
      <PremiumToggle size="sm" aria-label="Toggle" />
    );

    expect(screen.getByRole('switch')).toBeInTheDocument();

    rerender(
      <PremiumToggle size="md" aria-label="Toggle" />
    );

    expect(screen.getByRole('switch')).toBeInTheDocument();

    rerender(
      <PremiumToggle size="lg" aria-label="Toggle" />
    );

    expect(screen.getByRole('switch')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <PremiumToggle className="custom-toggle" aria-label="Toggle" />
    );

    const toggle = container.firstChild as HTMLElement;
    expect(toggle).toHaveClass('custom-toggle');
  });
});

