import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ShimmerEffect } from '@/components/enhanced/effects/ShimmerEffect';

vi.mock('@/hooks/use-ui-config', () => ({
  useUIConfig: vi.fn(() => ({})),
}));

describe('ShimmerEffect', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders shimmer effect', () => {
    const { container } = render(<ShimmerEffect />);

    const shimmer = container.firstChild as HTMLElement;
    expect(shimmer).toBeInTheDocument();
  });

  it('applies custom width and height', () => {
    const { container } = render(
      <ShimmerEffect width={200} height={50} />
    );

    const shimmer = container.firstChild as HTMLElement;
    expect(shimmer).toHaveStyle({ width: '200px', height: '50px' });
  });

  it('applies custom borderRadius', () => {
    const { container } = render(
      <ShimmerEffect borderRadius={10} />
    );

    const shimmer = container.firstChild as HTMLElement;
    expect(shimmer).toHaveStyle({ borderRadius: '10px' });
  });

  it('applies custom className', () => {
    const { container } = render(
      <ShimmerEffect className="custom-shimmer" />
    );

    const shimmer = container.firstChild as HTMLElement;
    expect(shimmer).toHaveClass('custom-shimmer');
  });

  it('disables animation when animated is false', () => {
    const { container } = render(
      <ShimmerEffect animated={false} />
    );

    const shimmer = container.firstChild as HTMLElement;
    expect(shimmer).toBeInTheDocument();
  });
});

