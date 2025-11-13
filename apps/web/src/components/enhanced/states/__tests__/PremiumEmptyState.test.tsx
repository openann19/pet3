import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PremiumEmptyState } from '@/components/enhanced/states/PremiumEmptyState';

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

describe('PremiumEmptyState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders empty state with title', () => {
    render(
      <PremiumEmptyState title="No items found" />
    );

    expect(screen.getByText('No items found')).toBeInTheDocument();
  });

  it('renders description when provided', () => {
    render(
      <PremiumEmptyState
        title="No items"
        description="Try adding some items"
      />
    );

    expect(screen.getByText('Try adding some items')).toBeInTheDocument();
  });

  it('renders icon when provided', () => {
    render(
      <PremiumEmptyState
        title="No items"
        icon={<span data-testid="icon">Icon</span>}
      />
    );

    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('calls action onClick when action button is clicked', async () => {
    const user = userEvent.setup();
    const mockOnClick = vi.fn();

    render(
      <PremiumEmptyState
        title="No items"
        action={{
          label: 'Add Item',
          onClick: mockOnClick,
        }}
      />
    );

    const button = screen.getByText('Add Item');
    await user.click(button);

    await waitFor(() => {
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });
  });

  it('renders with different variants', () => {
    const { rerender } = render(
      <PremiumEmptyState title="Empty" variant="default" />
    );

    expect(screen.getByText('Empty')).toBeInTheDocument();

    rerender(
      <PremiumEmptyState title="Empty" variant="minimal" />
    );

    expect(screen.getByText('Empty')).toBeInTheDocument();

    rerender(
      <PremiumEmptyState title="Empty" variant="illustrated" />
    );

    expect(screen.getByText('Empty')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <PremiumEmptyState title="Empty" className="custom-empty" />
    );

    const emptyState = container.firstChild as HTMLElement;
    expect(emptyState).toHaveClass('custom-empty');
  });
});

