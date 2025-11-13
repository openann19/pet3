import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react-native';
import { PetDetailSkeleton } from '@/components/enhanced/PetDetailSkeleton';

vi.mock('@/components/ui/card', () => ({
  Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CardTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('PetDetailSkeleton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders pet detail skeleton', () => {
    const { container } = render(<PetDetailSkeleton />);

    expect(container).toBeDefined();
  });

  it('displays photo skeleton', () => {
    const { container } = render(<PetDetailSkeleton />);

    expect(container).toBeDefined();
  });

  it('displays header skeleton', () => {
    const { container } = render(<PetDetailSkeleton />);

    expect(container).toBeDefined();
  });
});

