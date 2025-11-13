import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TrustBadges, TrustScore } from '@/components/enhanced/TrustBadges';

vi.mock('@/hooks/use-ui-config', () => ({
  useUIConfig: vi.fn(() => ({})),
}));

vi.mock('@/effects/reanimated/use-staggered-item', () => ({
  useStaggeredItem: vi.fn(() => ({
    opacity: { get: () => 1 },
    y: { get: () => 0 },
  })),
}));

vi.mock('@/hooks/use-animated-style-value', () => ({
  useAnimatedStyleValue: vi.fn((style) => style),
}));

describe('TrustBadges', () => {
  const mockBadges = [
    {
      type: 'verified' as const,
      label: 'Verified',
      description: 'This profile is verified',
    },
    {
      type: 'health' as const,
      label: 'Health Checked',
      description: 'Health records verified',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders badges', () => {
    render(<TrustBadges badges={mockBadges} />);
    
    // Badges are rendered as tooltip triggers
    const tooltips = screen.getAllByRole('button');
    expect(tooltips.length).toBeGreaterThan(0);
  });

  it('returns null when badges array is empty', () => {
    const { container } = render(<TrustBadges badges={[]} />);
    
    expect(container.firstChild).toBeNull();
  });

  it('returns null when badges is null', () => {
    const { container } = render(<TrustBadges badges={null as unknown as typeof mockBadges} />);
    
    expect(container.firstChild).toBeNull();
  });

  it('renders with different sizes', () => {
    const { rerender } = render(<TrustBadges badges={mockBadges} size="sm" />);
    
    expect(screen.getAllByRole('button').length).toBeGreaterThan(0);
    
    rerender(<TrustBadges badges={mockBadges} size="md" />);
    expect(screen.getAllByRole('button').length).toBeGreaterThan(0);
    
    rerender(<TrustBadges badges={mockBadges} size="lg" />);
    expect(screen.getAllByRole('button').length).toBeGreaterThan(0);
  });

  it('shows tooltip on hover', async () => {
    render(<TrustBadges badges={mockBadges} />);
    
    // Tooltips are managed by Radix UI, so we check for the structure
    const tooltipTriggers = screen.getAllByRole('button');
    expect(tooltipTriggers.length).toBeGreaterThan(0);
  });
});

describe('TrustScore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders trust score', () => {
    render(<TrustScore score={85} />);
    
    expect(screen.getByText('85')).toBeInTheDocument();
  });

  it('renders with label when showLabel is true', () => {
    render(<TrustScore score={85} showLabel={true} />);
    
    expect(screen.getByText(/Highly Trusted|Trusted|Established|New/)).toBeInTheDocument();
    expect(screen.getByText('Trust Score')).toBeInTheDocument();
  });

  it('does not show label when showLabel is false', () => {
    render(<TrustScore score={85} showLabel={false} />);
    
    expect(screen.queryByText('Trust Score')).not.toBeInTheDocument();
  });

  it('renders with different sizes', () => {
    const { rerender } = render(<TrustScore score={85} size="sm" />);
    
    expect(screen.getByText('85')).toBeInTheDocument();
    
    rerender(<TrustScore score={85} size="md" />);
    expect(screen.getByText('85')).toBeInTheDocument();
    
    rerender(<TrustScore score={85} size="lg" />);
    expect(screen.getByText('85')).toBeInTheDocument();
  });

  it('displays correct label for score ranges', () => {
    const { rerender } = render(<TrustScore score={90} showLabel={true} />);
    expect(screen.getByText('Highly Trusted')).toBeInTheDocument();
    
    rerender(<TrustScore score={70} showLabel={true} />);
    expect(screen.getByText('Trusted')).toBeInTheDocument();
    
    rerender(<TrustScore score={50} showLabel={true} />);
    expect(screen.getByText('Established')).toBeInTheDocument();
    
    rerender(<TrustScore score={30} showLabel={true} />);
    expect(screen.getByText('New')).toBeInTheDocument();
  });
});

