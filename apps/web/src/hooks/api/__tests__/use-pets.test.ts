import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { usePets, usePet, useCreatePet, useUpdatePet } from '@/hooks/api/use-pets';

vi.mock('@/lib/api-services', () => ({
  petAPI: {
    list: vi.fn(() => Promise.resolve({
      items: [
        { id: 'pet1', name: 'Fluffy', species: 'dog' },
        { id: 'pet2', name: 'Whiskers', species: 'cat' },
      ],
    })),
    getById: vi.fn((id: string) => Promise.resolve({
      id,
      name: 'Fluffy',
      species: 'dog',
    })),
    create: vi.fn((data) => Promise.resolve({
      id: 'pet3',
      ...data,
    })),
    update: vi.fn((id, data) => Promise.resolve({
      id,
      ...data,
    })),
  },
}));

describe('usePets hooks', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  describe('usePets', () => {
    it('fetches list of pets', async () => {
      const { result } = renderHook(() => usePets(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toHaveLength(2);
      expect(result.current.data?.[0]?.name).toBe('Fluffy');
    });

    it('fetches pets with filters', async () => {
      const { result } = renderHook(() => usePets({ ownerId: 'user1' }), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });
  });

  describe('usePet', () => {
    it('fetches single pet by ID', async () => {
      const { result } = renderHook(() => usePet('pet1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.id).toBe('pet1');
    });

    it('does not fetch when ID is null', () => {
      const { result } = renderHook(() => usePet(null), { wrapper });

      expect(result.current.isFetching).toBe(false);
    });
  });

  describe('useCreatePet', () => {
    it('creates a new pet', async () => {
      const { result } = renderHook(() => useCreatePet(), { wrapper });

      result.current.mutate({
        name: 'Buddy',
        species: 'dog',
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.name).toBe('Buddy');
    });
  });

  describe('useUpdatePet', () => {
    it('updates a pet', async () => {
      const { result } = renderHook(() => useUpdatePet(), { wrapper });

      result.current.mutate({
        id: 'pet1',
        name: 'Updated Name',
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.name).toBe('Updated Name');
    });
  });
});
