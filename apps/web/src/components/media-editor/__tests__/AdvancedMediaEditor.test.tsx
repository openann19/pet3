import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AdvancedMediaEditor } from '@/components/media-editor/AdvancedMediaEditor';

vi.mock('@/hooks/media-editor', () => ({
  useMediaEditor: vi.fn(() => ({
    isReady: true,
    filters: {
      presets: ['none', 'mono', 'sepia'],
    },
    loadImage: vi.fn(() => Promise.resolve()),
  })),
}));

describe('AdvancedMediaEditor', () => {
  const mockOnComplete = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders advanced media editor', () => {
    render(
      <AdvancedMediaEditor
        file="/test-image.jpg"
        context="pet-profile"
        onComplete={mockOnComplete}
      />
    );

    expect(screen.getByText('Advanced Media Editor Ready')).toBeInTheDocument();
  });

  it('displays filter count', () => {
    render(
      <AdvancedMediaEditor
        file="/test-image.jpg"
        context="pet-profile"
        onComplete={mockOnComplete}
      />
    );

    expect(screen.getByText(/3 filters/)).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <AdvancedMediaEditor
        file="/test-image.jpg"
        context="pet-profile"
        onComplete={mockOnComplete}
        className="custom-editor"
      />
    );

    const editor = container.firstChild as HTMLElement;
    expect(editor).toHaveClass('custom-editor');
  });
});

