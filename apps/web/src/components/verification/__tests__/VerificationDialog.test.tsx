import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VerificationDialog } from '@/components/verification/VerificationDialog';

vi.mock('@/hooks/use-storage', () => ({
  useStorage: vi.fn(() => [{}, vi.fn()]),
}));

vi.mock('@/lib/verification-service', () => ({
  VerificationService: {
    createVerificationRequest: vi.fn(() => ({
      id: 'req1',
      petId: 'pet1',
      userId: 'user1',
      level: 'basic',
      status: 'pending',
      documents: {},
    })),
    validateFileSize: vi.fn(() => true),
    calculateCompletionPercentage: vi.fn(() => 0),
  },
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('VerificationDialog', () => {
  const mockOnOpenChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders verification dialog when open', () => {
    render(
      <VerificationDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        petId="pet1"
        userId="user1"
      />
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <VerificationDialog
        open={false}
        onOpenChange={mockOnOpenChange}
        petId="pet1"
        userId="user1"
      />
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('calls onOpenChange when closed', async () => {
    const user = userEvent.setup();
    render(
      <VerificationDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        petId="pet1"
        userId="user1"
      />
    );

    const closeButton = screen.getByRole('button', { name: /close/i });
    await user.click(closeButton);

    await waitFor(() => {
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });
});

