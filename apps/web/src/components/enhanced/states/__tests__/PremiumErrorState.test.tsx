import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PremiumErrorState } from '@/components/enhanced/states/PremiumErrorState';

vi.mock('@/hooks/use-ui-config', () => ({
  useUIConfig: vi.fn(() => ({})),
}));

vi.mock('@/hooks/use-animated-style-value', () => ({
  useAnimatedStyleValue: vi.fn((style) => style),
}));

vi.mock('@/utils/reduced-motion', () => ({
  usePrefersReducedMotion: vi.fn(() => false),
}));

vi.mock('@/lib/haptics', () => ({
  haptics: {
    impact: vi.fn(),
  },
}));

describe('PremiumErrorState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  it('renders error state with default title', () => {
    render(
      <PremiumErrorState />
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('renders custom title when provided', () => {
    render(
      <PremiumErrorState title="Custom Error" />
    );

    expect(screen.getByText('Custom Error')).toBeInTheDocument();
  });

  it('renders message when provided', () => {
    render(
      <PremiumErrorState message="An error occurred" />
    );

    expect(screen.getByText('An error occurred')).toBeInTheDocument();
  });

  it('renders error message from Error object', () => {
    const error = new Error('Test error');
    render(
      <PremiumErrorState error={error} />
    );

    expect(screen.getByText('Test error')).toBeInTheDocument();
  });

  it('renders error message from string', () => {
    render(
      <PremiumErrorState error="String error" />
    );

    expect(screen.getByText('String error')).toBeInTheDocument();
  });

  it('calls onRetry when retry button is clicked', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const mockOnRetry = vi.fn();

    render(
      <PremiumErrorState onRetry={mockOnRetry} />
    );

    const retryButton = screen.getByText('Try Again');
    await user.click(retryButton);

    vi.advanceTimersByTime(300);

    await waitFor(() => {
      expect(mockOnRetry).toHaveBeenCalledTimes(1);
    });
  });

  it('renders with different variants', () => {
    const { rerender } = render(
      <PremiumErrorState variant="default" />
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    rerender(
      <PremiumErrorState variant="minimal" />
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    rerender(
      <PremiumErrorState variant="detailed" />
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('shows error details when showDetails is true and variant is detailed', () => {
    const error = new Error('Test error');
    error.stack = 'Error stack trace';

    render(
      <PremiumErrorState
        error={error}
        showDetails={true}
        variant="detailed"
      />
    );

    expect(screen.getByText('Error Details')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <PremiumErrorState className="custom-error" />
    );

    const errorState = container.firstChild as HTMLElement;
    expect(errorState).toHaveClass('custom-error');
  });
});

