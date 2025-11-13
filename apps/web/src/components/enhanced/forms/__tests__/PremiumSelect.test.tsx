import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PremiumSelect } from '@/components/enhanced/forms/PremiumSelect';

vi.mock('@/hooks/use-ui-config', () => ({
  useUIConfig: vi.fn(() => ({})),
}));

vi.mock('@/lib/haptics', () => ({
  haptics: {
    impact: vi.fn(),
  },
}));

describe('PremiumSelect', () => {
  const mockOptions = [
    { label: 'Option 1', value: 'opt1' },
    { label: 'Option 2', value: 'opt2' },
    { label: 'Option 3', value: 'opt3' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders select with options', async () => {
    const user = userEvent.setup();
    render(
      <PremiumSelect
        options={mockOptions}
        aria-label="Test select"
      />
    );

    const trigger = screen.getByRole('combobox');
    await user.click(trigger);

    await waitFor(() => {
      expect(screen.getByText('Option 1')).toBeInTheDocument();
      expect(screen.getByText('Option 2')).toBeInTheDocument();
      expect(screen.getByText('Option 3')).toBeInTheDocument();
    });
  });

  it('calls onChange when option is selected', async () => {
    const user = userEvent.setup();
    const mockOnChange = vi.fn();

    render(
      <PremiumSelect
        options={mockOptions}
        onChange={mockOnChange}
        aria-label="Test select"
      />
    );

    const trigger = screen.getByRole('combobox');
    await user.click(trigger);

    await waitFor(() => {
      expect(screen.getByText('Option 1')).toBeInTheDocument();
    });

    const option1 = screen.getByText('Option 1');
    await user.click(option1);

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith('opt1');
    });
  });

  it('supports multi-select when multiSelect is true', async () => {
    const user = userEvent.setup();
    const mockOnChange = vi.fn();

    render(
      <PremiumSelect
        options={mockOptions}
        onChange={mockOnChange}
        multiSelect={true}
        aria-label="Test select"
      />
    );

    const trigger = screen.getByRole('combobox');
    await user.click(trigger);

    await waitFor(() => {
      expect(screen.getByText('Option 1')).toBeInTheDocument();
    });

    const option1 = screen.getByText('Option 1');
    const option2 = screen.getByText('Option 2');
    await user.click(option1);
    await user.click(option2);

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith(['opt1', 'opt2']);
    });
  });

  it('displays label when provided', () => {
    render(
      <PremiumSelect
        options={mockOptions}
        label="Test Select"
        aria-label="Test select"
      />
    );

    expect(screen.getByText('Test Select')).toBeInTheDocument();
  });

  it('displays error message when error is provided', () => {
    render(
      <PremiumSelect
        options={mockOptions}
        error="This field is required"
        aria-label="Test select"
      />
    );

    expect(screen.getByText('This field is required')).toBeInTheDocument();
  });

  it('displays helper text when provided', () => {
    render(
      <PremiumSelect
        options={mockOptions}
        helperText="Select an option"
        aria-label="Test select"
      />
    );

    expect(screen.getByText('Select an option')).toBeInTheDocument();
  });

  it('disables select when disabled is true', () => {
    render(
      <PremiumSelect
        options={mockOptions}
        disabled={true}
        aria-label="Test select"
      />
    );

    const trigger = screen.getByRole('combobox');
    expect(trigger).toBeDisabled();
  });

  it('renders with different sizes', () => {
    const { rerender } = render(
      <PremiumSelect options={mockOptions} size="sm" aria-label="Select" />
    );

    expect(screen.getByRole('combobox')).toBeInTheDocument();

    rerender(
      <PremiumSelect options={mockOptions} size="md" aria-label="Select" />
    );

    expect(screen.getByRole('combobox')).toBeInTheDocument();

    rerender(
      <PremiumSelect options={mockOptions} size="lg" aria-label="Select" />
    );

    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <PremiumSelect
        options={mockOptions}
        className="custom-select"
        aria-label="Select"
      />
    );

    const select = container.firstChild as HTMLElement;
    expect(select).toHaveClass('custom-select');
  });
});

