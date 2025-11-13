import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SegmentedControl } from '@/components/enhanced/buttons/SegmentedControl';

vi.mock('@/hooks/use-ui-config', () => ({
  useUIConfig: vi.fn(() => ({})),
}));

vi.mock('@/utils/reduced-motion', () => ({
  usePrefersReducedMotion: vi.fn(() => false),
}));

vi.mock('@/lib/haptics', () => ({
  haptics: {
    impact: vi.fn(),
  },
}));

describe('SegmentedControl', () => {
  const mockOptions = [
    { label: 'Option 1', value: 'opt1' },
    { label: 'Option 2', value: 'opt2' },
    { label: 'Option 3', value: 'opt3' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders segmented control with options', () => {
    render(
      <SegmentedControl
        options={mockOptions}
        aria-label="Test control"
      />
    );

    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.getByText('Option 2')).toBeInTheDocument();
    expect(screen.getByText('Option 3')).toBeInTheDocument();
  });

  it('calls onChange when option is clicked', async () => {
    const user = userEvent.setup();
    const mockOnChange = vi.fn();

    render(
      <SegmentedControl
        options={mockOptions}
        onChange={mockOnChange}
        aria-label="Test control"
      />
    );

    const option2 = screen.getByText('Option 2');
    await user.click(option2);

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith('opt2');
    });
  });

  it('supports multi-select when multiSelect is true', async () => {
    const user = userEvent.setup();
    const mockOnChange = vi.fn();

    render(
      <SegmentedControl
        options={mockOptions}
        onChange={mockOnChange}
        multiSelect={true}
        aria-label="Test control"
      />
    );

    const option1 = screen.getByText('Option 1');
    const option2 = screen.getByText('Option 2');

    await user.click(option1);
    await user.click(option2);

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith(['opt1', 'opt2']);
    });
  });

  it('renders with different sizes', () => {
    const { rerender } = render(
      <SegmentedControl
        options={mockOptions}
        size="sm"
        aria-label="Test control"
      />
    );

    expect(screen.getByText('Option 1')).toBeInTheDocument();

    rerender(
      <SegmentedControl
        options={mockOptions}
        size="md"
        aria-label="Test control"
      />
    );

    expect(screen.getByText('Option 1')).toBeInTheDocument();

    rerender(
      <SegmentedControl
        options={mockOptions}
        size="lg"
        aria-label="Test control"
      />
    );

    expect(screen.getByText('Option 1')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <SegmentedControl
        options={mockOptions}
        className="custom-control"
        aria-label="Test control"
      />
    );

    const control = container.firstChild as HTMLElement;
    expect(control).toHaveClass('custom-control');
  });
});

