import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VerificationButton } from '@/components/verification/VerificationButton';

vi.mock('@/hooks/use-storage', () => ({
  useStorage: vi.fn(() => [{}, vi.fn()]),
}));

describe('VerificationButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders verification button', () => {
    render(
      <VerificationButton petId="pet1" userId="user1" />
    );

    expect(screen.getByText('Get Verified')).toBeInTheDocument();
  });

  it('opens verification dialog when clicked', async () => {
    const user = userEvent.setup();
    render(
      <VerificationButton petId="pet1" userId="user1" />
    );

    const button = screen.getByText('Get Verified');
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('renders with card variant', () => {
    render(
      <VerificationButton petId="pet1" userId="user1" variant="card" />
    );

    expect(screen.getByText('Get Verified')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <VerificationButton
        petId="pet1"
        userId="user1"
        className="custom-button"
      />
    );

    const button = container.querySelector('button');
    expect(button).toHaveClass('custom-button');
  });
});

