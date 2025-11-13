import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react-native';
import { CommunityScreen } from '@/screens/CommunityScreen';

vi.mock('@mobile/hooks/api/use-community', () => ({
  useCommunityPosts: vi.fn(() => ({
    data: { items: [] },
    isLoading: false,
    error: null,
  })),
}));

describe('CommunityScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders community screen', () => {
    render(<CommunityScreen />);

    expect(screen).toBeDefined();
  });
});
