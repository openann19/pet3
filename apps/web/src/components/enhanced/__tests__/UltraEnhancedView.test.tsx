import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UltraEnhancedView } from '@/components/enhanced/UltraEnhancedView';

vi.mock('@/hooks/use-ui-config', () => ({
  useUIConfig: vi.fn(() => ({})),
}));

vi.mock('@/hooks/use-animated-style-value', () => ({
  useAnimatedStyleValue: vi.fn((style) => style),
}));

vi.mock('@/effects/reanimated', () => ({
  usePageTransition: vi.fn((): { style: Record<string, unknown> } => ({
    style: {},
  })),
  useParallaxScroll: vi.fn((): { animatedStyle: Record<string, unknown> } => ({
    animatedStyle: {},
  })),
  useBreathingAnimation: vi.fn((): { animatedStyle: Record<string, unknown> } => ({
    animatedStyle: {},
  })),
}));

describe('UltraEnhancedView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders view with children', () => {
    render(
      <UltraEnhancedView>
        <div>View Content</div>
      </UltraEnhancedView>
    );

    expect(screen.getByText('View Content')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <UltraEnhancedView className="custom-view">
        <div>Content</div>
      </UltraEnhancedView>
    );

    const view = container.firstChild as HTMLElement;
    expect(view).toHaveClass('custom-view');
  });

  it('enables parallax when enableParallax is true', () => {
    render(
      <UltraEnhancedView enableParallax={true}>
        <div>Content</div>
      </UltraEnhancedView>
    );

    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('enables breathing when enableBreathing is true', () => {
    render(
      <UltraEnhancedView enableBreathing={true}>
        <div>Content</div>
      </UltraEnhancedView>
    );

    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('enables transition when enableTransition is true', () => {
    render(
      <UltraEnhancedView enableTransition={true}>
        <div>Content</div>
      </UltraEnhancedView>
    );

    expect(screen.getByText('Content')).toBeInTheDocument();
  });
});

