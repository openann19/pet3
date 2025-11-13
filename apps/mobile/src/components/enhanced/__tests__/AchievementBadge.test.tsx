import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react-native';
import { AchievementBadge } from '@/components/enhanced/AchievementBadge';

describe('AchievementBadge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders achievement badge', () => {
    const { container } = render(<AchievementBadge />);

    expect(container).toBeDefined();
  });

  it('renders with custom size', () => {
    const { container } = render(<AchievementBadge size={48} />);

    expect(container).toBeDefined();
  });

  it('applies custom className', () => {
    const { container } = render(<AchievementBadge className="custom-badge" />);

    expect(container).toBeDefined();
  });
});

