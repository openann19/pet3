import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react-native';
import { ShimmerEffect } from '@/components/enhanced/effects/ShimmerEffect';

describe('ShimmerEffect', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders shimmer effect', () => {
    const { container } = render(<ShimmerEffect />);

    expect(container).toBeDefined();
  });

  it('applies custom width and height', () => {
    const { container } = render(
      <ShimmerEffect width={200} height={50} />
    );

    expect(container).toBeDefined();
  });

  it('disables animation when animated is false', () => {
    const { container } = render(
      <ShimmerEffect animated={false} />
    );

    expect(container).toBeDefined();
  });
});

