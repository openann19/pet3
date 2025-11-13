import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PricingModal } from '@/components/payments/PricingModal';

vi.mock('@/lib/payments-service', () => ({
  PaymentsService: {
    createSubscription: vi.fn(() => Promise.resolve({})),
  },
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock spark global
const mockSpark = {
  user: vi.fn(() => Promise.resolve({ id: 'user1' })),
};

global.spark = mockSpark as unknown as typeof global.spark;

describe('PricingModal', () => {
  const mockOnOpenChange = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders pricing modal when open', () => {
    render(
      <PricingModal
        open={true}
        onOpenChange={mockOnOpenChange}
      />
    );

    expect(screen.getByText('Choose Your Plan')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <PricingModal
        open={false}
        onOpenChange={mockOnOpenChange}
      />
    );

    expect(screen.queryByText('Choose Your Plan')).not.toBeInTheDocument();
  });

  it('switches between monthly and yearly billing', async () => {
    const user = userEvent.setup();
    render(
      <PricingModal
        open={true}
        onOpenChange={mockOnOpenChange}
      />
    );

    const yearlyButton = screen.getByText('Yearly');
    await user.click(yearlyButton);

    await waitFor(() => {
      expect(yearlyButton).toHaveClass(/default/);
    });
  });

  it('calls onOpenChange when closed', async () => {
    const user = userEvent.setup();
    render(
      <PricingModal
        open={true}
        onOpenChange={mockOnOpenChange}
      />
    );

    const closeButton = screen.getByRole('button', { name: /close/i });
    await user.click(closeButton);

    await waitFor(() => {
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });
});

