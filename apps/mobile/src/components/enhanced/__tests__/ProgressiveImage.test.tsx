import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react-native';
import { ProgressiveImage } from '@/components/enhanced/ProgressiveImage';

describe('ProgressiveImage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders progressive image', () => {
    const { container } = render(
      <ProgressiveImage
        src="https://example.com/image.jpg"
        alt="Test image"
      />
    );

    expect(container).toBeDefined();
  });

  it('uses placeholder when provided', () => {
    const { container } = render(
      <ProgressiveImage
        src="https://example.com/image.jpg"
        alt="Test image"
        placeholderSrc="https://example.com/placeholder.jpg"
      />
    );

    expect(container).toBeDefined();
  });
});

