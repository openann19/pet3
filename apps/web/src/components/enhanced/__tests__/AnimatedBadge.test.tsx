import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AnimatedBadge } from '@/components/enhanced/AnimatedBadge';

vi.mock('@/hooks/use-ui-config', () => ({
  useUIConfig: vi.fn(() => ({})),
}));

vi.mock('@/hooks/use-animated-style-value', () => ({
  useAnimatedStyleValue: vi.fn((style) => style),
}));

describe('AnimatedBadge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders children when show is true', () => {
    render(
      <AnimatedBadge show={true}>
        <span>Badge Content</span>
      </AnimatedBadge>
    );
    
    expect(screen.getByText('Badge Content')).toBeInTheDocument();
  });

  it('renders children when show is undefined (default true)', () => {
    render(
      <AnimatedBadge>
        <span>Default Badge</span>
      </AnimatedBadge>
    );
    
    expect(screen.getByText('Default Badge')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <AnimatedBadge className="custom-badge">
        <span>Content</span>
      </AnimatedBadge>
    );
    
    const badge = container.firstChild as HTMLElement;
    expect(badge).toHaveClass('custom-badge');
  });

  it('handles show prop change', () => {
    const { rerender } = render(
      <AnimatedBadge show={true}>
        <span>Visible</span>
      </AnimatedBadge>
    );
    
    expect(screen.getByText('Visible')).toBeInTheDocument();
    
    rerender(
      <AnimatedBadge show={false}>
        <span>Hidden</span>
      </AnimatedBadge>
    );
    
    // Component should still render but with different animation state
    expect(screen.getByText('Hidden')).toBeInTheDocument();
  });
});

