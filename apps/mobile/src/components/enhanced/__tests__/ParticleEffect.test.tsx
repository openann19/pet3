import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react-native';
import { ParticleEffect } from '@/components/enhanced/ParticleEffect';

describe('ParticleEffect', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders particle effect', () => {
    const { container } = render(<ParticleEffect />);

    expect(container).toBeDefined();
  });

  it('renders with custom count', () => {
    const { container } = render(<ParticleEffect count={10} />);

    expect(container).toBeDefined();
  });
});

