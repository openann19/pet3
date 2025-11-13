import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react-native';
import { RippleEffect } from '@/components/enhanced/effects/RippleEffect';

vi.mock('@mobile/effects/reanimated/use-ripple-effect', () => ({
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
    const { getByText } = render(
      <RippleEffect>
        <div>Test Content</div>
      </RippleEffect>
    );

    expect(getByText('Test Content')).toBeDefined();
  });
});

