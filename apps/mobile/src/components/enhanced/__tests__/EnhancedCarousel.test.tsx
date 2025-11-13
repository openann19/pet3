import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react-native';
import { EnhancedCarousel } from '@/components/enhanced/EnhancedCarousel';

describe('EnhancedCarousel', () => {
  const mockItems = [
    <div key="1">Item 1</div>,
    <div key="2">Item 2</div>,
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders carousel with items', () => {
    const { getByText } = render(<EnhancedCarousel items={mockItems} />);

    expect(getByText('Item 1')).toBeDefined();
  });

  it('renders null when items array is empty', () => {
    const { container } = render(<EnhancedCarousel items={[]} />);

    expect(container.children.length).toBe(0);
  });
});

