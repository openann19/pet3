import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react-native';
import { PremiumCard } from '@/components/enhanced/PremiumCard';

vi.mock('@mobile/effects/reanimated', () => ({
  useHoverLift: vi.fn(() => ({
    animatedStyle: {},
    handlePressIn: vi.fn(),
    handlePressOut: vi.fn(),
  })),
  useGlowPulse: vi.fn(() => ({
    animatedStyle: {},
  })),
}));

describe('PremiumCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders premium card with children', () => {
    const { getByText } = render(
      <PremiumCard>
        <div>Card Content</div>
      </PremiumCard>
    );

    expect(getByText('Card Content')).toBeDefined();
  });

  it('renders with different variants', () => {
    const { getByText: getByText1 } = render(
      <PremiumCard variant="default">
        <div>Content</div>
      </PremiumCard>
    );

    expect(getByText1('Content')).toBeDefined();

    const { getByText: getByText2 } = render(
      <PremiumCard variant="glass">
        <div>Content</div>
      </PremiumCard>
    );

    expect(getByText2('Content')).toBeDefined();
  });

  it('applies custom style', () => {
    const { container } = render(
      <PremiumCard style={{ padding: 20 }}>
        <div>Content</div>
      </PremiumCard>
    );

    expect(container).toBeDefined();
  });
});

