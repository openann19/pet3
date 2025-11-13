import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ParticleEffect } from '@/components/enhanced/ParticleEffect';

vi.mock('@/hooks/use-animated-style-value', () => ({
  useAnimatedStyleValue: vi.fn((style) => style),
}));

describe('ParticleEffect', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders particle effect', () => {
    const { container } = render(<ParticleEffect />);

    const effect = container.firstChild as HTMLElement;
    expect(effect).toBeInTheDocument();
  });

  it('renders with custom count', () => {
    const { container } = render(<ParticleEffect count={10} />);

    const effect = container.firstChild as HTMLElement;
    expect(effect).toBeInTheDocument();
  });

  it('renders with custom colors', () => {
    const { container } = render(
      <ParticleEffect colors={['#ff0000', '#00ff00']} />
    );

    const effect = container.firstChild as HTMLElement;
    expect(effect).toBeInTheDocument();
  });

  it('triggers particles when triggerKey changes', () => {
    const { rerender } = render(<ParticleEffect triggerKey={1} />);

    const effect1 = screen.queryByTestId('particle-effect');
    expect(effect1).toBeInTheDocument();

    rerender(<ParticleEffect triggerKey={2} />);

    const effect2 = screen.queryByTestId('particle-effect');
    expect(effect2).toBeInTheDocument();
  });
});

