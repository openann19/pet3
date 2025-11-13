import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react-native';
import { EffectsPlaygroundScreen } from '@/screens/EffectsPlaygroundScreen';

describe('EffectsPlaygroundScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders effects playground screen', () => {
    render(<EffectsPlaygroundScreen />);

    expect(screen).toBeDefined();
  });
});
