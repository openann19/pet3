import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ProgressiveImage } from '@/components/enhanced/ProgressiveImage';

vi.mock('@/hooks/use-ui-config', () => ({
  useUIConfig: vi.fn(() => ({})),
}));

vi.mock('@/lib/image-loader', () => ({
  supportsWebP: vi.fn(() => true),
  supportsAVIF: vi.fn(() => Promise.resolve(false)),
}));

describe('ProgressiveImage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock Image constructor
    global.Image = vi.fn(() => {
      const img = document.createElement('img');
      return img as unknown as HTMLImageElement;
    }) as unknown as typeof Image;
  });

  it('renders image with src and alt', () => {
    render(
      <ProgressiveImage
        src="https://example.com/image.jpg"
        alt="Test image"
      />
    );
    
    const img = screen.getByAltText('Test image');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://example.com/image.jpg');
  });

  it('uses placeholder when provided', () => {
    render(
      <ProgressiveImage
        src="https://example.com/image.jpg"
        alt="Test image"
        placeholderSrc="https://example.com/placeholder.jpg"
      />
    );
    
    const img = screen.getByAltText('Test image');
    expect(img).toHaveAttribute('src', 'https://example.com/placeholder.jpg');
  });

  it('applies custom className', () => {
    const { container } = render(
      <ProgressiveImage
        src="https://example.com/image.jpg"
        alt="Test image"
        className="custom-image"
      />
    );
    
    const img = container.querySelector('img');
    expect(img).toHaveClass('custom-image');
  });

  it('applies containerClassName', () => {
    const { container } = render(
      <ProgressiveImage
        src="https://example.com/image.jpg"
        alt="Test image"
        containerClassName="custom-container"
      />
    );
    
    const containerElement = container.firstChild as HTMLElement;
    expect(containerElement).toHaveClass('custom-container');
  });

  it('calls onLoad when image loads', async () => {
    const mockOnLoad = vi.fn();
    
    render(
      <ProgressiveImage
        src="https://example.com/image.jpg"
        alt="Test image"
        onLoad={mockOnLoad}
      />
    );
    
    const img = screen.getByAltText('Test image');
    Object.defineProperty(img, 'complete', { value: true, writable: true });
    Object.defineProperty(img, 'naturalWidth', { value: 100, writable: true });
    Object.defineProperty(img, 'naturalHeight', { value: 100, writable: true });
    
    // Simulate load event
    const loadEvent = new Event('load');
    img.dispatchEvent(loadEvent);
    
    await waitFor(() => {
      expect(mockOnLoad).toHaveBeenCalled();
    });
  });

  it('calls onError when image fails to load', async () => {
    const mockOnError = vi.fn();
    
    render(
      <ProgressiveImage
        src="https://example.com/invalid.jpg"
        alt="Test image"
        onError={mockOnError}
      />
    );
    
    const img = screen.getByAltText('Test image');
    const errorEvent = new Event('error');
    img.dispatchEvent(errorEvent);
    
    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalled();
    });
  });

  it('applies aspect ratio when provided', () => {
    const { container } = render(
      <ProgressiveImage
        src="https://example.com/image.jpg"
        alt="Test image"
        aspectRatio="16/9"
      />
    );
    
    const containerElement = container.firstChild as HTMLElement;
    expect(containerElement).toHaveStyle({ aspectRatio: '16/9' });
  });

  it('uses priority loading when priority is true', () => {
    render(
      <ProgressiveImage
        src="https://example.com/image.jpg"
        alt="Test image"
        priority={true}
      />
    );
    
    const img = screen.getByAltText('Test image');
    expect(img).toHaveAttribute('loading', 'eager');
  });
});

