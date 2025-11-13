import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SplitButton } from '@/components/enhanced/buttons/SplitButton';

vi.mock('@/hooks/use-ui-config', () => ({
  useUIConfig: vi.fn(() => ({})),
}));

vi.mock('@/lib/haptics', () => ({
  haptics: {
    impact: vi.fn(),
  },
}));

describe('SplitButton', () => {
  const mockMainAction = {
    label: 'Primary Action',
    onClick: vi.fn(),
  };

  const mockSecondaryActions = [
    { label: 'Action 1', onClick: vi.fn() },
    { label: 'Action 2', onClick: vi.fn() },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders split button with main action', () => {
    render(
      <SplitButton
        mainAction={mockMainAction}
        secondaryActions={mockSecondaryActions}
      />
    );

    expect(screen.getByText('Primary Action')).toBeInTheDocument();
  });

  it('calls main action onClick when main button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <SplitButton
        mainAction={mockMainAction}
        secondaryActions={mockSecondaryActions}
      />
    );

    const mainButton = screen.getByText('Primary Action');
    await user.click(mainButton);

    expect(mockMainAction.onClick).toHaveBeenCalledTimes(1);
  });

  it('opens dropdown menu when divider is clicked', async () => {
    const user = userEvent.setup();
    render(
      <SplitButton
        mainAction={mockMainAction}
        secondaryActions={mockSecondaryActions}
      />
    );

    // Find the dropdown trigger (ChevronDown icon)
    const dropdownTrigger = screen.getByRole('button', { expanded: false });
    await user.click(dropdownTrigger);

    await waitFor(() => {
      expect(screen.getByText('Action 1')).toBeInTheDocument();
      expect(screen.getByText('Action 2')).toBeInTheDocument();
    });
  });

  it('calls secondary action onClick when menu item is clicked', async () => {
    const user = userEvent.setup();
    render(
      <SplitButton
        mainAction={mockMainAction}
        secondaryActions={mockSecondaryActions}
      />
    );

    const dropdownTrigger = screen.getByRole('button', { expanded: false });
    await user.click(dropdownTrigger);

    await waitFor(() => {
      expect(screen.getByText('Action 1')).toBeInTheDocument();
    });

    const action1 = screen.getByText('Action 1');
    await user.click(action1);

    expect(mockSecondaryActions[0].onClick).toHaveBeenCalledTimes(1);
  });

  it('disables button when disabled prop is true', () => {
    render(
      <SplitButton
        mainAction={mockMainAction}
        secondaryActions={mockSecondaryActions}
        disabled={true}
      />
    );

    const mainButton = screen.getByText('Primary Action').closest('button');
    expect(mainButton).toBeDisabled();
  });

  it('renders with different variants', () => {
    const { rerender } = render(
      <SplitButton
        mainAction={mockMainAction}
        secondaryActions={mockSecondaryActions}
        variant="primary"
      />
    );

    expect(screen.getByText('Primary Action')).toBeInTheDocument();

    rerender(
      <SplitButton
        mainAction={mockMainAction}
        secondaryActions={mockSecondaryActions}
        variant="secondary"
      />
    );

    expect(screen.getByText('Primary Action')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <SplitButton
        mainAction={mockMainAction}
        secondaryActions={mockSecondaryActions}
        className="custom-split-button"
      />
    );

    const button = container.firstChild as HTMLElement;
    expect(button).toHaveClass('custom-split-button');
  });
});

