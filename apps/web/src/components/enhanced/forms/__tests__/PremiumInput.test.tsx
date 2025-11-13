import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PremiumInput } from '@/components/enhanced/forms/PremiumInput';

vi.mock('@/hooks/use-ui-config', () => ({
  useUIConfig: vi.fn(() => ({})),
}));

vi.mock('@/hooks/use-animated-style-value', () => ({
  useAnimatedStyleValue: vi.fn((style) => style),
}));

vi.mock('@/lib/haptics', () => ({
  haptics: {
    impact: vi.fn(),
  },
}));

describe('PremiumInput', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders input with label', () => {
    render(
      <PremiumInput label="Test Input" id="test-input" />
    );

    expect(screen.getByLabelText('Test Input')).toBeInTheDocument();
  });

  it('renders input without label', () => {
    render(
      <PremiumInput id="test-input" />
    );

    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();
  });

  it('displays error message when error is provided', () => {
    render(
      <PremiumInput
        label="Test Input"
        error="This field is required"
        id="test-input"
      />
    );

    expect(screen.getByText('This field is required')).toBeInTheDocument();
  });

  it('displays helper text when provided', () => {
    render(
      <PremiumInput
        label="Test Input"
        helperText="Enter your name"
        id="test-input"
      />
    );

    expect(screen.getByText('Enter your name')).toBeInTheDocument();
  });

  it('calls onChange when value changes', async () => {
    const user = userEvent.setup();
    const mockOnChange = vi.fn();

    render(
      <PremiumInput
        label="Test Input"
        onChange={mockOnChange}
        id="test-input"
      />
    );

    const input = screen.getByLabelText('Test Input');
    await user.type(input, 'test');

    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalled();
    });
  });

  it('shows password toggle when showPasswordToggle is true', async () => {
    const user = userEvent.setup();
    render(
      <PremiumInput
        label="Password"
        type="password"
        showPasswordToggle={true}
        id="password-input"
      />
    );

    const toggleButton = screen.getByRole('button', { name: /toggle password/i });
    expect(toggleButton).toBeInTheDocument();

    await user.click(toggleButton);

    const input = screen.getByLabelText('Password');
    expect(input).toHaveAttribute('type', 'text');
  });

  it('shows clear button when showClearButton is true and has value', () => {
    render(
      <PremiumInput
        label="Test Input"
        value="test value"
        showClearButton={true}
        id="test-input"
      />
    );

    const clearButton = screen.getByRole('button', { name: /clear/i });
    expect(clearButton).toBeInTheDocument();
  });

  it('calls onClear when clear button is clicked', async () => {
    const user = userEvent.setup();
    const mockOnClear = vi.fn();

    render(
      <PremiumInput
        label="Test Input"
        value="test value"
        showClearButton={true}
        onClear={mockOnClear}
        id="test-input"
      />
    );

    const clearButton = screen.getByRole('button', { name: /clear/i });
    await user.click(clearButton);

    expect(mockOnClear).toHaveBeenCalledTimes(1);
  });

  it('renders with different sizes', () => {
    const { rerender } = render(
      <PremiumInput label="Input" size="sm" id="input" />
    );

    expect(screen.getByLabelText('Input')).toBeInTheDocument();

    rerender(
      <PremiumInput label="Input" size="md" id="input" />
    );

    expect(screen.getByLabelText('Input')).toBeInTheDocument();

    rerender(
      <PremiumInput label="Input" size="lg" id="input" />
    );

    expect(screen.getByLabelText('Input')).toBeInTheDocument();
  });

  it('renders with different variants', () => {
    const { rerender } = render(
      <PremiumInput label="Input" variant="default" id="input" />
    );

    expect(screen.getByLabelText('Input')).toBeInTheDocument();

    rerender(
      <PremiumInput label="Input" variant="filled" id="input" />
    );

    expect(screen.getByLabelText('Input')).toBeInTheDocument();

    rerender(
      <PremiumInput label="Input" variant="outlined" id="input" />
    );

    expect(screen.getByLabelText('Input')).toBeInTheDocument();
  });

  it('disables input when disabled is true', () => {
    render(
      <PremiumInput label="Input" disabled={true} id="input" />
    );

    const input = screen.getByLabelText('Input');
    expect(input).toBeDisabled();
  });

  it('applies custom className', () => {
    const { container } = render(
      <PremiumInput label="Input" className="custom-input" id="input" />
    );

    const input = container.querySelector('input');
    expect(input).toHaveClass('custom-input');
  });
});

