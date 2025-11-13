import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NotificationCenter } from '@/components/enhanced/NotificationCenter';
import type { Notification } from '@/components/enhanced/NotificationCenter';

vi.mock('@/hooks/use-ui-config', () => ({
  useUIConfig: vi.fn(() => ({})),
}));

const mockSetNotifications = vi.fn();
vi.mock('@/hooks/use-storage', () => ({
  useStorage: vi.fn((key: string, initial: Notification[]) => {
    return [initial, mockSetNotifications];
  }),
}));

vi.mock('@/effects/reanimated/use-staggered-item', () => ({
  useStaggeredItem: vi.fn(() => ({
    opacity: { get: () => 1 },
    y: { get: () => 0 },
  })),
}));

describe('NotificationCenter', () => {
  const mockNotifications: Notification[] = [
    {
      id: '1',
      type: 'match',
      title: 'New Match!',
      message: 'You matched with Fluffy',
      timestamp: Date.now() - 1000,
      read: false,
    },
    {
      id: '2',
      type: 'message',
      title: 'New Message',
      message: 'You have a new message',
      timestamp: Date.now() - 3600000,
      read: true,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockSetNotifications.mockImplementation((updater: unknown) => {
      if (typeof updater === 'function') {
        return (updater as (prev: Notification[]) => Notification[])(mockNotifications);
      }
      return updater as Notification[];
    });
  });

  it('renders notification bell button', () => {
    render(<NotificationCenter />);
    
    const button = screen.getByLabelText(/Notifications/);
    expect(button).toBeInTheDocument();
  });

  it('shows unread count badge', () => {
    render(<NotificationCenter />);
    
    const badge = screen.getByText('1');
    expect(badge).toBeInTheDocument();
  });

  it('opens popover when button is clicked', async () => {
    const user = userEvent.setup();
    render(<NotificationCenter />);
    
    const button = screen.getByLabelText(/Notifications/);
    await user.click(button);
    
    await waitFor(() => {
      expect(screen.getByText('Notifications')).toBeInTheDocument();
    });
  });

  it('displays notifications when open', async () => {
    const user = userEvent.setup();
    render(<NotificationCenter />);
    
    const button = screen.getByLabelText(/Notifications/);
    await user.click(button);
    
    await waitFor(() => {
      expect(screen.getByText('New Match!')).toBeInTheDocument();
      expect(screen.getByText('You matched with Fluffy')).toBeInTheDocument();
    });
  });

  it('shows mark all read button when there are unread notifications', async () => {
    const user = userEvent.setup();
    render(<NotificationCenter />);
    
    const button = screen.getByLabelText(/Notifications/);
    await user.click(button);
    
    await waitFor(() => {
      expect(screen.getByText('Mark all read')).toBeInTheDocument();
    });
  });

  it('filters notifications by unread', async () => {
    const user = userEvent.setup();
    render(<NotificationCenter />);
    
    const button = screen.getByLabelText(/Notifications/);
    await user.click(button);
    
    await waitFor(() => {
      const unreadTab = screen.getByRole('tab', { name: /unread/i });
      expect(unreadTab).toBeInTheDocument();
    });
  });
});

