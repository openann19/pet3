import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react-native';
import { AdoptionScreen } from '@/screens/AdoptionScreen';

vi.mock('@mobile/hooks/api/use-adoption', () => ({
  useAdoptionListings: vi.fn(() => ({
    data: { items: [] },
    isLoading: false,
    error: null,
  })),
}));

describe('AdoptionScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders adoption screen', () => {
    render(<AdoptionScreen />);

    expect(screen).toBeDefined();
  });
});
