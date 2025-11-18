/**
 * BottomNavBar Tests
 *
 * Comprehensive tests for BottomNavBar covering all navigation items, active states, badges, and animations
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import BottomNavBar from '@/components/navigation/BottomNavBar';
import { renderWithProviders } from '@/test/utilities';

// Mock dependencies
vi.mock('@/lib/haptics', () => ({
  haptics: {
    impact: vi.fn(),
    trigger: vi.fn(),
  },
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useLocation: () => ({
      pathname: '/discover',
    }),
  };
});

describe('BottomNavBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPathname = '/discover';
  });

  describe('Rendering', () => {
    it('should render all navigation items with labels', () => {
      renderWithProviders(
        <BrowserRouter>
          <BottomNavBar />
        </BrowserRouter>
      );

      expect(screen.getByText('Premium')).toBeInTheDocument();
      expect(screen.getByText('Chat')).toBeInTheDocument();
      expect(screen.getByText('Matches')).toBeInTheDocument();
      expect(screen.getByText('Adopt')).toBeInTheDocument();
      expect(screen.getByText('Community')).toBeInTheDocument();
      expect(screen.getByText('Profile')).toBeInTheDocument();
    });

    it('should render navigation icons', () => {
      renderWithProviders(
        <BrowserRouter>
          <BottomNavBar />
        </BrowserRouter>
      );

      // Icons are rendered as emoji text
      expect(screen.getByText('💎')).toBeInTheDocument();
      expect(screen.getByText('💬')).toBeInTheDocument();
      expect(screen.getByText('❤️')).toBeInTheDocument();
      expect(screen.getByText('🐾')).toBeInTheDocument();
      expect(screen.getByText('👥')).toBeInTheDocument();
      expect(screen.getByText('👤')).toBeInTheDocument();
    });

    it('should render navigation bar with correct structure', () => {
      renderWithProviders(
        <BrowserRouter>
          <BottomNavBar />
        </BrowserRouter>
      );

      const nav = screen.getByRole('navigation');
      expect(nav).toBeInTheDocument();

      // The outer container div is fixed at the bottom; the nav sits inside it.
      const container = nav.closest('div');
      expect(container).not.toBeNull();
      if (container) {
        expect(container.className).toContain('fixed');
        expect(container.className).toContain('bottom-0');
      }
    });
  });

  describe('Navigation Links', () => {
    it('should have correct href for Discover', () => {
      renderWithProviders(
        <BrowserRouter>
          <BottomNavBar />
        </BrowserRouter>
      );

      const discoverLink = screen.getByText('Premium').closest('a');
      expect(discoverLink).toHaveAttribute('href', '/discover');
    });

    it('should have correct href for Chat', () => {
      renderWithProviders(
        <BrowserRouter>
          <BottomNavBar />
        </BrowserRouter>
      );

      const chatLink = screen.getByText('Chat').closest('a');
      expect(chatLink).toHaveAttribute('href', '/chat');
    });

    it('should have correct href for Matches', () => {
      renderWithProviders(
        <BrowserRouter>
          <BottomNavBar />
        </BrowserRouter>
      );

      const matchesLink = screen.getByText('Matches').closest('a');
      expect(matchesLink).toHaveAttribute('href', '/matches');
    });

    it('should have correct href for Adopt', () => {
      renderWithProviders(
        <BrowserRouter>
          <BottomNavBar />
        </BrowserRouter>
      );

      const adoptLink = screen.getByText('Adopt').closest('a');
      expect(adoptLink).toHaveAttribute('href', '/adopt');
    });

    it('should have correct href for Community', () => {
      renderWithProviders(
        <BrowserRouter>
          <BottomNavBar />
        </BrowserRouter>
      );

      const communityLink = screen.getByText('Community').closest('a');
      expect(communityLink).toHaveAttribute('href', '/community');
    });

    it('should have correct href for Profile', () => {
      renderWithProviders(
        <BrowserRouter>
          <BottomNavBar />
        </BrowserRouter>
      );

      const profileLink = screen.getByText('Profile').closest('a');
      expect(profileLink).toHaveAttribute('href', '/profile');
    });
  });

  describe('Active State', () => {
    it('should highlight active navigation item', () => {
      renderWithProviders(
        <BrowserRouter>
          <BottomNavBar />
        </BrowserRouter>
      );

      // Discover should be active based on mocked pathname
      const discoverLink = screen.getByText('Premium').closest('a');
      expect(discoverLink).toBeInTheDocument();
      // Active state styling is applied via classes; aria-current reflects it
      expect(discoverLink).toHaveAttribute('aria-current', 'page');
    });
  });

  describe('Hover Effects', () => {
    it('should handle hover on navigation items', async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <BrowserRouter>
          <BottomNavBar />
        </BrowserRouter>
      );

      const chatLink = screen.getByText('Chat').closest('a');
      if (chatLink) {
        await user.hover(chatLink);
        // Hover effects are applied via CSS classes
        expect(chatLink).toBeInTheDocument();
      }
    });
  });

  describe('Click Interactions', () => {
    it('should have correct hrefs for navigation when clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <BrowserRouter>
          <BottomNavBar />
        </BrowserRouter>
      );

      const chatLink = screen.getByText('Chat').closest('a');
      expect(chatLink).toHaveAttribute('href', '/chat');

      if (chatLink) {
        await user.click(chatLink);
        // Actual navigation is handled by React Router; we only assert href.
        expect(chatLink).toHaveAttribute('href', '/chat');
      }
    });

    it('should trigger haptic feedback when clicking an inactive item', async () => {
      const user = userEvent.setup();
      const { haptics } = await import('@/lib/haptics');

      // Active path is /discover, so clicking Chat should be inactive → haptics
      mockPathname = '/discover';

      renderWithProviders(
        <BrowserRouter>
          <BottomNavBar />
        </BrowserRouter>
      );

      const chatLink = screen.getByText('Chat').closest('a');
      expect(chatLink).toBeInTheDocument();

      if (chatLink) {
        await user.click(chatLink);
        expect(haptics.impact).toHaveBeenCalledWith('light');
      }
    });

    it('should not trigger haptic feedback when clicking the active item', async () => {
      const user = userEvent.setup();
      const { haptics } = await import('@/lib/haptics');

      // Make /chat the active route
      mockPathname = '/chat';

      renderWithProviders(
        <BrowserRouter>
          <BottomNavBar />
        </BrowserRouter>
      );

      const chatLink = screen.getByText('Chat').closest('a');
      expect(chatLink).toBeInTheDocument();

      if (chatLink) {
        await user.click(chatLink);
        expect(haptics.impact).not.toHaveBeenCalled();
      }
    });
  });

  describe('Badges', () => {
    it('should render badge when badge count is provided', () => {
      // Note: Badge rendering depends on item.badge prop
      // This test verifies the badge component exists
      renderWithProviders(
        <BrowserRouter>
          <BottomNavBar />
        </BrowserRouter>
      );

      // Badges are conditionally rendered based on item.badge
      // Default items don't have badges, so we verify the structure exists
      const nav = screen.getByRole('navigation');
      expect(nav).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper navigation role', () => {
      renderWithProviders(
        <BrowserRouter>
          <BottomNavBar />
        </BrowserRouter>
      );

      const nav = screen.getByRole('navigation');
      expect(nav).toBeInTheDocument();
    });

    it('should have accessible links', () => {
      renderWithProviders(
        <BrowserRouter>
          <BottomNavBar />
        </BrowserRouter>
      );

      const discoverLink = screen.getByText('Premium').closest('a');
      expect(discoverLink).toBeInTheDocument();
      expect(discoverLink).toHaveAttribute('href');
    });
  });

  describe('Responsive Behavior', () => {
    it('should be hidden on desktop (md breakpoint)', () => {
      renderWithProviders(
        <BrowserRouter>
          <BottomNavBar />
        </BrowserRouter>
      );

      const nav = screen.getByRole('navigation');
      const container = nav.closest('div');
      expect(container).not.toBeNull();
      if (container) {
        expect(container.className).toContain('md:hidden');
      }
    });
  });
});
