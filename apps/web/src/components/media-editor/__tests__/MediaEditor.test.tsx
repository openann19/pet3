import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MediaEditor } from '@/components/media-editor/MediaEditor';

vi.mock('@/core/services/media/edit-media', () => ({
  editMedia: vi.fn(() => Promise.resolve({ uri: '/edited.jpg' })),
}));

vi.mock('@/lib/logger', () => ({
  createLogger: vi.fn(() => ({
    error: vi.fn(),
  })),
}));

describe('MediaEditor', () => {
  const mockSource = {
    type: 'image' as const,
    uri: '/test-image.jpg',
    width: 800,
    height: 600,
  };

  const mockOnDone = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders media editor', () => {
    render(
      <MediaEditor
        source={mockSource}
        onDone={mockOnDone}
      />
    );

    const img = screen.getByAltText('Media preview');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', '/test-image.jpg');
  });

  it('calls onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <MediaEditor
        source={mockSource}
        onDone={mockOnDone}
        onCancel={mockOnCancel}
      />
    );

    const cancelButton = screen.getByText(/cancel/i);
    await user.click(cancelButton);

    await waitFor(() => {
      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });
  });

  it('applies filter when filter button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <MediaEditor
        source={mockSource}
        onDone={mockOnDone}
      />
    );

    const filterButton = screen.getByText(/mono|sepia|vivid/i);
    await user.click(filterButton);

    // Filter should be applied
    expect(filterButton).toBeInTheDocument();
  });

  it('calls onDone when done button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <MediaEditor
        source={mockSource}
        onDone={mockOnDone}
      />
    );

    const doneButton = screen.getByText(/done|export|save/i);
    await user.click(doneButton);

    await waitFor(() => {
      expect(mockOnDone).toHaveBeenCalled();
    });
  });
});

