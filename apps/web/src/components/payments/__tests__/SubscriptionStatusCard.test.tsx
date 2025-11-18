import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { SubscriptionStatusCard } from '@/components/payments/SubscriptionStatusCard';
import { renderWithProviders } from '@/test/utilities';

// Mock dependencies
vi.mock('@/lib/payments-service', () => ({
  PaymentsService: {
    getUserSubscription: vi.fn(),
    getUserEntitlements: vi.fn(),
    cancelSubscription: vi.fn(),
  },
}));

vi.mock('@/lib/user-service', () => ({
  userService: {
    user: vi.fn(),
  },
}));

vi.mock('@/lib/payments-catalog', () => ({
  getPlanById: vi.fn(),
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock('@/components/payments/PricingModal', () => ({
  PricingModal: ({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) => (
    <div data-testid="pricing-modal">
      Pricing Modal - Open: {open ? 'yes' : 'no'}
      <button onClick={() => onOpenChange(false)} data-testid="close-pricing-modal">
        Close
      </button>
    </div>
  ),
}));

// Mock confirm globally
const mockConfirm = vi.fn();
global.confirm = mockConfirm;

const { PaymentsService } = await import('@/lib/payments-service');
const { userService } = await import('@/lib/user-service');
const { getPlanById } = await import('@/lib/payments-catalog');
const { toast } = await import('sonner');

const mockUser = { id: 'user-1', email: 'test@example.com' };
const mockSubscription = {
  id: 'sub-1',
  userId: 'user-1',
  planId: 'plan-premium',
  status: 'active' as const,
  store: 'web' as const,
  startDate: new Date().toISOString(),
  currentPeriodStart: new Date().toISOString(),
  currentPeriodEnd: new Date(Date.now() + 86400000).toISOString(),
  cancelAtPeriodEnd: false,
  metadata: {},
};
const mockEntitlements = {
  userId: 'user-1',
  planTier: 'premium' as const,
  entitlements: ['unlimited_swipes', 'who_liked_you'],
  consumables: { boosts: 2, super_likes: 1 },
  updatedAt: new Date().toISOString(),
};
const mockPlan = {
  id: 'plan-premium',
  tier: 'premium' as const,
  name: 'Premium',
  description: 'Premium features',
  priceMonthly: 9.99,
  priceYearly: 99.99,
  currency: 'USD',
  entitlements: ['unlimited_swipes'],
};

describe('SubscriptionStatusCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConfirm.mockReturnValue(true);
    (userService.user as any).mockResolvedValue(mockUser);
    (PaymentsService.getUserSubscription as any).mockResolvedValue(mockSubscription);
    (PaymentsService.getUserEntitlements as any).mockResolvedValue(mockEntitlements);
    (getPlanById as any).mockReturnValue(mockPlan);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('loads and displays subscription data', async () => {
    renderWithProviders(<SubscriptionStatusCard />);

    await waitFor(() => {
      expect(screen.getByText('Premium Plan')).toBeInTheDocument();
      expect(screen.getByText('Premium features')).toBeInTheDocument();
      expect(screen.getByText('active')).toBeInTheDocument();
    });

    expect(userService.user).toHaveBeenCalled();
    expect(PaymentsService.getUserSubscription).toHaveBeenCalledWith('user-1');
    expect(PaymentsService.getUserEntitlements).toHaveBeenCalledWith('user-1');
  });

  it('displays loading state initially', () => {
    renderWithProviders(<SubscriptionStatusCard />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('displays free tier when no subscription', async () => {
    (PaymentsService.getUserSubscription as any).mockResolvedValue(null);
    (PaymentsService.getUserEntitlements as any).mockResolvedValue({
      ...mockEntitlements,
      planTier: 'free',
    });

    renderWithProviders(<SubscriptionStatusCard />);

    await waitFor(() => {
      expect(screen.getByText('Free Plan')).toBeInTheDocument();
      expect(screen.getByText('Upgrade to Premium')).toBeInTheDocument();
    });
  });

  it('displays canceled subscription status', async () => {
    (PaymentsService.getUserSubscription as any).mockResolvedValue({
      ...mockSubscription,
      cancelAtPeriodEnd: true,
    });

    renderWithProviders(<SubscriptionStatusCard />);

    await waitFor(() => {
      expect(screen.getByText('Subscription Canceled')).toBeInTheDocument();
      expect(screen.queryByText('Cancel Subscription')).not.toBeInTheDocument();
    });
  });

  it('displays complimentary subscription', async () => {
    (PaymentsService.getUserSubscription as any).mockResolvedValue({
      ...mockSubscription,
      isComp: true,
      compReason: 'Goodwill gesture',
    });

    renderWithProviders(<SubscriptionStatusCard />);

    await waitFor(() => {
      expect(screen.getByText('🎁 Complimentary Subscription')).toBeInTheDocument();
      expect(screen.getByText('Goodwill gesture')).toBeInTheDocument();
    });
  });

  it('shows entitlements badges', async () => {
    renderWithProviders(<SubscriptionStatusCard />);

    await waitFor(() => {
      expect(screen.getByText('unlimited swipes')).toBeInTheDocument();
      expect(screen.getByText('who liked you')).toBeInTheDocument();
    });
  });

  it('shows consumables', async () => {
    renderWithProviders(<SubscriptionStatusCard />);

    await waitFor(() => {
      expect(screen.getByText('2 Boosts')).toBeInTheDocument();
      expect(screen.getByText('1 Super Likes')).toBeInTheDocument();
    });
  });

  it('handles cancel subscription', async () => {
    const user = userEvent.setup();
    (PaymentsService.cancelSubscription as any).mockResolvedValue({
      ...mockSubscription,
      cancelAtPeriodEnd: true,
    });

    renderWithProviders(<SubscriptionStatusCard />);

    await waitFor(() => {
      expect(screen.getByText('Cancel Subscription')).toBeInTheDocument();
    });

    const cancelButton = screen.getByText('Cancel Subscription');
    await user.click(cancelButton);

    expect(mockConfirm).toHaveBeenCalledWith(
      'Are you sure you want to cancel your subscription? You will keep your benefits until the end of the current period.'
    );
    expect(PaymentsService.cancelSubscription).toHaveBeenCalledWith('sub-1', false);
    expect(toast.success).toHaveBeenCalled();
  });

  it('handles cancel subscription failure', async () => {
    const user = userEvent.setup();
    (PaymentsService.cancelSubscription as any).mockRejectedValue(new Error('Cancel failed'));

    renderWithProviders(<SubscriptionStatusCard />);

    await waitFor(() => {
      expect(screen.getByText('Cancel Subscription')).toBeInTheDocument();
    });

    const cancelButton = screen.getByText('Cancel Subscription');
    await user.click(cancelButton);

    expect(toast.error).toHaveBeenCalledWith('Failed to cancel subscription');
  });

  it('opens pricing modal', async () => {
    const user = userEvent.setup();

    renderWithProviders(<SubscriptionStatusCard />);

    await waitFor(() => {
      expect(screen.getByText('View All Plans')).toBeInTheDocument();
    });

    const viewPlansButton = screen.getByText('View All Plans');
    await user.click(viewPlansButton);

    expect(screen.getByTestId('pricing-modal')).toHaveTextContent('Open: yes');
  });

  it('handles data loading error', async () => {
    (userService.user as any).mockRejectedValue(new Error('User not found'));

    renderWithProviders(<SubscriptionStatusCard />);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('User not authenticated');
    });
  });
});
