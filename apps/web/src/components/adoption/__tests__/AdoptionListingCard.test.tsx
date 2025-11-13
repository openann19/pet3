import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AdoptionListingCard } from '@/components/adoption/AdoptionListingCard';
import type { AdoptionListing } from '@/lib/adoption-marketplace-types';

vi.mock('@/contexts/AppContext', () => ({
  useApp: vi.fn(() => ({
    t: {
      adoption: {
        pendingReview: 'Pending Review',
      },
    },
  })),
}));

vi.mock('@/lib/haptics', () => ({
  haptics: {
    trigger: vi.fn(),
  },
}));

vi.mock('@/effects/reanimated/use-hover-tap', () => ({
  useHoverTap: vi.fn(() => ({
    animatedStyle: {},
    handleMouseEnter: vi.fn(),
    handleMouseLeave: vi.fn(),
    handlePress: vi.fn(),
  })),
}));

describe('AdoptionListingCard', () => {
  const mockListing: AdoptionListing = {
    id: '1',
    petName: 'Fluffy',
    petBreed: 'Golden Retriever',
    petAge: 2,
    petGender: 'male',
    petSize: 'large',
    petPhotos: ['/photo1.jpg'],
    location: { city: 'New York', state: 'NY' },
    fee: { amount: 200, currency: 'USD' },
    vaccinated: true,
    spayedNeutered: true,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders adoption listing card', () => {
    const mockOnSelect = vi.fn();
    render(
      <AdoptionListingCard
        listing={mockListing}
        onSelect={mockOnSelect}
      />
    );

    expect(screen.getByText('Fluffy')).toBeInTheDocument();
    expect(screen.getByText('Golden Retriever')).toBeInTheDocument();
  });

  it('calls onSelect when card is clicked', async () => {
    const user = userEvent.setup();
    const mockOnSelect = vi.fn();

    render(
      <AdoptionListingCard
        listing={mockListing}
        onSelect={mockOnSelect}
      />
    );

    const card = screen.getByText('Fluffy').closest('div');
    await user.click(card!);

    await waitFor(() => {
      expect(mockOnSelect).toHaveBeenCalledWith(mockListing);
    });
  });

  it('calls onFavorite when favorite button is clicked', async () => {
    const user = userEvent.setup();
    const mockOnFavorite = vi.fn();

    render(
      <AdoptionListingCard
        listing={mockListing}
        onSelect={vi.fn()}
        onFavorite={mockOnFavorite}
      />
    );

    const favoriteButton = screen.getByRole('button');
    await user.click(favoriteButton);

    await waitFor(() => {
      expect(mockOnFavorite).toHaveBeenCalledWith('1');
    });
  });

  it('displays fee when provided', () => {
    render(
      <AdoptionListingCard
        listing={mockListing}
        onSelect={vi.fn()}
      />
    );

    expect(screen.getByText(/USD.*200/)).toBeInTheDocument();
  });

  it('displays "Free" when fee is 0', () => {
    const freeListing = { ...mockListing, fee: { amount: 0, currency: 'USD' } };
    render(
      <AdoptionListingCard
        listing={freeListing}
        onSelect={vi.fn()}
      />
    );

    expect(screen.getByText('Free')).toBeInTheDocument();
  });

  it('shows pending review badge when status is pending_review', () => {
    const pendingListing = { ...mockListing, status: 'pending_review' as const };
    render(
      <AdoptionListingCard
        listing={pendingListing}
        onSelect={vi.fn()}
      />
    );

    expect(screen.getByText('Pending Review')).toBeInTheDocument();
  });
});

