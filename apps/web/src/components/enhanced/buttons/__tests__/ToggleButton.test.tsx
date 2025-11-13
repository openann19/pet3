import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToggleButton } from '@/components/enhanced/buttons/ToggleButton';

vi.mock('@/hooks/use-ui-config', () => ({
  useUIConfig: vi.fn(() => ({})),
}));

vi.mock('@/lib/haptics', () => ({
  haptics: {
    selection: vi.fn(),
  },
}));

describe('ToggleButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders toggle button', () => {
    render(
      <ToggleButton aria-label="Toggle button">
        Toggle
      </ToggleButton>
    );

    expect(screen.getByText('Toggle')).toBeInTheDocument();
  });

  it('calls onChange when clicked', async () => {
    const user = userEvent.setup();
    const mockOnChange = vi.fn();

    render(
      <ToggleButton
        checked={false}
        onChange={mockOnChange}
        aria-label="Toggle button"
      >
        Toggle
      </ToggleButton>
    );

    const button = screen.getByText('Toggle');
    await user.click(button);

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith(true);
    });
  });

  it('toggles from checked to unchecked', async () => {
    const user = userEvent.setup();
    const mockOnChange = vi.fn();

    const { rerender } = render(
      <ToggleButton
        checked={true}
        onChange={mockOnChange}
        aria-label="Toggle button"
      >
        Toggle
      </ToggleButton>
    );

    const button = screen.getByText('Toggle');
    await user.click(button);

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith(false);
    });
  });

  it('renders with different variants', () => {
    const { rerender } = render(
      <ToggleButton variant="primary" aria-label="Toggle">
        Toggle
      </ToggleButton>
    );

    expect(screen.getByText('Toggle')).toBeInTheDocument();

    rerender(
      <ToggleButton variant="secondary" aria-label="Toggle">
        Toggle
      </ToggleButton>
    );

    expect(screen.getByText('Toggle')).toBeInTheDocument();
  });

  it('renders with different sizes', () => {
    const { rerender } = render(
      <ToggleButton size="sm" aria-label="Toggle">
        Toggle
      </ToggleButton>
    );

    expect(screen.getByText('Toggle')).toBeInTheDocument();

    rerender(
      <ToggleButton size="md" aria-label="Toggle">
        Toggle
      </ToggleButton>
    );

    expect(screen.getByText('Toggle')).toBeInTheDocument();

    rerender(
      <ToggleButton size="lg" aria-label="Toggle">
        Toggle
      </ToggleButton>
    );

    expect(screen.getByText('Toggle')).toBeInTheDocument();
  });

  it('disables button when disabled prop is true', () => {
    render(
      <ToggleButton disabled={true} aria-label="Toggle">
        Toggle
      </ToggleButton>
    );

    const button = screen.getByText('Toggle').closest('button');
    expect(button).toBeDisabled();
  });

  it('does not call onChange when disabled', async () => {
    const user = userEvent.setup();
    const mockOnChange = vi.fn();

    render(
      <ToggleButton
        disabled={true}
        onChange={mockOnChange}
        aria-label="Toggle"
      >
        Toggle
      </ToggleButton>
    );

    const button = screen.getByText('Toggle');
    await user.click(button);

    expect(mockOnChange).not.toHaveBeenCalled();
  });

  it('applies custom className', () => {
    const { container } = render(
      <ToggleButton className="custom-toggle" aria-label="Toggle">
        Toggle
      </ToggleButton>
    );

    const button = container.querySelector('button');
    expect(button).toHaveClass('custom-toggle');
  });
});

