import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UltraButton } from '@/components/enhanced/UltraButton';

vi.mock('@/hooks/use-ui-config', () => ({
  useUIConfig: vi.fn(() => ({})),
}));

vi.mock('@/utils/reduced-motion', () => ({
  usePrefersReducedMotion: vi.fn(() => false),
}));

vi.mock('@/effects/reanimated/use-magnetic-effect', () => ({
  useMagneticEffect: vi.fn(() => ({
    handleRef: { current: null },
    handleMouseEnter: vi.fn(),
    handleMouseLeave: vi.fn(),
    handleMouseMove: vi.fn(),
    animatedStyle: {},
  })),
}));

vi.mock('@/effects/reanimated/use-shimmer', () => ({
  useShimmer: vi.fn(() => ({
    animatedStyle: {},
  })),
}));

describe('UltraButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders button with children', () => {
    render(
      <UltraButton>Click Me</UltraButton>
    );

    expect(screen.getByText('Click Me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup();
    const mockOnClick = vi.fn();

    render(
      <UltraButton onClick={mockOnClick}>
        Click Me
      </UltraButton>
    );

    const button = screen.getByText('Click Me');
    await user.click(button);

    await waitFor(() => {
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });
  });

  it('disables button when disabled is true', () => {
    render(
      <UltraButton disabled={true}>
        Disabled
      </UltraButton>
    );

    const button = screen.getByText('Disabled').closest('button');
    expect(button).toBeDisabled();
  });

  it('renders with different variants', () => {
    const { rerender } = render(
      <UltraButton variant="default">Button</UltraButton>
    );

    expect(screen.getByText('Button')).toBeInTheDocument();

    rerender(
      <UltraButton variant="destructive">Button</UltraButton>
    );

    expect(screen.getByText('Button')).toBeInTheDocument();

    rerender(
      <UltraButton variant="outline">Button</UltraButton>
    );

    expect(screen.getByText('Button')).toBeInTheDocument();
  });

  it('renders with different sizes', () => {
    const { rerender } = render(
      <UltraButton size="sm">Button</UltraButton>
    );

    expect(screen.getByText('Button')).toBeInTheDocument();

    rerender(
      <UltraButton size="default">Button</UltraButton>
    );

    expect(screen.getByText('Button')).toBeInTheDocument();

    rerender(
      <UltraButton size="lg">Button</UltraButton>
    );

    expect(screen.getByText('Button')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <UltraButton className="custom-button">
        Button
      </UltraButton>
    );

    const button = container.querySelector('button');
    expect(button).toHaveClass('custom-button');
  });
});

