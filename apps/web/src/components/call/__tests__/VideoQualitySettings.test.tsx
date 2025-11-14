import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import VideoQualitySettings from '@/components/call/VideoQualitySettings';

vi.mock('@/lib/haptics', () => ({
  haptics: {
    impact: vi.fn(),
  },
}));

vi.mock('@/effects/reanimated', () => ({
  useHoverTap: vi.fn(() => ({
    animatedStyle: {},
    handleMouseEnter: vi.fn(),
    handleMouseLeave: vi.fn(),
    handlePress: vi.fn(),
  })),
}));

vi.mock('@/hooks/use-animated-style-value', () => ({
  AnimatedView: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('VideoQualitySettings', () => {
  const mockOnQualityChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders video quality settings', () => {
    render(
      <VideoQualitySettings
        currentQuality="1080p"
        onQualityChange={mockOnQualityChange}
      />
    );

    expect(screen.getByText('Full HD')).toBeInTheDocument();
    expect(screen.getByText('HD')).toBeInTheDocument();
  });

  it('calls onQualityChange when quality is selected', async () => {
    const user = userEvent.setup();
    render(
      <VideoQualitySettings
        currentQuality="1080p"
        onQualityChange={mockOnQualityChange}
      />
    );

    const hdButton = screen.getByText('HD');
    await user.click(hdButton);

    await waitFor(() => {
      expect(mockOnQualityChange).toHaveBeenCalledWith('720p');
    });
  });

  it('highlights current quality', () => {
    render(
      <VideoQualitySettings
        currentQuality="1080p"
        onQualityChange={mockOnQualityChange}
      />
    );

    const fullHdButton = screen.getByText('Full HD').closest('button');
    expect(fullHdButton).toHaveClass(/selected|active|primary/);
  });
});

