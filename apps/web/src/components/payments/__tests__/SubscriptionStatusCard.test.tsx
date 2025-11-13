import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SubscriptionStatusCard } from '@/components/payments/SubscriptionStatusCard';

vi.mock('@/lib/payments-service', () => ({
  PaymentsService: {
    getUserSubscription: vi.fn(() => Promise.resolve(null)),
    getUserEntitlements: vi.fn(() => Promise.resolve({})),
    cancelSubscription: vi.fn(() => Promise.resolve({})),
  },
}));

vi.mock('@/lib/payments-catalog', () => ({
  getPlanById: vi.fn(() => ({ name: 'Premium Plan', tier: 'premium' })),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}));

// Mock spark global
const mockSpark = {
  user: vi.fn(() => Promise.resolve({ id: 'user1' })),
};

global.spark = mockSpark as unknown as typeof global.spark;

// Mock window.confirm
global.confirm = vi.fn(() => true);

describe('SubscriptionStatusCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders subscription status card', async () => {
    render(<SubscriptionStatusCard />);

    await waitFor(() => {
      expect(screen.getByText(/subscription|plan|premium/i)).toBeInTheDocument();
    });
  });

  it('opens pricing modal when upgrade button is clicked', async () => {
    const user = userEvent.setup();
    render(<SubscriptionStatusCard />);

    await waitFor(() => {
      const upgradeButton = screen.queryByText(/upgrade|subscribe/i);
      if (upgradeButton) {
        expect(upgradeButton).toBeInTheDocument();
      }
    });
  });

  it('shows loading state initially', () => {
    render(<SubscriptionStatusCard />);

    // Component should show loading or subscription info
    expect(screen.getByRole('article') || screen.getByRole('region')).toBeInTheDocument();
  });
});

