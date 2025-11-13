import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react-native';
import { AdoptScreen } from '@/screens/AdoptScreen';

describe('AdoptScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders adopt screen', () => {
    render(<AdoptScreen />);

    expect(screen).toBeDefined();
  });
});

