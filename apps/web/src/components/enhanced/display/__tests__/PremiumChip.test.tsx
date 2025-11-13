import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PremiumChip } from '@/components/enhanced/display/PremiumChip';

vi.mock('@/hooks/use-ui-config', () => ({
  useUIConfig: vi.fn(() => ({})),
}));

vi.mock('@/hooks/use-animated-style-value', () => ({
  useAnimatedStyleValue: vi.fn((style) => style),
}));

vi.mock('@/lib/haptics', () => ({
  haptics: {
    impact: vi.fn(),
    selection: vi.fn(),
  },
}));

describe('PremiumChip', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  it('renders chip with label', () => {
    render(
      <PremiumChip label="Test Chip" aria-label="Test chip" />
    );

    expect(screen.getByText('Test Chip')).toBeInTheDocument();
  });

  it('renders with icon when provided', () => {
    render(
      <PremiumChip
        label="Test Chip"
        icon={<span data-testid="icon">Icon</span>}
        aria-label="Test chip"
      />
    );

    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const mockOnClose = vi.fn();

    render(
      <PremiumChip
        label="Test Chip"
        onClose={mockOnClose}
        aria-label="Test chip"
      />
    );

    const closeButton = screen.getByRole('button');
    await user.click(closeButton);

    vi.advanceTimersByTime(200);

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  it('renders with different variants', () => {
    const { rerender } = render(
      <PremiumChip label="Chip" variant="default" aria-label="Chip" />
    );

    expect(screen.getByText('Chip')).toBeInTheDocument();

    rerender(
      <PremiumChip label="Chip" variant="outlined" aria-label="Chip" />
    );

    expect(screen.getByText('Chip')).toBeInTheDocument();

    rerender(
      <PremiumChip label="Chip" variant="filled" aria-label="Chip" />
    );

    expect(screen.getByText('Chip')).toBeInTheDocument();
  });

  it('renders with different sizes', () => {
    const { rerender } = render(
      <PremiumChip label="Chip" size="sm" aria-label="Chip" />
    );

    expect(screen.getByText('Chip')).toBeInTheDocument();

    rerender(
      <PremiumChip label="Chip" size="md" aria-label="Chip" />
    );

    expect(screen.getByText('Chip')).toBeInTheDocument();

    rerender(
      <PremiumChip label="Chip" size="lg" aria-label="Chip" />
    );

    expect(screen.getByText('Chip')).toBeInTheDocument();
  });

  it('shows selected state when selected is true', () => {
    render(
      <PremiumChip label="Chip" selected={true} aria-label="Chip" />
    );

    const chip = screen.getByText('Chip').closest('div');
    expect(chip).toHaveClass('shadow-md');
  });

  it('disables interaction when disabled is true', async () => {
    const user = userEvent.setup();
    const mockOnClose = vi.fn();

    render(
      <PremiumChip
        label="Chip"
        disabled={true}
        onClose={mockOnClose}
        aria-label="Chip"
      />
    );

    const chip = screen.getByText('Chip').closest('div');
    await user.click(chip!);

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('applies custom className', () => {
    const { container } = render(
      <PremiumChip label="Chip" className="custom-chip" aria-label="Chip" />
    );

    const chip = container.querySelector('div');
    expect(chip).toHaveClass('custom-chip');
  });
});

