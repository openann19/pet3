import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react-native';
import { MatchingScreen } from '@/screens/MatchingScreen';
import type { UseQueryResult } from '@tanstack/react-query';
import type { PaginatedResponse } from '@/types/api';
import type { PetProfile } from '@/types/pet';

vi.mock('@mobile/hooks/use-pets', () => ({
  usePets: vi.fn(() => ({
    data: {
      items: [
        { id: 'pet1', name: 'Fluffy', photos: ['/photo1.jpg'] },
        { id: 'pet2', name: 'Buddy', photos: ['/photo2.jpg'] },
      ],
    },
    isLoading: false,
    error: null,
    refetch: vi.fn(() => Promise.resolve()),
  })),
  useLikePet: vi.fn(() => ({
    mutate: vi.fn(),
  })),
  useDislikePet: vi.fn(() => ({
    mutate: vi.fn(),
  })),
}));

vi.mock('@mobile/store/user-store', () => ({
  useUserStore: vi.fn(() => ({
    user: {
      pets: [{ id: 'user-pet1', name: 'My Pet' }],
    },
  })),
}));

vi.mock('expo-haptics', () => ({
  impactAsync: vi.fn(() => Promise.resolve()),
  notificationAsync: vi.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
  },
  NotificationFeedbackType: {
    Success: 'success',
  },
}));

vi.mock('react-native-reanimated', () => ({
  default: {
    View: ({ children }: { children: React.ReactNode }) => children,
  },
  FadeIn: { duration: vi.fn(() => ({})) },
  FadeOut: { duration: vi.fn(() => ({})) },
  SlideInDown: {},
  SlideOutDown: {},
}));

describe('MatchingScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders matching screen', () => {
    render(<MatchingScreen />);

    expect(screen).toBeDefined();
  });

  it('shows loading state', async () => {
    const usePetsModule = await import('@mobile/hooks/use-pets');
    const mockReturnValue = {
      data: undefined,
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    } as unknown as UseQueryResult<PaginatedResponse<PetProfile>>;
    vi.mocked(usePetsModule.usePets).mockReturnValueOnce(mockReturnValue);

    render(<MatchingScreen />);

    expect(screen.getByText('Loading pets...')).toBeDefined();
  });

  it('shows error state', async () => {
    const usePetsModule = await import('@mobile/hooks/use-pets');
    const mockReturnValue = {
      data: undefined,
      isLoading: false,
      error: new Error('Failed to load'),
      refetch: vi.fn(),
    } as unknown as UseQueryResult<PaginatedResponse<PetProfile>>;
    vi.mocked(usePetsModule.usePets).mockReturnValueOnce(mockReturnValue);

    render(<MatchingScreen />);

    expect(screen.getByText('Failed to load pets')).toBeDefined();
  });

  it('shows empty state when no pets', async () => {
    const usePetsModule = await import('@mobile/hooks/use-pets');
    const mockReturnValue = {
      data: { items: [], total: 0, nextCursor: undefined },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as UseQueryResult<PaginatedResponse<PetProfile>>;
    vi.mocked(usePetsModule.usePets).mockReturnValueOnce(mockReturnValue);

    render(<MatchingScreen />);

    expect(screen.getByText(/No more pets|No pets available/i)).toBeDefined();
  });
});
