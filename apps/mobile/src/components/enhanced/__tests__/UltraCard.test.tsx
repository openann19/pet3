import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react-native';
import { UltraCard } from '@/components/enhanced/UltraCard';

vi.mock('@mobile/effects/reanimated', () => ({
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
    const { getByText } = render(
      <UltraCard>
        <div>Card Content</div>
      </UltraCard>
    );

    expect(getByText('Card Content')).toBeDefined();
  });
});

