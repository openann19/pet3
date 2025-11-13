import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UltraCard } from '@/components/enhanced/UltraCard';

vi.mock('@/hooks/use-ui-config', () => ({
  useUIConfig: vi.fn(() => ({})),
}));

vi.mock('@/hooks/use-animated-style-value', () => ({
  useAnimatedStyleValue: vi.fn((style) => style),
}));

vi.mock('@/effects/reanimated', () => ({
  useUltraCardReveal: vi.fn(() => ({
    animatedStyle: {},
  })),
  useMagneticHover: vi.fn(() => ({
    handleRef: { current: null },
    handleMouseEnter: vi.fn(),
    handleMouseLeave: vi.fn(),
    handleMouseMove: vi.fn(),
    animatedStyle: {},
  })),
  useHoverLift: vi.fn(() => ({
    handleEnter: vi.fn(),
    handleLeave: vi.fn(),
    animatedStyle: {},
  })),
  useParallaxTilt: vi.fn(() => ({
    handleMove: vi.fn(),
    animatedStyle: {},
  })),
  useGlowBorder: vi.fn(() => ({
    animatedStyle: {},
  })),
}));

describe('UltraCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders card with children', () => {
    render(
      <UltraCard>
        <div>Card Content</div>
      </UltraCard>
    );

    expect(screen.getByText('Card Content')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <UltraCard className="custom-card">
        <div>Content</div>
      </UltraCard>
    );

    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('custom-card');
  });

  it('renders with different index values', () => {
    const { rerender } = render(
      <UltraCard index={0}>
        <div>Content</div>
      </UltraCard>
    );

    expect(screen.getByText('Content')).toBeInTheDocument();

    rerender(
      <UltraCard index={1}>
        <div>Content</div>
      </UltraCard>
    );

    expect(screen.getByText('Content')).toBeInTheDocument();
  });
});

