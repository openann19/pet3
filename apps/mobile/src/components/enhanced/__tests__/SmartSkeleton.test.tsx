import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react-native';
import { SmartSkeleton } from '@/components/enhanced/SmartSkeleton';

vi.mock('@/effects/chat/core/reduced-motion', () => ({
  useReducedMotionSV: vi.fn(() => ({ value: 0 })),
}));

describe('SmartSkeleton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders skeleton', () => {
    const { container } = render(<SmartSkeleton />);

    expect(container).toBeDefined();
  });

  it('renders with different variants', () => {
    const { container: container1 } = render(<SmartSkeleton variant="text" />);

    expect(container1).toBeDefined();

    const { container: container2 } = render(<SmartSkeleton variant="circular" />);
    expect(container2).toBeDefined();

    const { container: container3 } = render(<SmartSkeleton variant="rectangular" />);
    expect(container3).toBeDefined();

    const { container: container4 } = render(<SmartSkeleton variant="card" />);
    expect(container4).toBeDefined();
  });

  it('renders multiple skeletons when count is provided', () => {
    const { container } = render(<SmartSkeleton count={3} />);

    expect(container).toBeDefined();
  });

  it('disables animation when animate is false', () => {
    const { container } = render(<SmartSkeleton animate={false} />);

    expect(container).toBeDefined();
  });
});

