import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react-native';
import { TrustBadges, TrustScore } from '@/components/enhanced/TrustBadges';

describe('TrustBadges', () => {
  const mockBadges = [
    {
      type: 'verified' as const,
      label: 'Verified',
      description: 'This profile is verified',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders badges', () => {
    const { container } = render(<TrustBadges badges={mockBadges} />);

    expect(container).toBeDefined();
  });

  it('returns null when badges array is empty', () => {
    const { container } = render(<TrustBadges badges={[]} />);

    expect(container.children.length).toBe(0);
  });
});

describe('TrustScore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders trust score', () => {
    const { getByText } = render(<TrustScore score={85} />);

    expect(getByText('85')).toBeDefined();
  });

  it('renders with label when showLabel is true', () => {
    const { getByText } = render(<TrustScore score={85} showLabel={true} />);

    expect(getByText(/Highly Trusted|Trusted/i)).toBeDefined();
  });
});

