import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EnhancedCarousel } from '@/components/enhanced/EnhancedCarousel';

vi.mock('@/hooks/use-ui-config', () => ({
  useUIConfig: vi.fn(() => ({})),
}));

vi.mock('@/hooks/use-animated-style-value', () => ({
  useAnimatedStyleValue: vi.fn((style) => style),
}));

vi.mock('@/utils/reduced-motion', () => ({
  usePrefersReducedMotion: vi.fn(() => false),
}));

vi.mock('@/lib/haptics', () => ({
  haptics: {
    impact: vi.fn(),
  },
}));

describe('EnhancedCarousel', () => {
  const mockItems = [
    <div key="1">Item 1</div>,
    <div key="2">Item 2</div>,
    <div key="3">Item 3</div>,
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders carousel with items', () => {
    render(<EnhancedCarousel items={mockItems} />);
    
    expect(screen.getByText('Item 1')).toBeInTheDocument();
  });

  it('renders null when items array is empty', () => {
    const { container } = render(<EnhancedCarousel items={[]} />);
    
    expect(container.firstChild).toBeNull();
  });

  it('shows controls when showControls is true', () => {
    render(<EnhancedCarousel items={mockItems} showControls={true} />);
    
    expect(screen.getByLabelText('Previous slide')).toBeInTheDocument();
    expect(screen.getByLabelText('Next slide')).toBeInTheDocument();
  });

  it('hides controls when showControls is false', () => {
    render(<EnhancedCarousel items={mockItems} showControls={false} />);
    
    expect(screen.queryByLabelText('Previous slide')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Next slide')).not.toBeInTheDocument();
  });

  it('shows indicators when showIndicators is true', () => {
    render(<EnhancedCarousel items={mockItems} showIndicators={true} />);
    
    expect(screen.getByLabelText('Go to slide 1')).toBeInTheDocument();
    expect(screen.getByLabelText('Go to slide 2')).toBeInTheDocument();
    expect(screen.getByLabelText('Go to slide 3')).toBeInTheDocument();
  });

  it('hides indicators when showIndicators is false', () => {
    render(<EnhancedCarousel items={mockItems} showIndicators={false} />);
    
    expect(screen.queryByLabelText('Go to slide 1')).not.toBeInTheDocument();
  });

  it('navigates to next slide when next button is clicked', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const mockOnSlideChange = vi.fn();
    
    render(
      <EnhancedCarousel
        items={mockItems}
        onSlideChange={mockOnSlideChange}
        showControls={true}
      />
    );

    const nextButton = screen.getByLabelText('Next slide');
    await user.click(nextButton);

    await waitFor(() => {
      expect(mockOnSlideChange).toHaveBeenCalledWith(1);
    });
  });

  it('navigates to previous slide when prev button is clicked', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const mockOnSlideChange = vi.fn();
    
    render(
      <EnhancedCarousel
        items={mockItems}
        onSlideChange={mockOnSlideChange}
        showControls={true}
      />
    );

    // First go to slide 2
    const nextButton = screen.getByLabelText('Next slide');
    await user.click(nextButton);
    
    await waitFor(() => {
      expect(mockOnSlideChange).toHaveBeenCalledWith(1);
    });

    // Then go back
    const prevButton = screen.getByLabelText('Previous slide');
    await user.click(prevButton);

    await waitFor(() => {
      expect(mockOnSlideChange).toHaveBeenCalledWith(0);
    });
  });

  it('loops to first slide when at last slide and loop is true', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const mockOnSlideChange = vi.fn();
    
    render(
      <EnhancedCarousel
        items={mockItems}
        onSlideChange={mockOnSlideChange}
        showControls={true}
        loop={true}
      />
    );

    // Go to last slide
    const nextButton = screen.getByLabelText('Next slide');
    await user.click(nextButton);
    await user.click(nextButton);
    
    // Click again to loop
    await user.click(nextButton);

    await waitFor(() => {
      expect(mockOnSlideChange).toHaveBeenCalledWith(0);
    });
  });

  it('does not loop when loop is false', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const mockOnSlideChange = vi.fn();
    
    render(
      <EnhancedCarousel
        items={mockItems}
        onSlideChange={mockOnSlideChange}
        showControls={true}
        loop={false}
      />
    );

    // Go to last slide
    const nextButton = screen.getByLabelText('Next slide');
    await user.click(nextButton);
    await user.click(nextButton);
    
    // Button should be disabled
    expect(nextButton).toBeDisabled();
  });

  it('displays current slide number', () => {
    render(<EnhancedCarousel items={mockItems} />);
    
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <EnhancedCarousel items={mockItems} className="custom-carousel" />
    );
    
    const carousel = container.firstChild as HTMLElement;
    expect(carousel).toHaveClass('custom-carousel');
  });
});

