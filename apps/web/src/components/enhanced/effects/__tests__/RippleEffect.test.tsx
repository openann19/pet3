import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RippleEffect } from '@/components/enhanced/effects/RippleEffect';

vi.mock('@/hooks/use-ui-config', () => ({
  useUIConfig: vi.fn(() => ({})),
}));

vi.mock('@/hooks/use-animated-style-value', () => ({
  useAnimatedStyleValue: vi.fn((style) => style),
}));

vi.mock('@/effects/reanimated/use-ripple-effect', () => ({
  useRippleEffect: vi.fn(() => ({
    animatedStyle: {},
    ripples: [],
    addRipple: vi.fn(),
  })),
}));

describe('RippleEffect', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders children', () => {
    render(
      <RippleEffect>
        <div>Test Content</div>
      </RippleEffect>
    );

    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup();
    const mockOnClick = vi.fn();

    render(
      <RippleEffect onClick={mockOnClick}>
        <div>Clickable</div>
      </RippleEffect>
    );

    const content = screen.getByText('Clickable');
    await user.click(content);

    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick when disabled', async () => {
    const user = userEvent.setup();
    const mockOnClick = vi.fn();

    render(
      <RippleEffect disabled={true} onClick={mockOnClick}>
        <div>Disabled</div>
      </RippleEffect>
    );

    const content = screen.getByText('Disabled');
    await user.click(content);

    expect(mockOnClick).not.toHaveBeenCalled();
  });

  it('applies custom className', () => {
    const { container } = render(
      <RippleEffect className="custom-ripple">
        <div>Content</div>
      </RippleEffect>
    );

    const ripple = container.firstChild as HTMLElement;
    expect(ripple).toHaveClass('custom-ripple');
  });
});

