import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReportSightingDialog } from '@/components/lost-found/ReportSightingDialog';
import type { LostAlert } from '@/lib/lost-found-types';

vi.mock('@/api/lost-found-api', () => ({
  lostFoundAPI: {
    reportSighting: vi.fn(() => Promise.resolve({ id: 'sighting1' })),
  },
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/lib/logger', () => ({
  createLogger: vi.fn(() => ({
    error: vi.fn(),
  })),
}));

describe('ReportSightingDialog', () => {
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
    photos: [],
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders report sighting dialog when open', () => {
    render(
      <ReportSightingDialog
        open={true}
        alert={mockAlert}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <ReportSightingDialog
        open={false}
        alert={mockAlert}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <ReportSightingDialog
        open={true}
        alert={mockAlert}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const closeButton = screen.getByRole('button', { name: /close|cancel/i });
    await user.click(closeButton);

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });
});

