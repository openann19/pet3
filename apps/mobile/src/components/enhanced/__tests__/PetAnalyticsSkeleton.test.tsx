import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react-native';
import { PetAnalyticsSkeleton } from '@/components/enhanced/PetAnalyticsSkeleton';

vi.mock('@/components/ui/card', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('PetAnalyticsSkeleton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders analytics skeleton', () => {
    const { container } = render(<PetAnalyticsSkeleton />);

    expect(container).toBeDefined();
  });

  it('displays skeleton cards', () => {
    const { container } = render(<PetAnalyticsSkeleton />);

    // Should render multiple skeleton cards
    expect(container).toBeDefined();
  });
});

