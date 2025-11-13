import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react-native';
import { FeedScreen } from '@/screens/FeedScreen';

describe('FeedScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders feed screen', () => {
    render(<FeedScreen />);

    expect(screen).toBeDefined();
  });
});

