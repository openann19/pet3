import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PremiumProgress } from '@/components/enhanced/navigation/PremiumProgress';

vi.mock('@/hooks/use-ui-config', () => ({
  useUIConfig: vi.fn(() => ({})),
}));

vi.mock('@/utils/reduced-motion', () => ({
  usePrefersReducedMotion: vi.fn(() => false),
}));

describe('PremiumProgress', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders progress bar', () => {
    render(
      <PremiumProgress value={50} aria-label="Progress" />
    );

    const progress = screen.getByRole('progressbar');
    expect(progress).toBeInTheDocument();
  });

  it('displays label when provided', () => {
    render(
      <PremiumProgress value={50} label="Loading" aria-label="Progress" />
    );

    expect(screen.getByText('Loading')).toBeInTheDocument();
  });

  it('shows value when showValue is true', () => {
    render(
      <PremiumProgress value={75} showValue={true} aria-label="Progress" />
    );

    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('renders with different variants', () => {
    const { rerender } = render(
      <PremiumProgress value={50} variant="default" aria-label="Progress" />
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();

    rerender(
      <PremiumProgress value={50} variant="gradient" aria-label="Progress" />
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();

    rerender(
      <PremiumProgress value={50} variant="striped" aria-label="Progress" />
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders with different sizes', () => {
    const { rerender } = render(
      <PremiumProgress value={50} size="sm" aria-label="Progress" />
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();

    rerender(
      <PremiumProgress value={50} size="md" aria-label="Progress" />
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();

    rerender(
      <PremiumProgress value={50} size="lg" aria-label="Progress" />
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <PremiumProgress value={50} className="custom-progress" aria-label="Progress" />
    );

    const progress = container.firstChild as HTMLElement;
    expect(progress).toHaveClass('custom-progress');
  });
});

