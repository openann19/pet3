import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LostAlertCard } from '@/components/lost-found/LostAlertCard';
import type { LostAlert } from '@/lib/lost-found-types';

vi.mock('date-fns', () => ({
  formatDistanceToNow: vi.fn(() => '2 hours ago'),
}));

describe('LostAlertCard', () => {
  const mockAlert: LostAlert = {
    id: 'alert1',
    petSummary: {
      name: 'Max',
      species: 'dog',
      breed: 'Labrador',
      size: 'large',
      color: 'golden',
    },
    lastSeen: {
      whenISO: new Date().toISOString(),
      location: {
        address: '123 Main St',
        city: 'New York',
        state: 'NY',
        coordinates: { lat: 40.7128, lng: -74.0060 },
      },
    },
    photos: ['/photo1.jpg'],
    status: 'active',
    reward: 500,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders lost alert card', () => {
    render(
      <LostAlertCard
        alert={mockAlert}
        onSelect={vi.fn()}
      />
    );

    expect(screen.getByText('Max')).toBeInTheDocument();
    expect(screen.getByText('Labrador')).toBeInTheDocument();
  });

  it('calls onSelect when card is clicked', async () => {
    const user = userEvent.setup();
    const mockOnSelect = vi.fn();

    render(
      <LostAlertCard
        alert={mockAlert}
        onSelect={mockOnSelect}
      />
    );

    const card = screen.getByText('Max').closest('div');
    await user.click(card!);

    await waitFor(() => {
      expect(mockOnSelect).toHaveBeenCalledWith(mockAlert);
    });
  });

  it('calls onToggleFavorite when favorite button is clicked', async () => {
    const user = userEvent.setup();
    const mockOnToggleFavorite = vi.fn();

    render(
      <LostAlertCard
        alert={mockAlert}
        onSelect={vi.fn()}
        onToggleFavorite={mockOnToggleFavorite}
      />
    );

    const favoriteButton = screen.getByRole('button');
    await user.click(favoriteButton);

    await waitFor(() => {
      expect(mockOnToggleFavorite).toHaveBeenCalledWith('alert1');
    });
  });

  it('displays reward when provided', () => {
    render(
      <LostAlertCard
        alert={mockAlert}
        onSelect={vi.fn()}
      />
    );

    expect(screen.getByText(/Reward.*500/)).toBeInTheDocument();
  });

  it('shows status badge', () => {
    render(
      <LostAlertCard
        alert={mockAlert}
        onSelect={vi.fn()}
      />
    );

    expect(screen.getByText('Lost')).toBeInTheDocument();
  });

  it('shows found badge when status is found', () => {
    const foundAlert = { ...mockAlert, status: 'found' as const };
    render(
      <LostAlertCard
        alert={foundAlert}
        onSelect={vi.fn()}
      />
    );

    expect(screen.getByText('Found')).toBeInTheDocument();
  });
});

