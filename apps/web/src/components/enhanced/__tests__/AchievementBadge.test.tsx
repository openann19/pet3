import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AchievementBadge } from '@/components/enhanced/AchievementBadge';

vi.mock('@/hooks/use-ui-config', () => ({
  useUIConfig: vi.fn(() => ({})),
}));

vi.mock('@/hooks/use-animated-style-value', () => ({
  useAnimatedStyleValue: vi.fn((style) => style),
}));

describe('AchievementBadge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with default props', () => {
    const { container } = render(<AchievementBadge />);
    const badge = container.firstChild as HTMLElement;
    
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveStyle({ width: '32px', height: '32px' });
  });

  it('renders with custom size', () => {
    const { container } = render(<AchievementBadge size={48} />);
    const badge = container.firstChild as HTMLElement;
    
    expect(badge).toHaveStyle({ width: '48px', height: '48px' });
  });

  it('renders with custom color', () => {
    const { container } = render(<AchievementBadge color="#ff0000" />);
    const badge = container.firstChild as HTMLElement;
    
    expect(badge).toHaveStyle({ backgroundColor: '#ff0000' });
  });

  it('applies custom className', () => {
    const { container } = render(<AchievementBadge className="custom-class" />);
    const badge = container.firstChild as HTMLElement;
    
    expect(badge).toHaveClass('custom-class');
  });

  it('has circular shape', () => {
    const { container } = render(<AchievementBadge size={40} />);
    const badge = container.firstChild as HTMLElement;
    
    expect(badge).toHaveStyle({ borderRadius: '20px' });
  });
});

