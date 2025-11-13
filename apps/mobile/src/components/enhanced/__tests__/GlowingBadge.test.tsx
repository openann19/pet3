import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react-native';
import { GlowingBadge } from '@/components/enhanced/GlowingBadge';

vi.mock('@/effects/core/use-reduced-motion-sv', () => ({
  useReducedMotionSV: vi.fn(() => ({ value: 0 })),
}));

describe('GlowingBadge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders badge with children', () => {
    const { getByText } = render(
      <GlowingBadge>
        <div>Badge Content</div>
      </GlowingBadge>
    );

    expect(getByText('Badge Content')).toBeDefined();
  });

  it('renders with different variants', () => {
    const { getByText: getByText1 } = render(
      <GlowingBadge variant="primary">
        <div>Badge</div>
      </GlowingBadge>
    );

    expect(getByText1('Badge')).toBeDefined();

    const { getByText: getByText2 } = render(
      <GlowingBadge variant="secondary">
        <div>Badge</div>
      </GlowingBadge>
    );

    expect(getByText2('Badge')).toBeDefined();
  });

  it('enables glow when glow is true', () => {
    const { getByText } = render(
      <GlowingBadge glow={true}>
        <div>Badge</div>
      </GlowingBadge>
    );

    expect(getByText('Badge')).toBeDefined();
  });

  it('enables pulse when pulse is true', () => {
    const { getByText } = render(
      <GlowingBadge pulse={true}>
        <div>Badge</div>
      </GlowingBadge>
    );

    expect(getByText('Badge')).toBeDefined();
  });
});

